import React, { useState } from 'react';
import { 
  Bookmark, 
  Sparkles, 
  Trash2, 
  FileText, 
  Quote, 
  ExternalLink, 
  Clock, 
  Lock, 
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Search,
  BookOpen
} from 'lucide-react';
import type { SavedFinding, ResearchDigest, SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface SavedFindingsViewProps {
  findings: SavedFinding[];
  digest: ResearchDigest | null;
  onDeleteFinding: (findingId: string) => Promise<void>;
  onGenerateDigest: () => Promise<void>;
  isGeneratingDigest: boolean;
  language: SupportedLanguage;
}

export const SavedFindingsView: React.FC<SavedFindingsViewProps> = ({
  findings,
  digest,
  onDeleteFinding,
  onGenerateDigest,
  isGeneratingDigest,
  language,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const t = getTranslation(language);

  const filteredFindings = findings.filter((f) => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.findingText.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.sourceTitle && f.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Header */}
      <div className="bg-stone-900 text-stone-100 p-6 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Cryptographically Isolated User Vault
            </span>
            <span className="text-xs text-stone-400">
              {findings.length} Saved Legal Findings
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">
            {t.nav.savedFindings}
          </h2>
          <p className="text-sm text-stone-300 max-w-2xl mt-1">
            Your private legal notes, extracted propositions, and synthesized research digests stored strictly under your private Firestore collection path.
          </p>
        </div>

        <button
          type="button"
          disabled={isGeneratingDigest || findings.length === 0}
          onClick={onGenerateDigest}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition-all disabled:opacity-50 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-stone-950" />
          <span>{isGeneratingDigest ? 'Synthesizing Digest...' : t.actions.generateDigest}</span>
        </button>
      </div>

      {/* Security Proof Banner */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <div>
            <span className="font-semibold block">Per-User Firestore Privacy Enforced</span>
            <span className="text-emerald-800 text-[11px]">
              Access Rule: <code className="font-mono bg-emerald-100/80 px-1 py-0.5 rounded">request.auth.uid == userId</code>. No other user can view or query your saved findings.
            </span>
          </div>
        </div>
      </div>

      {/* Research Digest Card (If Available) */}
      {digest && (
        <div className="bg-amber-50/60 border border-amber-300/80 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-700" />
              <h3 className="text-base font-serif font-bold text-stone-900">
                Executive Research Digest
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-500">
              {new Date(digest.generatedAt).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-3 text-xs sm:text-sm text-stone-800 leading-relaxed font-serif">
            <p className="whitespace-pre-line bg-white/80 p-4 rounded-xl border border-amber-200 shadow-2xs font-sans">
              {digest.keyFindingsSummary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {digest.frequentlyResearchedTopics?.length > 0 && (
                <div className="p-3 bg-white/80 rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block font-sans">
                    Researched Legal Fields
                  </span>
                  <ul className="list-disc list-inside text-xs text-stone-700">
                    {digest.frequentlyResearchedTopics.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {digest.suggestedAvenuesForInvestigation?.length > 0 && (
                <div className="p-3 bg-white/80 rounded-xl border border-amber-200 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block font-sans">
                    Suggested Investigation Avenues
                  </span>
                  <ul className="list-disc list-inside text-xs text-stone-700">
                    {digest.suggestedAvenuesForInvestigation.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
          <input
            type="text"
            placeholder={t.actions.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-stone-300 text-xs text-stone-900 focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-stone-500 font-mono hidden sm:inline">
          {filteredFindings.length} items
        </span>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
          <Bookmark className="w-12 h-12 text-stone-300 mx-auto" />
          <h4 className="text-base font-serif font-bold text-stone-800">{t.labels.emptyFindings}</h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Save key judicial ratios, factual snippets, and multi-case comparisons from Structured Analysis or the Research Assistant Canvas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-sm transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-serif font-bold text-stone-900 line-clamp-2">
                    {finding.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onDeleteFinding(finding.id)}
                    className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                    title={t.actions.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-800 leading-relaxed font-serif whitespace-pre-line max-h-48 overflow-y-auto">
                  {finding.findingText}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span className="truncate max-w-[200px]" title={finding.sourceTitle || 'Workspace Record'}>
                  Source: {finding.sourceTitle || 'Workspace Record'}
                </span>
                <span className="font-mono text-[10px]">
                  {new Date(finding.savedAt || finding.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
