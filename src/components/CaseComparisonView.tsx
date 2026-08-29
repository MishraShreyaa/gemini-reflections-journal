import React, { useState } from 'react';
import { 
  Columns, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  Bookmark, 
  ArrowRight, 
  ShieldCheck, 
  Layers, 
  FileText,
  Quote
} from 'lucide-react';
import type { SourceDocument, CaseComparison, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface CaseComparisonViewProps {
  sources: SourceDocument[];
  onCompare: (cases: SourceDocument[]) => Promise<CaseComparison | null>;
  language: SupportedLanguage;
  onSaveFinding: (title: string, text: string, sourceLocation?: string) => Promise<void>;
}

export const CaseComparisonView: React.FC<CaseComparisonViewProps> = ({
  sources,
  onCompare,
  language,
  onSaveFinding,
}) => {
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<CaseComparison | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const t = getTranslation(language);

  const toggleSelectCase = (id: string) => {
    if (selectedCaseIds.includes(id)) {
      setSelectedCaseIds(selectedCaseIds.filter((cid) => cid !== id));
    } else {
      if (selectedCaseIds.length >= 3) {
        alert('You can compare a maximum of 3 cases concurrently.');
        return;
      }
      setSelectedCaseIds([...selectedCaseIds, id]);
    }
  };

  const handleRunComparison = async () => {
    const chosen = sources.filter((s) => selectedCaseIds.includes(s.id));
    if (chosen.length < 2) return;
    setIsLoading(true);
    const res = await onCompare(chosen);
    setComparisonResult(res);
    setIsLoading(false);
  };

  const handleSaveToFindings = async () => {
    if (!comparisonResult) return;
    const title = `Comparison: ${comparisonResult.casesCompared.map((c) => c.name).join(' vs ')}`;
    const text = `Similarities:\n${comparisonResult.keySimilarities.map((s) => `• ${s}`).join('\n')}\n\nDistinctions:\n${comparisonResult.keyDistinctions.map((d) => `• ${d}`).join('\n')}\n\nRatio Comparison:\n${comparisonResult.ratioComparison}`;
    await onSaveFinding(title, text, 'Case Comparison Matrix');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Columns className="w-3.5 h-3.5" />
              Side-by-Side Judicial Comparison
            </span>
            <span className="text-xs text-stone-400">
              Select 2 to 3 Primary Sources
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">
            {t.nav.caseComparison}
          </h2>
          <p className="text-sm text-stone-300 max-w-2xl mt-1">
            Compare ratio decidendi, factual matrices, and precedential treatment across authentic Indian judgments without speculative assumptions.
          </p>
        </div>

        <button
          type="button"
          disabled={selectedCaseIds.length < 2 || isLoading}
          onClick={handleRunComparison}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-stone-950" />
          <span>{isLoading ? 'Comparing Sources...' : `Compare Selected (${selectedCaseIds.length})`}</span>
        </button>
      </div>

      {/* Case Selector Strip */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
          Select Judgments from Repository to Compare (2 - 3 items):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {sources.map((src) => {
            const isSelected = selectedCaseIds.includes(src.id);
            return (
              <div
                key={src.id}
                onClick={() => toggleSelectCase(src.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-300'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                }`}
              >
                <div className="space-y-1">
                  <h4 className="text-xs font-serif font-bold text-stone-900 line-clamp-1">
                    {src.title}
                  </h4>
                  <p className="text-[11px] font-mono text-stone-500">
                    {src.citation || src.court || 'Primary Source'}
                  </p>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-stone-300'
                }`}>
                  {isSelected && <span className="text-[10px] font-bold">✓</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison Results Presentation */}
      {comparisonResult && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Action Bar for Results */}
          <div className="flex items-center justify-between bg-stone-100 p-4 rounded-xl border border-stone-300 text-xs">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-stone-700">
                <strong>Source Grounded:</strong> Comparison derived directly from primary transcripts of {comparisonResult.casesCompared.map((c) => c.name).join(', ')}.
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveToFindings}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved to Vault!' : 'Save Comparison Matrix'}</span>
            </button>
          </div>

          {/* Quick Key Similarities & Distinctions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Similarities */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-serif font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-700" />
                Key Judicial Similarities & Shared Doctrine
              </h4>
              <ul className="space-y-2 text-xs text-emerald-950 leading-relaxed">
                {comparisonResult.keySimilarities.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Distinctions */}
            <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <h4 className="text-sm font-serif font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                Key Legal Distinctions & Divergence
              </h4>
              <ul className="space-y-2 text-xs text-amber-950 leading-relaxed">
                {comparisonResult.keyDistinctions.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-700 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Detailed Comparative Breakdown Cards */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm divide-y divide-stone-200 overflow-hidden text-xs">
            
            {/* Ratio Decidendi */}
            <div className="p-6 space-y-2">
              <h4 className="text-sm font-serif font-bold text-stone-900 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] uppercase font-mono">
                  Comparative Analysis
                </span>
                Ratio Decidendi & Legal Holdings
              </h4>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line font-serif">
                {comparisonResult.ratioComparison}
              </p>
            </div>

            {/* Facts Comparison */}
            <div className="p-6 space-y-2">
              <h4 className="text-sm font-serif font-bold text-stone-900">
                Factual Matrices & Procedural Posture
              </h4>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line font-serif">
                {comparisonResult.factsComparison}
              </p>
            </div>

            {/* Legal Issues */}
            <div className="p-6 space-y-2">
              <h4 className="text-sm font-serif font-bold text-stone-900">
                Substantial Legal Issues Framed
              </h4>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line font-serif">
                {comparisonResult.issuesComparison}
              </p>
            </div>

            {/* Statutory Provisions */}
            <div className="p-6 space-y-2">
              <h4 className="text-sm font-serif font-bold text-stone-900">
                Statutory Provisions & Constitutional Articles Compared
              </h4>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line font-serif">
                {comparisonResult.statutoryProvisionsComparison}
              </p>
            </div>

            {/* Treatment of Precedents */}
            <div className="p-6 space-y-2">
              <h4 className="text-sm font-serif font-bold text-stone-900">
                Judicial Treatment of Prior Authorities
              </h4>
              <p className="text-stone-700 leading-relaxed whitespace-pre-line font-serif">
                {comparisonResult.treatmentOfPrecedents}
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
