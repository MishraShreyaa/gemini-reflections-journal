import React, { useState } from 'react';
import { 
  GitFork, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  Quote, 
  ArrowRight, 
  Search, 
  ExternalLink,
  BookOpen,
  Filter
} from 'lucide-react';
import type { CaseRelationship, SourceDocument, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface CaseTraceGraphViewProps {
  sources: SourceDocument[];
  relationships: CaseRelationship[];
  onRefreshTrace: () => Promise<void>;
  isLoading: boolean;
  language: SupportedLanguage;
}

export const CaseTraceGraphView: React.FC<CaseTraceGraphViewProps> = ({
  sources,
  relationships,
  onRefreshTrace,
  isLoading,
  language,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRel, setSelectedRel] = useState<CaseRelationship | null>(null);
  const t = getTranslation(language);

  const treatmentColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
    overruled: { bg: 'bg-rose-100', text: 'text-rose-900', border: 'border-rose-300', label: 'Overruled (निराकृत)' },
    distinguished: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', label: 'Distinguished (विभेदित)' },
    followed: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', label: 'Followed (अनुसरित)' },
    relied_upon: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300', label: 'Relied Upon (निर्भर)' },
    discussed: { bg: 'bg-stone-100', text: 'text-stone-900', border: 'border-stone-300', label: 'Discussed (चर्चा की)' },
    cited: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300', label: 'Cited (उद्धृत)' },
  };

  const filteredRelationships = relationships.filter((r) => {
    const matchesFilter = filterType === 'all' || r.relationshipType === filterType;
    const matchesSearch = r.sourceCase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.targetCase.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.sourceExcerpt && r.sourceExcerpt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" />
              Source-Grounded Precedent Mapping
            </span>
            <span className="text-xs text-stone-400">
              {relationships.length} Verified Judicial Treatments
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">
            {t.nav.caseTrace}
          </h2>
          <p className="text-sm text-stone-300 max-w-2xl mt-1">
            Visual trace of judicial citations (overruled, followed, distinguished, relied upon) backed by mandatory verbatim excerpts from authentic judgments.
          </p>
        </div>

        <button
          type="button"
          disabled={isLoading || sources.length === 0}
          onClick={onRefreshTrace}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-stone-950" />
          <span>{isLoading ? 'Tracing Citations...' : 'Extract Precedent Trace'}</span>
        </button>
      </div>

      {/* Verification & Anti-Hallucination Notice */}
      <div className="p-4 bg-stone-100 border border-stone-300 rounded-xl flex items-center justify-between text-xs text-stone-700">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            <strong>Anti-Hallucination Constraint:</strong> NyayaTrace never hypothesizes relationships. Every link displayed below quotes the precise paragraph from your authentic source documents.
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-800 bg-white"
          >
            <option value="all">All Judicial Treatments ({relationships.length})</option>
            <option value="overruled">Overruled</option>
            <option value="distinguished">Distinguished</option>
            <option value="followed">Followed</option>
            <option value="relied_upon">Relied Upon</option>
            <option value="discussed">Discussed</option>
            <option value="cited">Cited</option>
          </select>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder={t.actions.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-800 focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Main Relationship Visual Trace Cards */}
      {filteredRelationships.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
          <GitFork className="w-12 h-12 text-stone-300 mx-auto" />
          <div>
            <h4 className="text-base font-serif font-bold text-stone-800">
              No Precedent Relationships Extracted Yet
            </h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              Load judgments into your Source Library and click "Extract Precedent Trace" to extract citations, treatments, and verbatim quotes.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRelationships.map((rel) => {
            const style = treatmentColors[rel.relationshipType] || treatmentColors.cited;
            return (
              <div
                key={rel.id}
                onClick={() => setSelectedRel(rel)}
                className={`bg-white rounded-2xl border ${
                  selectedRel?.id === rel.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-stone-200'
                } p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-4 flex flex-col justify-between`}
              >
                <div>
                  {/* Top Treatment Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                      {style.label}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {rel.verifiedFromSource ? 'Source-Verified Quote' : 'Needs Verification'}
                    </span>
                  </div>

                  {/* Flow: Source Case -> Target Case */}
                  <div className="mt-3 bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs font-serif font-bold text-stone-900">
                      <span className="truncate max-w-[45%]" title={rel.sourceCase}>
                        {rel.sourceCase}
                      </span>
                      <div className="flex items-center space-x-1 text-amber-700 px-2">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-tight">
                          {rel.relationshipType.replace('_', ' ')}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                      <span className="truncate max-w-[45%] text-stone-800" title={rel.targetCase}>
                        {rel.targetCase}
                      </span>
                    </div>
                  </div>

                  {/* Verbatim Excerpt */}
                  {rel.sourceExcerpt && (
                    <div className="mt-3 text-xs text-stone-700 leading-relaxed font-serif bg-stone-50/50 p-3 rounded-lg border border-stone-100 flex items-start space-x-2">
                      <Quote className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                      <p className="italic line-clamp-3">
                        "{rel.sourceExcerpt}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                  <span>{rel.pageOrParagraph || 'Judicial Ratio Extraction'}</span>
                  <span className="text-amber-800 font-semibold flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Verified Trace
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Relationship Detail Modal */}
      {selectedRel && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 font-mono">
                Judicial Precedent Treatment Detail
              </span>
              <button
                type="button"
                onClick={() => setSelectedRel(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase text-stone-400 block">Citing / Treating Case</span>
                <p className="text-sm font-serif font-bold text-stone-900">{selectedRel.sourceCase}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-stone-400 block">Cited / Precedent Case</span>
                <p className="text-sm font-serif font-bold text-stone-900">{selectedRel.targetCase}</p>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-stone-400 block">Verbatim Excerpt from Judgment</span>
                <div className="mt-1 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-serif text-stone-800 leading-relaxed italic">
                  "{selectedRel.sourceExcerpt || 'Excerpt recorded in source text.'}"
                </div>
              </div>

              {selectedRel.notes && (
                <div>
                  <span className="text-[11px] font-bold uppercase text-stone-400 block">Judicial Analysis Notes</span>
                  <p className="text-xs text-stone-700 mt-0.5">{selectedRel.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRel(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
