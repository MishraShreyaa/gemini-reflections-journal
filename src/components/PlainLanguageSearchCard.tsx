import React from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Search, 
  RefreshCw, 
  Scale, 
  ShieldCheck, 
  SlidersHorizontal,
  FileSearch,
  MessageSquare
} from 'lucide-react';
import type { SupportedLanguage } from '../types';

interface PlainLanguageSearchCardProps {
  plainInput: string;
  setPlainInput: (val: string) => void;
  onExecuteSearch: (query?: string) => Promise<void>;
  isLoading: boolean;
  onToggleFilters: () => void;
  showFilters: boolean;
  hasActiveFilters: boolean;
  onTestNonexistentCase: () => Promise<void>;
  language: SupportedLanguage;
}

export const PlainLanguageSearchCard: React.FC<PlainLanguageSearchCardProps> = ({
  plainInput,
  setPlainInput,
  onExecuteSearch,
  isLoading,
  onToggleFilters,
  showFilters,
  hasActiveFilters,
  onTestNonexistentCase,
}) => {
  const everydayPresets = [
    {
      title: '🏠 Security Deposit Withheld',
      scenario: 'My landlord has not returned my security deposit of ₹50,000 after 3 months of vacating the flat, and is demanding arbitrary painting and maintenance deductions without any bill.',
      tags: ['Tenancy Law', 'Security Deposit', 'Unjust Enrichment'],
    },
    {
      title: '🚔 Detained Without Being Told Why',
      scenario: 'Police officers took my relative into custody at night without giving any reason, refusing to show an arrest warrant or arrest memo, and not informing our family where they were taking him.',
      tags: ['Arrest Rights', 'Article 22(1)', 'Arrest Memo / D.K. Basu'],
    },
    {
      title: '📦 Defective Product & No Refund',
      scenario: 'I purchased an electronic appliance online that arrived damaged and non-functional, but the company customer support refuses to replace or refund it, claiming an "as-is" return policy.',
      tags: ['Consumer Protection', 'Deficiency in Service', 'Refund Rights'],
    },
    {
      title: '💼 Salary Deducted Without Notice',
      scenario: 'My employer withheld my last two months of salary and gratuity after I resigned with full 30 days notice, falsely claiming business losses due to market conditions.',
      tags: ['Payment of Wages', 'Employment Rights', 'Arbitrary Withholding'],
    },
    {
      title: '🛂 Passport Withheld by Government',
      scenario: 'Government authorities cancelled and impounded my travel passport without giving any show-cause notice or opportunity for me to explain my case, restricting my freedom of movement.',
      tags: ['Personal Liberty', 'Natural Justice', 'Article 21 / Maneka Gandhi'],
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
      
      {/* Header with Friendly Public Guidance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Public Legal Translation
            </span>
            <span className="text-[11px] text-stone-500 font-medium">
              No legal knowledge required
            </span>
          </div>
          <h3 className="text-base font-serif font-bold text-stone-900 mt-1">
            Describe what happened in your own words:
          </h3>
          <p className="text-xs text-stone-500">
            Tell us your situation naturally. NyayaTrace will translate it into legal concepts and search only verified authentic judgments.
          </p>
        </div>
      </div>

      {/* Large Everyday Input Box */}
      <div className="space-y-2">
        <textarea
          rows={4}
          value={plainInput}
          onChange={(e) => setPlainInput(e.target.value)}
          placeholder="For example: 'My landlord refuses to return my security deposit after I vacated the apartment, claiming arbitrary painting deductions with no proof...' or 'I was detained by police without any explanation or arrest memo...'"
          className="w-full p-4 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 bg-stone-50/50 resize-y leading-relaxed font-sans"
        />

        {/* Real-Life Everyday Presets */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            Common Everyday Situations (Click to load):
          </span>
          <div className="flex flex-wrap gap-2">
            {everydayPresets.map((ep, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPlainInput(ep.scenario);
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-950 border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer text-left flex items-center gap-1.5 font-medium"
              >
                <span>{ep.title}</span>
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
          onClick={() => onExecuteSearch()}
          disabled={isLoading || !plainInput.trim()}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center space-x-2 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
              <span>Translating & Searching Authenticated Sources...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-stone-950" />
              <span>Find Relevant Verified Judgments</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
