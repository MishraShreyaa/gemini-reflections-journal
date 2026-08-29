import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  BookOpen, 
  Bookmark, 
  MessageSquare, 
  Quote, 
  ShieldCheck, 
  Plus, 
  FileText, 
  CornerDownRight,
  Info,
  Scale,
  RefreshCw,
  Search,
  Filter,
  SlidersHorizontal,
  FileSearch,
  BookMarked,
  ArrowRight,
  ExternalLink,
  Check,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  GitCompare,
  AlertTriangle,
  Building2,
  Calendar,
  Compass,
  HelpCircle
} from 'lucide-react';
import type { 
  ResearchSession, 
  SourceDocument, 
  SupportedLanguage, 
  ResearchChatMessage,
  ResearchSearchMode,
  FactSearchResult,
  FactSearchResponse,
  FactSearchFilter,
  ExtractedFactElements
} from '../types';
import { getTranslation } from '../lib/i18n';
import { PlainLanguageSearchCard } from './PlainLanguageSearchCard';
import { AskJudgmentModal } from './AskJudgmentModal';
import { SummarizeJudgmentModal } from './SummarizeJudgmentModal';

interface ResearchAssistantCanvasProps {
  currentSession: ResearchSession;
  sources: SourceDocument[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  onSaveFinding: (title: string, text: string, sourceLocation?: string) => Promise<void>;
  onNewSession: () => void;
  language: SupportedLanguage;
  onSelectSource: (source: SourceDocument) => void;
}

export const ResearchAssistantCanvas: React.FC<ResearchAssistantCanvasProps> = ({
  currentSession,
  sources,
  onSendMessage,
  isLoading,
  onSaveFinding,
  onNewSession,
  language,
  onSelectSource,
}) => {
  // Search Mode & Inputs
  const [searchMode, setSearchMode] = useState<ResearchSearchMode>('plain_language');
  const [plainInput, setPlainInput] = useState('');
  const [factInput, setFactInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  // Refinement Filters
  const [showFilters, setShowFilters] = useState(false);
  const [courtFilter, setCourtFilter] = useState('all');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('all');
  const [legalProvisionFilter, setLegalProvisionFilter] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minRelevance, setMinRelevance] = useState(0);

  // Fact Search State
  const [isFactSearching, setIsFactSearching] = useState(false);
  const [factSearchResults, setFactSearchResults] = useState<FactSearchResult[]>([]);
  const [extractedFacts, setExtractedFacts] = useState<ExtractedFactElements | null>(null);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [noMatchFound, setNoMatchFound] = useState(false);
  const [evidenceSufficiency, setEvidenceSufficiency] = useState<'sufficient' | 'partial' | 'none'>('sufficient');
  const [hasSearched, setHasSearched] = useState(false);

  // Active Modals
  const [selectedComparisonResult, setSelectedComparisonResult] = useState<FactSearchResult | null>(null);
  const [selectedAskSource, setSelectedAskSource] = useState<SourceDocument | null>(null);
  const [selectedSummarizeSource, setSelectedSummarizeSource] = useState<SourceDocument | null>(null);

  // View Mode: 'search' | 'chat'
  const [activeTab, setActiveTab] = useState<'search' | 'chat'>('search');

  // Finding Saved Feedback
  const [savedId, setSavedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(language);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession.messages, isLoading, activeTab]);

