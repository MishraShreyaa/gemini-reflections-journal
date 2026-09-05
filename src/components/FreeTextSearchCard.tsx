import React from 'react';
import { 
  Sparkles, 
  Search, 
  RefreshCw, 
  Scale, 
  ShieldCheck, 
  SlidersHorizontal,
  FileSearch,
  BookOpen,
  Compass,
  X,
  CornerDownLeft
} from 'lucide-react';
import type { ResearchSearchMode, SupportedLanguage } from '../types';

interface FreeTextSearchCardProps {
  query: string;
  setQuery: (val: string) => void;
  searchMode: ResearchSearchMode;
  setSearchMode: (mode: ResearchSearchMode) => void;
  onExecuteSearch: (queryText?: string, mode?: ResearchSearchMode) => Promise<void>;
  isLoading: boolean;
  onToggleFilters: () => void;
  showFilters: boolean;
  hasActiveFilters: boolean;
  onTestNonexistentCase: () => Promise<void>;
  language: SupportedLanguage;
}

export const FreeTextSearchCard: React.FC<FreeTextSearchCardProps> = ({
  query,
  setQuery,
  searchMode,
  setSearchMode,
  onExecuteSearch,
  isLoading,
  onToggleFilters,
  showFilters,
  hasActiveFilters,
  onTestNonexistentCase,
}) => {
  const freeTextPresets = [
    {
      category: 'Tenancy',
      label: '🏠 Security Deposit Withheld',
      query: 'My landlord has not returned my security deposit of ₹50,000 after 3 months of vacating the flat, and is demanding arbitrary painting and maintenance deductions without any bill.',
    },
    {
      category: 'Criminal',
      label: '🚔 Custody Without Arrest Memo',
      query: 'Police officers took my relative into custody at night without giving any reason, refusing to show an arrest warrant or arrest memo, and not informing our family where they were taking him.',
    },
    {
      category: 'Consumer',
      label: '📦 Defective Product & No Refund',
      query: 'Purchased an electronic appliance online that arrived damaged and non-functional, but customer support refuses to replace or refund it citing an "as-is" return policy.',
    },
    {
      category: 'Labor',
      label: '💼 Salary Deducted Without Notice',
      query: 'Employer withheld last two months of salary and gratuity after resignation with full notice period, citing arbitrary business losses without statutory authority.',
    },
    {
      category: 'Citation',
      label: '⚖️ Kesavananda Bharati Citation',
      query: 'Kesavananda Bharati v. State of Kerala (1973) 4 SCC 225 - Basic Structure Doctrine and Article 368',
    },
    {
      category: 'Statute',
      label: '📜 Section 41A Notice of Appearance',
      query: 'Section 41A CrPC guidelines on mandatory notice of appearance before arrest in offenses punishable up to 7 years - Arnesh Kumar v. State of Bihar',
    },
    {
      category: 'Privacy',
      label: '🛡️ Right to Privacy / Article 21',
      query: 'K.S. Puttaswamy v. Union of India (2017) 10 SCC 1 - Article 21 Right to Privacy and Proportionality Standard',
    },
    {
      category: 'Succession',
      label: '👥 Coparcenary Rights by Birth',
      query: 'Vineeta Sharma v. Rakesh Sharma (2020) 9 SCC 1 - Daughter equal coparcenary rights in ancestral property by birth under Section 6 Hindu Succession Act',
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && query.trim()) {
        onExecuteSearch(query.trim(), searchMode);
      }
    }
  };

  const placeholderText = searchMode === 'case_name_citation'
    ? "Search freely by case title or official citation: e.g., 'Kesavananda Bharati v. State of Kerala', '(2018) 6 SCC 708', or 'D.K. Basu v. State of West Bengal'..."
    : searchMode === 'section_statute'
    ? "Search freely by statutory section or constitutional article: e.g., 'Section 41A CrPC', 'Article 21', 'Section 6 Hindu Succession Act', or 'Consumer Protection Act'..."
    : searchMode === 'legal_issue'
    ? "Search freely by legal question or doctrine: e.g., 'Right to Privacy proportionality test', 'arbitrary deductions from security deposit', 'deficiency in service'..."
    : "Type anything freely — everyday facts, full narratives, case names, citations, statutory sections, or legal issues (e.g., 'my landlord won\\'t return my deposit', 'Section 41A CrPC', '(1973) 4 SCC 225', 'D.K. Basu')...";

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
      
      {/* Header with Search Focus & Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Search className="w-3 h-3 text-amber-700" />
              Universal Free Text Search
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              Zero-Hallucination Authenticated Precedent Vault
            </span>
          </div>
          <h3 className="text-base font-serif font-bold text-stone-900 mt-1">
            Search verified Indian case law using any words:
          </h3>
          <p className="text-xs text-stone-500">
            Enter plain English facts, legal keywords, formal citations, or statutory sections. NyayaTrace parses your query and matches strictly against authentic verified source records.
          </p>
        </div>

        {/* Focus selector pills */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
          <button
            type="button"
            onClick={() => setSearchMode('free_text')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              searchMode === 'free_text'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Search across facts, citations, statutes, and doctrines simultaneously"
          >
            Universal
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('plain_language')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              searchMode === 'plain_language'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Focus on translating everyday language into legal concepts"
          >
            Plain Language
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('facts_similarity')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              searchMode === 'facts_similarity'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Deep factual matrix matching"
          >
            Facts
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('case_name_citation')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              searchMode === 'case_name_citation'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Focus on case names or official reporters"
          >
            Citation
          </button>
          <button
            type="button"
            onClick={() => setSearchMode('section_statute')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
              searchMode === 'section_statute'
                ? 'bg-amber-500 text-stone-950 font-bold shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Focus on statutory acts and sections"
          >
            Statute
          </button>
        </div>
      </div>

      {/* Free Text Input Box */}
      <div className="relative space-y-2">
        <div className="relative">
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholderText}
            className="w-full p-4 pr-10 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 bg-stone-50/50 resize-y leading-relaxed font-sans placeholder:text-stone-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 p-1 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-200/60 transition-colors cursor-pointer"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Keyboard shortcut hint */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
          <span>Tip: Free text searches across all legal fields, factual passages, and verified case law.</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            Press <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px] text-stone-600 font-mono">Enter ↵</kbd> to search, <kbd className="px-1.5 py-0.5 bg-stone-100 border border-stone-300 rounded text-[10px] text-stone-600 font-mono">Shift + Enter</kbd> for new line
          </span>
        </div>

        {/* Quick Sample Queries */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            Sample Free-Text Queries (Click to load):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {freeTextPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(preset.query);
                  onExecuteSearch(preset.query, searchMode);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-950 border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1 font-medium"
              >
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleFilters}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showFilters || hasActiveFilters
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>Refine Search</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={onTestNonexistentCase}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 transition-colors cursor-pointer"
            title="Verify that NyayaTrace strictly refuses fictitious authorities like State vs. Fictitious Case 1999"
          >
            🧪 Test Nonexistent Authority
          </button>
        </div>

        <button
          type="button"
          onClick={() => onExecuteSearch(query.trim(), searchMode)}
          disabled={isLoading || !query.trim()}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center space-x-2 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
              <span>Analyzing Free Text & Searching Repository...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-stone-950" />
              <span>Search Verified Judgments</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
