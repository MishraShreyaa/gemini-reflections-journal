import React, { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';
import { 
  X, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Quote, 
  Building2, 
  Bookmark, 
  Scale, 
  Sparkles,
  Layers,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import type { SourceDocument, SupportedLanguage, JudgmentSummary } from '../types';

interface SummarizeJudgmentModalProps {
  source: SourceDocument;
  userSituation?: string;
  language: SupportedLanguage;
  onClose: () => void;
  onSaveFinding: (title: string, text: string, location: string) => Promise<void>;
}

export const SummarizeJudgmentModal: React.FC<SummarizeJudgmentModalProps> = ({
  source,
  userSituation,
  language,
  onClose,
  onSaveFinding,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<JudgmentSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/nyaya/summarize-judgment', {
          method: 'POST',
          body: JSON.stringify({
            documentTitle: source.title,
            caseName: source.title,
            sourceText: source.rawText,
            judgmentText: source.rawText,
            citation: source.citation,
            court: source.court,
            language,
            userSituation: userSituation || '',
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || 'Failed to summarize judgment in plain language.');
        }

        const data = await res.json();
        setSummaryData(data.summary || data);
      } catch (err: any) {
        console.error('Error fetching summary:', err);
        setError(err.message || 'Failed to synthesize summary.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [source, language, userSituation]);

  const handleSave = async () => {
    if (!summaryData) return;
    const textToSave = `Plain-Language Overview:\n${summaryData.plainLanguageOverview}\n\nCore Holding / Ratio:\n${summaryData.coreHoldingRatio}\n\nRelevance:\n${summaryData.relevanceToUserSituation}`;
    await onSaveFinding(
      `Plain Summary: ${summaryData.caseName}`,
      textToSave,
      `${source.title} (${summaryData.citation || 'Source Document'})`
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-stone-300 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Plain-Language Synthesis
            </span>
            <h3 className="text-lg font-serif font-bold text-stone-900 mt-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              {source.title}
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              {source.citation || 'Source Judgment'} • {source.court || 'Court of Record'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-stone-500">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
            <p className="text-xs font-medium">
              Generating plain-language breakdown and extracting core ratio from authentic text...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : summaryData ? (
          <div className="space-y-4 text-xs">
            
            {/* 1. Plain Language Overview */}
            <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl space-y-1.5">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                What this judgment means in plain language (For Everyone):
              </span>
              <p className="text-stone-800 leading-relaxed font-sans text-xs sm:text-sm whitespace-pre-line">
                {summaryData.plainLanguageOverview}
              </p>
            </div>

            {/* 2. Core Holding / Ratio Decidendi */}
            <div className="bg-stone-900 text-stone-100 p-4 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-amber-400 font-mono uppercase tracking-wider block">
                Core Holding / Binding Ratio Decidendi:
              </span>
              <p className="text-stone-100 font-serif leading-relaxed text-xs sm:text-sm">
                {summaryData.coreHoldingRatio}
              </p>
            </div>

            {/* 3. Material Facts & Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">
                  Material Facts of the Dispute:
                </span>
                <p className="text-stone-600 leading-relaxed">
                  {summaryData.materialFactsSummary}
                </p>
              </div>

              {/* 4. Statutes & Tests Applied */}
              <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-stone-700 uppercase tracking-wider block">
                  Statutes & Legal Tests Applied:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(summaryData.statutesAndTestsApplied || []).map((st, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white text-stone-800 border border-stone-300 rounded font-mono text-[10px]">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 5. Relevance to User's Matter */}
            {summaryData.relevanceToUserSituation && (
              <div className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                  How this applies to situations like yours:
                </span>
                <p className="text-stone-700 leading-relaxed">
                  {summaryData.relevanceToUserSituation}
                </p>
              </div>
            )}

            {/* 6. Verbatim Quotes */}
            {(summaryData.verbatimQuotes || []).length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Key Verbatim Quotes from the Court:
                </span>
                <div className="space-y-2">
                  {summaryData.verbatimQuotes.map((vq, i) => (
                    <div key={i} className="bg-stone-50 border-l-4 border-amber-500 p-3 rounded-r-xl">
                      <p className="font-serif italic text-stone-800 text-[11px] leading-relaxed">
                        "{vq}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-800" />
                <span>{isSaved ? 'Saved to Vault!' : 'Save Plain Summary to Vault'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
};