  // Execute Fact-Based Search / Case Search / Plain Language Search
  const handleExecuteSearch = async (queryText?: string) => {
    let textToSearch = queryText;
    if (!textToSearch) {
      if (searchMode === 'plain_language') {
        textToSearch = plainInput;
      } else if (searchMode === 'facts_similarity') {
        textToSearch = factInput;
      } else {
        textToSearch = searchQuery;
      }
    }
    
    if (!textToSearch || !textToSearch.trim()) return;

    setIsFactSearching(true);
    setHasSearched(true);
    setSearchNotice(null);
    setNoMatchFound(false);

    try {
      const filters: FactSearchFilter = {
        court: courtFilter !== 'all' ? courtFilter : undefined,
        documentType: documentTypeFilter !== 'all' ? documentTypeFilter : undefined,
        legalProvision: legalProvisionFilter.trim() || undefined,
        verifiedOnly: verifiedOnly,
        minRelevance: minRelevance,
      };

      const response = await fetch('/api/nyaya/fact-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchMode,
          query: textToSearch.trim(),
          sources,
          filters,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute search across source repository.');
      }

      const data: FactSearchResponse = await response.json();
      setExtractedFacts(data.extractedFacts || null);
      
      // Apply client-side minRelevance filter if set
      let filteredResults = data.results || [];
      if (minRelevance > 0) {
        filteredResults = filteredResults.filter(r => r.overallRelevanceScore >= minRelevance);
      }

      setFactSearchResults(filteredResults);
      setNoMatchFound(data.noMatchFound || filteredResults.length === 0);
      setEvidenceSufficiency(data.evidenceSufficiency || (filteredResults.length > 0 ? 'sufficient' : 'none'));
      setSearchNotice(data.systemNotice);
    } catch (err: any) {
      console.error('Search error:', err);
      setSearchNotice('Error executing search: ' + err.message);
      setNoMatchFound(true);
      setFactSearchResults([]);
    } finally {
      setIsFactSearching(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;
    const text = chatInput.trim();
    setChatInput('');
    await onSendMessage(text);
  };

  const handleSaveFindingClick = async (title: string, text: string, location: string, id: string) => {
    await onSaveFinding(title, text, location);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 3000);
  };

  // Preset Inquiries
  const sampleFactScenarios = [
    {
      title: 'Arrest without Grounds Informed',
      query: 'The accused was arrested by the investigating authority without being furnished the written grounds of arrest and challenges the validity of custody under Article 22(1) of the Constitution and Section 50 CrPC.',
      provision: 'Article 22(1), Section 50 CrPC',
    },
    {
      title: 'Passport Impoundment without Notice',
      query: 'The regional passport office impounded petitioner passport under Section 10(3)(c) without granting post-decisional or pre-decisional hearing, violating natural justice and personal liberty under Article 21.',
      provision: 'Article 21, Passport Act',
    },
    {
      title: 'Biometric Surveillance & Privacy',
      query: 'State collected mandatory biometric data for welfare distribution without statutory backing, challenged on the basis of informational privacy and the three-fold proportionality test.',
      provision: 'Article 21, Privacy Test',
    },
    {
      title: 'Constitutional Amendment Voiding Basic Structure',
      query: 'Parliament enacted a constitutional amendment seeking to place certain schedule laws beyond the power of judicial review under Article 32 and Article 226.',
      provision: 'Article 368, Article 13',
    },
  ];

  const testNonexistentCase = async () => {
    setSearchMode('case_name_citation');
    setSearchQuery('State vs. Fictitious Case 1999');
    await handleExecuteSearch('State vs. Fictitious Case 1999');
  };

  const hasActiveFilters = courtFilter !== 'all' || verifiedOnly || minRelevance > 0 || !!legalProvisionFilter.trim();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Authentic Legal Research Engine
            </span>
            <span className="text-xs text-stone-400">
              {sources.length} Verified Sources in Library
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-white mt-1">
            Fact-Based Case Law & Plain-Language Research
          </h2>
          <p className="text-xs text-stone-300 mt-0.5">
            Search Indian judicial authorities using plain everyday language or specialized legal citations with zero-hallucination verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNewSession}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>New Research Topic</span>
          </button>
        </div>
      </div>

      {/* Main Mode Selector Tabs */}
      <div className="bg-stone-100 p-1.5 rounded-xl border border-stone-300 flex flex-wrap items-center gap-1.5">
        
