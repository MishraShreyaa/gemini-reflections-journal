import React, { useState } from 'react';
import { 
  Scale, 
  FileText, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Bookmark, 
  Building, 
  Calendar, 
  Quote, 
  Share2, 
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import type { CaseAnalysis, SourceDocument, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface StructuredCaseAnalysisViewProps {
  sources: SourceDocument[];
  selectedSource: SourceDocument | null;
  onSelectSource: (source: SourceDocument) => void;
  analysis: CaseAnalysis | null;
  isLoading: boolean;
  onRunAnalysis: (source: SourceDocument) => Promise<void>;
  onSaveFinding: (title: string, text: string, sourceLocation?: string) => Promise<void>;
  language: SupportedLanguage;
}

export const StructuredCaseAnalysisView: React.FC<StructuredCaseAnalysisViewProps> = ({
  sources,
  selectedSource,
  onSelectSource,
  analysis,
  isLoading,
  onRunAnalysis,
  onSaveFinding,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'ratio' | 'facts' | 'issues' | 'statutes' | 'citations' | 'full'>('ratio');
  const [savedSuccessKey, setSavedSuccessKey] = useState<string | null>(null);
  const t = getTranslation(language);

  const handleSaveSnippet = async (title: string, text: string, location?: string) => {
    await onSaveFinding(title, text, location);
    setSavedSuccessKey(title);
    setTimeout(() => setSavedSuccessKey(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Source-Grounded Structural Breakdown
            </span>
            <span className="text-xs text-stone-400">
              Ratio Decidendi, Issues & Precedents
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">
            {t.actions.analyzeCase}
          </h2>
          <p className="text-sm text-stone-300 max-w-2xl mt-1">
            Strictly derived judicial ratio, legal arguments, and statutory sections extracted without speculative inference.
          </p>
        </div>

        {/* Source Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedSource?.id || ''}
            onChange={(e) => {
              const src = sources.find((s) => s.id === e.target.value);
              if (src) onSelectSource(src);
            }}
            className="px-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800 text-xs text-stone-200 focus:ring-2 focus:ring-amber-500 font-serif"
          >
            <option value="" disabled>Select Source Judgment...</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.court || 'Court'})
              </option>
            ))}
          </select>

          {selectedSource && (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onRunAnalysis(selectedSource)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              <Sparkles className="w-4 h-4 text-stone-950" />
              <span>{isLoading ? 'Analyzing...' : 'Generate Analysis'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Analysis Body */}
      {!selectedSource ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-stone-300 mx-auto" />
          <h4 className="text-base font-serif font-bold text-stone-800">
            No Primary Source Selected
          </h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Choose an authentic judgment or statute from your repository above, or add primary documents in your Source Library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Document Provenance & Verification Badge */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Metadata Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">
                  Primary Source Record
                </span>
                <h3 className="text-base font-serif font-bold text-stone-900 leading-snug">
                  {selectedSource.title}
                </h3>
              </div>

              {/* Status Badge */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500 font-medium">Verification Status:</span>
                  {selectedSource.verificationStatus === 'verified' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {t.labels.verifiedSource}
                    </span>
                  )}
                  {selectedSource.verificationStatus === 'user_provided_needs_verification' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      {t.labels.userProvidedNeedsVerification}
                    </span>
                  )}
                </div>

                {selectedSource.citation && (
                  <div className="flex items-start justify-between">
                    <span className="text-stone-500 font-medium">Citation:</span>
                    <span className="font-mono text-stone-900 font-semibold">{selectedSource.citation}</span>
                  </div>
                )}

                {selectedSource.court && (
                  <div className="flex items-start justify-between">
                    <span className="text-stone-500 font-medium">Bench / Court:</span>
                    <span className="text-stone-800 font-serif">{selectedSource.court}</span>
                  </div>
                )}

                {selectedSource.judgmentDate && (
                  <div className="flex items-start justify-between">
                    <span className="text-stone-500 font-medium">Judgment Date:</span>
                    <span className="font-mono text-stone-800">{selectedSource.judgmentDate}</span>
                  </div>
                )}
              </div>

              {/* Raw Excerpt Viewer */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Primary Text Sample (First 600 Chars)
                </span>
                <div className="p-3 bg-stone-900 text-stone-300 rounded-xl font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto border border-stone-800">
                  {selectedSource.rawText.slice(0, 600)}...
                </div>
              </div>
            </div>

            {/* AI Warning Box */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>AI Summarization Distinction</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                The structured breakdown opposite is an <strong>AI-assisted executive summarization</strong> of the attached primary source. All legal identifiers are preserved in original format.
              </p>
            </div>
          </div>

          {/* Right Column: Structured Analysis Tabs & Content */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Tab Navigation */}
            <div className="bg-white p-2 rounded-xl border border-stone-200 flex flex-wrap gap-1.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('ratio')}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'ratio' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {t.labels.ratioDecidendi}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('facts')}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'facts' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Facts Summary
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('issues')}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'issues' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {t.labels.legalIssues}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('citations')}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'citations' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {t.labels.casesCited}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('full')}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'full' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Full Judgment Text
              </button>
            </div>

            {/* Active Tab View */}
            {!analysis ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
                <Sparkles className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
                <div>
                  <h4 className="text-base font-serif font-bold text-stone-900">
                    Analysis Not Yet Executed for this Document
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                    Click "Generate Analysis" above to parse this primary judgment into legal ratios, arguments, and statutory scopes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRunAnalysis(selectedSource)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-xl hover:bg-stone-800 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? 'Processing...' : 'Run Structured Parsing'}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
                
                {/* TAB 1: RATIO DECIDENDI & HOLDINGS */}
                {activeTab === 'ratio' && (
                  <div className="space-y-6">
                    {/* Ratio Box */}
                    <div className="p-5 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          Operative Ratio Decidendi
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSaveSnippet('Ratio Decidendi', analysis.ratioDecidendi, selectedSource.title)}
                          className="inline-flex items-center space-x-1 text-xs text-amber-900 font-semibold hover:text-amber-950"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{savedSuccessKey === 'Ratio Decidendi' ? 'Saved!' : 'Save Ratio to Vault'}</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm text-stone-800 font-serif leading-relaxed whitespace-pre-line">
                        {analysis.ratioDecidendi}
                      </p>
                    </div>

                    {/* Decision / Final Order */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Final Decision & Judicial Holding
                      </h4>
                      <p className="text-xs sm:text-sm text-stone-800 font-serif leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-200">
                        {analysis.decision}
                      </p>
                    </div>

                    {/* Reasoning */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                        Core Judicial Reasoning
                      </h4>
                      <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-serif bg-stone-50 p-4 rounded-xl border border-stone-200 whitespace-pre-line">
                        {analysis.reasoning}
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: FACTS SUMMARY */}
                {activeTab === 'facts' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-serif font-bold text-stone-900">
                        Factual Matrix & Procedural History
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleSaveSnippet('Case Facts', analysis.facts, selectedSource.title)}
                        className="inline-flex items-center space-x-1 text-xs text-amber-900 font-semibold hover:text-amber-950"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                        <span>{savedSuccessKey === 'Case Facts' ? 'Saved!' : 'Save Facts'}</span>
                      </button>
                    </div>
                    <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs sm:text-sm text-stone-800 leading-relaxed font-serif whitespace-pre-line">
                      {analysis.facts}
                    </div>
                  </div>
                )}

                {/* TAB 3: LEGAL ISSUES */}
                {activeTab === 'issues' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-serif font-bold text-stone-900">
                      Substantial Questions of Law Framed
                    </h4>
                    <div className="space-y-2">
                      {analysis.legalIssues.map((issue, idx) => (
                        <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 font-serif flex items-start space-x-2.5">
                          <span className="w-5 h-5 rounded-full bg-stone-900 text-white flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: CASES CITED & PRECEDENTS */}
                {activeTab === 'citations' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-serif font-bold text-stone-900">
                      Precedents & Authorities Cited in Judgment
                    </h4>
                    <div className="space-y-3">
                      {analysis.casesCited?.length === 0 ? (
                        <p className="text-xs text-stone-500">No external case citations detected in source text.</p>
                      ) : (
                        analysis.casesCited?.map((c, idx) => (
                          <div key={idx} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-serif font-bold text-stone-900">{c.name}</h5>
                              {c.treatment && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-900 uppercase">
                                  {c.treatment}
                                </span>
                              )}
                            </div>
                            {c.citation && <p className="text-[11px] font-mono text-stone-600">{c.citation}</p>}
                            {c.sourceExcerpt && (
                              <p className="text-xs italic font-serif text-stone-700 bg-white p-2.5 rounded border border-stone-200">
                                "{c.sourceExcerpt}"
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: FULL JUDGMENT TEXT */}
                {activeTab === 'full' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-stone-500">Complete Primary Source Text</h4>
                      <span className="text-[11px] font-mono text-stone-400">
                        {selectedSource.rawText.length.toLocaleString()} characters
                      </span>
                    </div>
                    <div className="p-4 bg-stone-900 text-stone-200 rounded-xl font-mono text-xs leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap border border-stone-800">
                      {selectedSource.rawText}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