        {/* New Core Mode: I Don't Know The Legal Term */}
        <button
          type="button"
          onClick={() => {
            setSearchMode('plain_language');
            setActiveTab('search');
          }}
          className={`flex-1 min-w-[170px] px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            searchMode === 'plain_language' && activeTab === 'search'
              ? 'bg-amber-500 text-stone-950 shadow-xs ring-2 ring-amber-400/40'
              : 'bg-amber-50/80 text-amber-950 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-900" />
          <span>💡 I Don't Know the Legal Term</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('facts_similarity');
            setActiveTab('search');
          }}
          className={`flex-1 min-w-[150px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            searchMode === 'facts_similarity' && activeTab === 'search'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
          }`}
        >
          <FileSearch className="w-3.5 h-3.5 text-amber-600" />
          <span>Factual Similarity</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('case_name_citation');
            setActiveTab('search');
          }}
          className={`flex-1 min-w-[130px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            searchMode === 'case_name_citation' && activeTab === 'search'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Case / Citation</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('section_statute');
            setActiveTab('search');
          }}
          className={`flex-1 min-w-[130px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            searchMode === 'section_statute' && activeTab === 'search'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Section / Article</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('legal_issue');
            setActiveTab('search');
          }}
          className={`flex-1 min-w-[120px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            searchMode === 'legal_issue' && activeTab === 'search'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Legal Issue</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'chat'
              ? 'bg-stone-900 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-200 border border-stone-200'
          }`}
          title="Interactive Zero-Hallucination Legal Assistant"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Dialogue ({currentSession.messages.length})</span>
        </button>
      </div>

      {/* Main Search Panel */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          
          {/* Dynamic Search Formulation Card based on mode */}
          {searchMode === 'plain_language' ? (
            <PlainLanguageSearchCard
              plainInput={plainInput}
              setPlainInput={setPlainInput}
              onExecuteSearch={handleExecuteSearch}
              isLoading={isFactSearching}
              onToggleFilters={() => setShowFilters(!showFilters)}
              showFilters={showFilters}
              hasActiveFilters={hasActiveFilters}
              onTestNonexistentCase={testNonexistentCase}
              language={language}
            />
          ) : searchMode === 'facts_similarity' ? (
            // Large Text Box for Fact-Based Search
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    <FileSearch className="w-4 h-4 text-amber-600" />
                    Describe the facts of your matter:
                  </label>
                  <span className="text-[11px] text-stone-500">
                    System extracts parties, material events, chronology & disputed issues
                  </span>
                </div>
                
                <textarea
                  rows={4}
                  value={factInput}
                  onChange={(e) => setFactInput(e.target.value)}
                  placeholder="Describe the factual matrix of your matter in natural language... (e.g. The accused was arrested without being informed of the grounds of arrest and challenges the validity of custody under Article 22(1) and Section 50 CrPC)."
                  className="w-full p-4 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 bg-stone-50/50 resize-y leading-relaxed font-sans"
                />

                {/* Quick Verified Scenarios */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                    Verified Benchmark Scenarios:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {sampleFactScenarios.map((sc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFactInput(sc.query);
                          setLegalProvisionFilter(sc.provision);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] bg-stone-100 hover:bg-amber-50 text-stone-700 hover:text-amber-950 border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer text-left font-medium"
                      >
                        ⚡ {sc.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Bar & Filter Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
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
                    onClick={testNonexistentCase}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 transition-colors cursor-pointer"
                    title="Verify that NyayaTrace strictly refuses fictitious authorities like State vs. Fictitious Case 1999"
                  >
                    🧪 Test Nonexistent Case
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteSearch()}
                  disabled={isFactSearching || !factInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center space-x-2 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {isFactSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                      <span>Extracting Facts & Cross-Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-stone-950" />
                      <span>Find Similar Verified Judgments</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            // Single Line Search for Other Modes
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider font-serif">
                  {searchMode === 'case_name_citation' && 'Search by Case Name or Official Citation:'}
                  {searchMode === 'section_statute' && 'Search by Statutory Act, Section, or Constitutional Article:'}
                  {searchMode === 'legal_issue' && 'Search by Legal Question, Concept, or Doctrine:'}
                </label>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={
                        searchMode === 'case_name_citation'
                          ? 'e.g. Kesavananda Bharati v. State of Kerala, or (1973) 4 SCC 225'
                          : searchMode === 'section_statute'
                          ? 'e.g. Article 21, Section 438 CrPC, or Section 9 Arbitration Act'
                          : 'e.g. Test of Arbitrariness, Right to Privacy, or Basic Structure Doctrine'
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 bg-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleExecuteSearch();
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Bar & Filter Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
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
                    onClick={testNonexistentCase}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 transition-colors cursor-pointer"
                    title="Verify that NyayaTrace strictly refuses fictitious authorities like State vs. Fictitious Case 1999"
                  >
                    🧪 Test Nonexistent Case
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleExecuteSearch()}
                  disabled={isFactSearching || !searchQuery.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs sm:text-sm flex items-center space-x-2 disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                >
                  {isFactSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                      <span>Searching Authenticated Sources...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 text-stone-950" />
                      <span>Search Authenticated Sources</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Expandable Refinement Filters Panel */}
          {showFilters && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              
              {/* Court Filter */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Court Hierarchy</label>
                <select
                  value={courtFilter}
                  onChange={(e) => setCourtFilter(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Courts & Authorities</option>
                  <option value="Supreme Court">Supreme Court of India</option>
                  <option value="High Court">High Courts</option>
                  <option value="Tribunal">Tribunals & Commissions</option>
                </select>
              </div>

              {/* Document Type */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Document Type</label>
                <select
                  value={documentTypeFilter}
                  onChange={(e) => setDocumentTypeFilter(e.target.value)}
                  className="w-full p-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="all">All Document Types</option>
                  <option value="judgment">Judgments</option>
                  <option value="statute">Statutes & Acts</option>
                  <option value="text">Notes / Briefs</option>
                </select>
              </div>

              {/* Legal Provision Search */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Specific Legal Provision</label>
                <input
                  type="text"
                  value={legalProvisionFilter}
                  onChange={(e) => setLegalProvisionFilter(e.target.value)}
                  placeholder="e.g. Article 21, Section 50"
                  className="w-full p-2 rounded-lg bg-white border border-stone-300 text-stone-900 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Verified Only & Min Relevance */}
              <div className="space-y-2">
                <label className="block font-semibold text-stone-700">Verification & Relevance</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="verifiedOnlyCheck"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="verifiedOnlyCheck" className="text-stone-700 cursor-pointer">
                    Verified Sources Only
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-stone-500">Min Relevance:</span>
                  <select
                    value={minRelevance}
                    onChange={(e) => setMinRelevance(Number(e.target.value))}
                    className="p-1 rounded bg-white border border-stone-300 text-[11px]"
                  >
                    <option value={0}>Any (0%+)</option>
                    <option value={50}>Moderate (50%+)</option>
                    <option value={75}>High (75%+)</option>
                  </select>
                </div>
              </div>

            </div>
          )}

          {/* Zero-Hallucination Grounding Notice */}
          <div className="p-3.5 bg-stone-100 border border-stone-300 rounded-xl flex items-center justify-between text-xs text-stone-700">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Zero-Hallucination Architecture:</strong> Results are derived strictly from your authenticated source repository. NyayaTrace refuses to invent or fabricate case law.
              </span>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0 pl-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-semibold text-emerald-800">Source Constraint Active</span>
            </div>
          </div>

          {/* Extracted Factual Elements Summary */}
          {extractedFacts && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold font-serif text-stone-900 uppercase tracking-wider">
                    {extractedFacts.plainLanguageExplanation 
                      ? 'Legal Translation & Breakdown (From Ordinary Language)' 
                      : 'Structured Factual Breakdown (Extracted from Inquiry)'}
                  </h4>
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-mono px-2 py-0.5 rounded">
                  Legal Parsing
                </span>
              </div>

              {extractedFacts.plainLanguageExplanation && (
                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-950">
                  <span className="font-bold block mb-0.5">Plain-Language Meaning:</span>
                  <p>{extractedFacts.plainLanguageExplanation}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                
                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-700 block mb-1">Parties & Actions:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-stone-600 text-[11px]">
                    {(extractedFacts.partiesRoles || []).length > 0 ? (
                      extractedFacts.partiesRoles.map((p, i) => <li key={i}>{p}</li>)
                    ) : (
                      <li>Unspecified party roles</li>
                    )}
                    {(extractedFacts.relevantActions || []).map((a, i) => (
                      <li key={`act-${i}`}>{a}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-700 block mb-1">Material Events & Disputed Facts:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-stone-600 text-[11px]">
                    {(extractedFacts.materialEvents || []).length > 0 ? (
                      extractedFacts.materialEvents.map((m, i) => <li key={i}>{m}</li>)
                    ) : (
                      <li>Events specified in query</li>
                    )}
                    {(extractedFacts.disputedFacts || []).map((df, i) => (
                      <li key={`df-${i}`}>{df}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-xl border border-stone-200">
                  <span className="font-semibold text-stone-700 block mb-1">Potential Legal Provisions & Issues:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(extractedFacts.legalProvisions || []).map((lp, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-stone-100 text-stone-800 rounded font-mono text-[10px] border border-stone-300">
                        {lp}
                      </span>
                    ))}
                    {(extractedFacts.potentialLegalIssues || []).map((li, i) => (
                      <span key={`iss-${i}`} className="px-1.5 py-0.5 bg-amber-50 text-amber-900 rounded text-[10px] border border-amber-200">
                        {li}
                      </span>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Results Area */}
          {hasSearched && (
            <div className="space-y-4">
              
              {/* Evidence / Matching Notice */}
              {noMatchFound ? (
                <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-serif font-bold text-rose-950">
                    No Matching Verified Authority Found
                  </h4>
                  <p className="text-xs text-rose-800 max-w-xl mx-auto leading-relaxed">
                    {searchNotice || 'No verified judgment was found in the available legal sources. NyayaTrace will not generate or invent a legal authority.'}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Please upload or attach authentic primary judgment documents into your <strong>Source Library</strong> to establish verified legal grounding for this inquiry.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-serif font-bold text-stone-900 uppercase tracking-wider">
                        Retrieved Source-Backed Judgments ({factSearchResults.length})
                      </h3>
                      {evidenceSufficiency === 'partial' && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                          Partial Source Evidence
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-stone-500">
                      Ranked by Multi-Dimensional Relevance Model
                    </span>
                  </div>

                  {/* Disclaimer banner */}
                  <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl text-[11px] text-amber-950 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      <strong>Relevance Model Notice:</strong> Transparent scores reflect factual and legal correspondence with available source records and must not be construed as legal certainty or prediction of judicial outcome.
                    </span>
                  </div>

                  {/* Result Cards Grid */}
                  <div className="space-y-4">
                    {factSearchResults.map((result) => {
                      const matchedSource = sources.find(s => s.id === result.sourceDocumentId);
                      return (
                        <div
                          key={result.id}
                          className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 hover:border-amber-300 transition-all"
                        >
                          {/* Card Header: Case Title, Citation, Court */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="text-base font-serif font-bold text-stone-900">
                                  {result.caseName}
                                </h4>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  result.verificationStatus === 'verified'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}>
                                  {result.verificationStatus === 'verified' ? 'Verified Source' : 'Needs Verification'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5 text-stone-400" />
                                  {result.court}
                                </span>
                                <span>•</span>
                                <span className="font-mono text-stone-700 font-medium">
                                  {result.citation}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                  {result.date}
                                </span>
                              </div>
                            </div>

                            {/* Overall Score Badge */}
                            <div className="text-right shrink-0">
                              <div className="inline-flex flex-col items-end">
                                <span className="text-[10px] font-bold text-stone-500 uppercase">Overall Match</span>
                                <span className="text-xl font-bold font-mono text-amber-600">
                                  {result.overallRelevanceScore}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Multi-Dimensional Relevance Indicators */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs">
                            
                            <div>
                              <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                                <span>Factual Similarity</span>
                                <span className="font-mono font-bold text-stone-800">{result.factualSimilarityScore}%</span>
                              </div>
                              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-amber-500 h-full rounded-full"
                                  style={{ width: `${result.factualSimilarityScore}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                                <span>Legal Issue Match</span>
                                <span className="font-mono font-bold text-stone-800">{result.legalIssueMatchScore}%</span>
                              </div>
                              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-blue-500 h-full rounded-full"
                                  style={{ width: `${result.legalIssueMatchScore}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                                <span>Authority / Precedent</span>
                                <span className="font-mono font-bold text-stone-800">{result.authorityRelevanceScore}%</span>
                              </div>
                              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-500 h-full rounded-full"
                                  style={{ width: `${result.authorityRelevanceScore}%` }}
                                ></div>
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                                <span>Overall Relevance</span>
                                <span className="font-mono font-bold text-stone-800">{result.overallRelevanceScore}%</span>
                              </div>
                              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className="bg-purple-500 h-full rounded-full"
                                  style={{ width: `${result.overallRelevanceScore}%` }}
                                ></div>
                              </div>
                            </div>

                          </div>

                          {/* Explanations */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                                Factual Similarity:
                              </span>
                              <p className="text-stone-700 leading-relaxed bg-stone-50/50 p-2.5 rounded-lg border border-stone-200">
                                {result.factualSimilarityExplanation}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                                Legal Issue & Relevance Justification:
                              </span>
                              <p className="text-stone-700 leading-relaxed bg-stone-50/50 p-2.5 rounded-lg border border-stone-200">
                                {result.relevanceJustification}
                              </p>
                            </div>
                          </div>

                          {/* Verbatim Source Passage */}
                          <div className="bg-amber-50/40 border-l-4 border-amber-500 p-3.5 rounded-r-xl space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-amber-900 font-semibold uppercase tracking-wider">
                              <span className="flex items-center gap-1">
                                <Quote className="w-3 h-3 text-amber-600" />
                                Verbatim Supporting Source Passage:
                              </span>
                              <span className="font-mono text-stone-500">{result.passageLocation || 'Primary Record'}</span>
                            </div>
                            <p className="text-xs font-serif text-stone-800 italic leading-relaxed">
                              "{result.relevantPassage}"
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
                            <div className="flex flex-wrap items-center gap-2">
                              {matchedSource && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSummarizeSource(matchedSource)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Plain Summary</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setSelectedAskSource(matchedSource)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white border border-stone-800 transition-colors cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Ask This Judgment</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onSelectSource(matchedSource)}
                                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-amber-50 text-stone-800 hover:text-amber-950 border border-stone-300 transition-colors cursor-pointer"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-stone-500" />
                                    <span>View Source</span>
                                  </button>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedComparisonResult(result)}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
                              >
                                <GitCompare className="w-3.5 h-3.5 text-amber-800" />
                                <span>Compare Facts</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSaveFindingClick(
                                `Precedent: ${result.caseName}`,
                                `${result.relevanceJustification}\n\nKey Ratio/Passage: "${result.relevantPassage}"`,
                                `${result.citation} (${result.court})`,
                                result.id
                              )}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-900 border border-stone-300 hover:bg-stone-50 transition-colors cursor-pointer"
                            >
                              <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                              <span>{savedId === result.id ? 'Saved to Vault!' : 'Save Finding'}</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* Interactive Chat Dialogue Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col h-[600px] overflow-hidden">
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {currentSession.messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-serif font-bold text-stone-900">
                    Zero-Hallucination Legal Dialogue
                  </h4>
                  <p className="text-xs text-stone-500 mt-1">
                    Ask follow-up questions regarding statutory interpretations, ratios of decisions, or precedent treatments from your repository.
                  </p>
                </div>
              </div>
            ) : (
              currentSession.messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                  >
                    <div className="flex items-center space-x-2 text-[11px] text-stone-400 px-1">
                      <span>{isUser ? 'Researcher' : 'NyayaTrace Assistant'}</span>
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl max-w-3xl space-y-3 leading-relaxed text-sm ${
                        isUser
                          ? 'bg-stone-900 text-stone-100 rounded-br-xs'
                          : 'bg-stone-50 text-stone-900 border border-stone-200 rounded-bl-xs'
                      }`}
                    >
                      <div className="whitespace-pre-line font-serif text-xs sm:text-sm">
                        {msg.content}
                      </div>

                      {/* Cited Sources with Verbatim Quotes */}
                      {!isUser && msg.citedSources && msg.citedSources.length > 0 && (
                        <div className="pt-3 border-t border-stone-200 space-y-2 text-xs">
                          <span className="font-sans font-bold text-[10px] text-stone-500 uppercase tracking-wider block">
                            Verified Source Grounding:
                          </span>
                          <div className="space-y-2">
                            {msg.citedSources.map((cit, idx) => (
                              <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200 space-y-1 font-sans">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-stone-800">{cit.title}</span>
                                  <span className="text-[10px] font-mono text-stone-500">{cit.citationLocation || 'Source Excerpt'}</span>
                                </div>
                                <p className="font-serif italic text-stone-600 text-[11px]">
                                  "{cit.verbatimQuote}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} className="p-4 border-t border-stone-200 bg-stone-50 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isLoading}
              placeholder="Ask a clarifying question grounded strictly in authentic judgments..."
              className="flex-1 px-4 py-3 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:ring-2 focus:ring-amber-500 bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !chatInput.trim()}
              className="px-5 py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-white" /> : <Send className="w-4 h-4 text-white" />}
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* Comparison Modal */}
      {selectedComparisonResult && selectedComparisonResult.comparisonDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-stone-300 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                  Side-by-Side Fact & Ratio Comparison
                </span>
                <h3 className="text-lg font-serif font-bold text-stone-900 mt-1">
                  Comparing Your Matter vs. {selectedComparisonResult.caseName}
                </h3>
                <p className="text-xs text-stone-500 font-mono">
                  {selectedComparisonResult.citation} • {selectedComparisonResult.court}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComparisonResult(null)}
                className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Anti-Overlap Caution Banner */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Judicial Rigor Caution:</strong> Do not claim that two cases are legally identical merely because keywords overlap. Factual distinctions and statutory contexts govern applicability.
              </span>
            </div>

            {/* Side-by-Side Comparison Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border border-stone-200 rounded-xl overflow-hidden">
                <thead className="bg-stone-900 text-stone-100 text-[11px] font-serif uppercase tracking-wider">
                  <tr>
                    <th className="p-3 border-r border-stone-700 w-1/4">Dimension</th>
                    <th className="p-3 border-r border-stone-700 w-3/8">User's Matter Facts & Inquiry</th>
                    <th className="p-3 w-3/8">Judgment's Facts & Ratio ({selectedComparisonResult.caseName})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  
                  <tr>
                    <td className="p-3 font-bold bg-stone-50 text-stone-800 border-r border-stone-200">
                      Factual Matrix
                    </td>
                    <td className="p-3 text-stone-700 border-r border-stone-200 align-top">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedComparisonResult.comparisonDetails.userFacts.map((uf, i) => (
                          <li key={i}>{uf}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-3 text-stone-700 align-top">
                      <ul className="list-disc list-inside space-y-1">
                        {selectedComparisonResult.comparisonDetails.judgmentFacts.map((jf, i) => (
                          <li key={i}>{jf}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold bg-stone-50 text-stone-800 border-r border-stone-200">
                      Factual Overlap vs. Differences
                    </td>
                    <td className="p-3 text-stone-700 border-r border-stone-200 align-top">
                      <span className="font-semibold text-emerald-800 block text-[11px] mb-0.5">Similar Facts:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                        {selectedComparisonResult.comparisonDetails.similarFacts.map((sf, i) => (
                          <li key={i}>{sf}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-3 text-stone-700 align-top">
                      <span className="font-semibold text-rose-800 block text-[11px] mb-0.5">Distinguishing Facts:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                        {selectedComparisonResult.comparisonDetails.differentFacts.map((df, i) => (
                          <li key={i}>{df}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold bg-stone-50 text-stone-800 border-r border-stone-200">
                      Legal Issues
                    </td>
                    <td className="p-3 text-stone-700 border-r border-stone-200 align-top">
                      <span className="font-semibold text-blue-800 block text-[11px] mb-0.5">Common Legal Issue:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                        {selectedComparisonResult.comparisonDetails.sameLegalIssue.map((si, i) => (
                          <li key={i}>{si}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-3 text-stone-700 align-top">
                      <span className="font-semibold text-stone-800 block text-[11px] mb-0.5">Differing Issues / Nuances:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                        {selectedComparisonResult.comparisonDetails.differentLegalIssue.map((di, i) => (
                          <li key={i}>{di}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-bold bg-stone-50 text-stone-800 border-r border-stone-200">
                      Judicial Reasoning
                    </td>
                    <td className="p-3 text-stone-700 border-r border-stone-200 align-top">
                      <span className="font-semibold text-stone-800 block text-[11px] mb-0.5">Supporting Application:</span>
                      <p className="text-stone-600 leading-relaxed">
                        {selectedComparisonResult.comparisonDetails.supportingReasoning}
                      </p>
                    </td>
                    <td className="p-3 text-stone-700 align-top">
                      <span className="font-semibold text-stone-800 block text-[11px] mb-0.5">Distinguishing Grounds:</span>
                      <p className="text-stone-600 leading-relaxed">
                        {selectedComparisonResult.comparisonDetails.distinguishingReasoning}
                      </p>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Verbatim Source Quote */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Primary Supporting Quote ({selectedComparisonResult.passageLocation || 'Source Document'}):
              </span>
              <p className="text-xs font-serif italic text-stone-800 leading-relaxed">
                "{selectedComparisonResult.relevantPassage}"
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedComparisonResult(null)}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close Comparison
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Ask Judgment Modal */}
      {selectedAskSource && (
        <AskJudgmentModal
          source={selectedAskSource}
          userContext={plainInput || factInput || searchQuery}
          language={language}
          onClose={() => setSelectedAskSource(null)}
          onSaveFinding={onSaveFinding}
        />
      )}

      {/* Summarize Judgment Modal */}
      {selectedSummarizeSource && (
        <SummarizeJudgmentModal
          source={selectedSummarizeSource}
          userSituation={plainInput || factInput || searchQuery}
          language={language}
          onClose={() => setSelectedSummarizeSource(null)}
          onSaveFinding={onSaveFinding}
        />
      )}

    </div>
  );
};
