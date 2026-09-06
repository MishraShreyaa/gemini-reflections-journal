import React, { useState, useRef, useEffect } from 'react';
import { authFetch } from '../lib/api';
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
  HelpCircle,
  Shield,
  Lock,
  Copy
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
  ExtractedFactElements,
  CitationConfidence,
  ActionBlock,
  SituationCategory
} from '../types';
import { getTranslation } from '../lib/i18n';
import { FreeTextSearchCard } from './FreeTextSearchCard';
import { PlainLanguageSearchCard } from './PlainLanguageSearchCard';
import { AskJudgmentModal } from './AskJudgmentModal';
import { SummarizeJudgmentModal } from './SummarizeJudgmentModal';

interface ResearchAssistantCanvasProps {
  currentSession: ResearchSession;
  sources: SourceDocument[];
  onSendMessage: (text: string, category?: string, isZeroRetention?: boolean) => Promise<void>;
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
  const [searchMode, setSearchMode] = useState<ResearchSearchMode>('free_text');
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

  // Features 1-4 State
  const [isZeroRetention, setIsZeroRetention] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<SituationCategory | null>(null);
  const [searchConfidence, setSearchConfidence] = useState<CitationConfidence | null>(null);
  const [searchActionBlock, setSearchActionBlock] = useState<ActionBlock | null>(null);
  const [searchCategory, setSearchCategory] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = getTranslation(language);

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentSession.messages, isLoading, activeTab]);

  // Execute Universal Free-Text Search / Fact Search / Case Search
  const handleExecuteSearch = async (queryText?: string, modeToUse?: ResearchSearchMode) => {
    const activeMode = modeToUse || searchMode;
    let textToSearch = queryText;
    if (!textToSearch) {
      textToSearch = searchQuery || plainInput || factInput;
    }
    
    if (!textToSearch || !textToSearch.trim()) return;

    // Synchronize all input states to prevent state drift
    const cleanText = textToSearch.trim();
    setSearchQuery(cleanText);
    setPlainInput(cleanText);
    setFactInput(cleanText);
    if (modeToUse && modeToUse !== searchMode) {
      setSearchMode(modeToUse);
    }

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

      const response = await authFetch('/api/nyaya/fact-search', {
        method: 'POST',
        body: JSON.stringify({
          searchMode: activeMode,
          query: cleanText,
          sources,
          filters,
          language,
          category: selectedCategory || undefined,
          isZeroRetention,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to execute search across source repository.');
      }

      const data: FactSearchResponse = await response.json();
      setExtractedFacts(data.extractedFacts || null);
      setSearchConfidence(data.citationConfidence || null);
      setSearchActionBlock(data.actionBlock || null);
      setSearchCategory(data.category || null);
      
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
    await onSendMessage(text, selectedCategory || undefined, isZeroRetention);
  };

  const handleSaveFindingClick = async (title: string, text: string, location: string, id: string) => {
    await onSaveFinding(title, text, location);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 3000);
  };

  // Feature 4: Guided Situations Configuration
  const GUIDED_SITUATIONS: Array<{
    id: SituationCategory;
    title: string;
    icon: string;
    badge: string;
    description: string;
    sampleQuery: string;
    suggestedProvision: string;
  }> = [
    {
      id: 'CRIMINAL_ARREST',
      title: 'Arrest & Sec 41A Notice',
      icon: '🚨',
      badge: 'Criminal Procedure',
      description: 'Mandatory Section 41A CrPC notice and safeguards against arbitrary arrest',
      sampleQuery: 'Can police arrest an accused without Section 41A CrPC notice when offense is punishable up to 7 years?',
      suggestedProvision: 'Section 41, 41A CrPC; Arnesh Kumar v. State of Bihar',
    },
    {
      id: 'CONSUMER_DISPUTE',
      title: 'Defective Product & Refund',
      icon: '🛒',
      badge: 'Consumer Rights',
      description: 'E-commerce refund refusal, defective appliances, and unfair trade practice',
      sampleQuery: 'E-commerce platform refused refund for defective smartphone delivered in damaged condition citing no-return policy',
      suggestedProvision: 'Section 35 CPA 2019; Lucknow Development Authority v. M.K. Gupta',
    },
    {
      id: 'TENANCY_PROPERTY',
      title: 'Security Deposit Retention',
      icon: '🏠',
      badge: 'Tenancy Law',
      description: 'Landlord holding deposit after peaceful handover without genuine repair bills',
      sampleQuery: 'Landlord refused to return ₹60,000 security deposit citing arbitrary wear-and-tear painting charges after vacating',
      suggestedProvision: 'Suresh Kumar Kohli v. Rakesh Jain (2018) 6 SCC 708',
    },
    {
      id: 'LABOR_SALARY',
      title: 'Withheld Salary & Gratuity',
      icon: '💼',
      badge: 'Employment Law',
      description: 'Employer holding earned wages or gratuity post-resignation without inquiry',
      sampleQuery: 'Employer withheld last two months earned wages and gratuity after resignation without formal disciplinary inquiry',
      suggestedProvision: 'Article 300A; State of Jharkhand v. Jitendra Kumar Srivastava',
    },
    {
      id: 'CONSTITUTIONAL_LAW',
      title: 'Privacy & Due Process',
      icon: '⚖️',
      badge: 'Constitutional',
      description: 'State data collection, arbitrary detention, and proportionality test',
      sampleQuery: 'State mandatory biometric linking challenged under fundamental right to privacy and proportionality test',
      suggestedProvision: 'Article 21; Justice K.S. Puttaswamy v. Union of India',
    },
  ];

  // Feature 1: Citation Confidence Badge Renderer
  const renderConfidenceBadge = (conf?: CitationConfidence) => {
    if (!conf) return null;
    const isHigh = conf.confidence_label === 'High';
    const isMedium = conf.confidence_label === 'Medium';
    const isLow = conf.confidence_label === 'Low';
    const pct = Math.round(conf.confidence_score * (conf.confidence_score <= 1.0 ? 100 : 1));

    return (
      <div className="space-y-2 font-sans mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${
              isHigh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : isMedium
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-emerald-600' : isMedium ? 'bg-amber-600' : 'bg-rose-600'}`} />
            Citation Confidence: {conf.confidence_label} ({pct}%)
          </span>

          {conf.source && conf.source !== 'General Legal Principles' && (
            <span className="text-[11px] font-mono text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-lg border border-stone-200">
              {conf.source} {conf.citation ? `• ${conf.citation}` : ''}
            </span>
          )}
        </div>

        {/* Feature 1 Mandatory Low Confidence Disclaimer */}
        {isLow && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-950 flex items-start gap-2.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-rose-900">
                {conf.disclaimer || 'Is jawab ki reliability kam hai — kisi advocate se confirm karein.'}
              </p>
              <p className="text-[11px] text-rose-700">
                Vector similarity and retrieval match for this proposition is below the 0.65 threshold. Please verify statutory provisions and judicial ratios before formal reliance.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Feature 2: Next-Step Action Block Renderer
  const renderActionBlock = (actionBlock?: ActionBlock) => {
    if (!actionBlock) return null;
    return (
      <div className="mt-3.5 p-4 bg-stone-50 rounded-2xl border border-stone-300 text-stone-900 space-y-3 font-sans shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Next-Step Action Block
            </span>
            <h5 className="text-sm font-bold font-serif text-stone-900">
              {actionBlock.templateName}
            </h5>
          </div>
          <span className="text-[10px] font-mono text-stone-500 uppercase bg-white px-2 py-0.5 rounded border border-stone-200">
            {actionBlock.actionType || 'Pre-Litigation Action'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-white p-2.5 rounded-xl border border-stone-200">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold block">
              Authority to Approach:
            </span>
            <p className="font-semibold text-stone-800 mt-0.5">{actionBlock.authority}</p>
          </div>
          <div className="bg-white p-2.5 rounded-xl border border-stone-200">
            <span className="text-[10px] text-stone-500 uppercase tracking-wider font-semibold block">
              Competent Forum:
            </span>
            <p className="font-semibold text-stone-800 mt-0.5">{actionBlock.forum}</p>
          </div>
        </div>

        {actionBlock.steps && actionBlock.steps.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
              Recommended Statutory Steps:
            </span>
            <ol className="space-y-1 text-xs text-stone-700 list-decimal list-inside pl-1">
              {actionBlock.steps.map((step, sIdx) => (
                <li key={sIdx} className="leading-relaxed">
                  <span className="text-stone-800 font-medium">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {actionBlock.draftSnippet && (
          <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                {actionBlock.draftTitle || 'Ready-to-Use Legal Notice Draft'}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(actionBlock.draftSnippet || '');
                  setCopiedNotice(actionBlock.templateName);
                  setTimeout(() => setCopiedNotice(null), 2500);
                }}
                className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-stone-950 transition-colors cursor-pointer"
              >
                {copiedNotice === actionBlock.templateName ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Draft Notice</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-[11px] text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200 whitespace-pre-wrap select-all leading-relaxed">
              {actionBlock.draftSnippet}
            </p>
          </div>
        )}
      </div>
    );
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
    setSearchMode('free_text');
    setSearchQuery('State vs. Fictitious Case 1999');
    setPlainInput('State vs. Fictitious Case 1999');
    setFactInput('State vs. Fictitious Case 1999');
    await handleExecuteSearch('State vs. Fictitious Case 1999', 'free_text');
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

      {/* Feature 3 & Feature 4 Control Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Feature 3: Zero-Retention Privacy Toggle */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start space-x-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isZeroRetention ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                {isZeroRetention ? <Shield className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-stone-900">Zero-Retention Privacy</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isZeroRetention ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-600'}`}>
                    {isZeroRetention ? 'Active' : 'Off'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Aapki sensitive queries save nahi hoti jab tak aap na chahein.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsZeroRetention(!isZeroRetention)}
              aria-label="Toggle Zero-Retention Privacy"
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${isZeroRetention ? 'bg-emerald-600' : 'bg-stone-300'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isZeroRetention ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          <div className="text-[10px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-200 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>
              {isZeroRetention
                ? 'Queries are processed in temporary RAM (1h TTL) with zero persistent Firestore logging.'
                : 'Queries & findings are securely archived in your private research vault.'}
            </span>
          </div>
        </div>

        {/* Feature 4: Situation-Based Guided Flows */}
        <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Situation-Based Guided Flows
              </span>
              <span className="text-[10px] text-stone-500 hidden sm:inline">
                (Narrows RAG vector search scope)
              </span>
            </div>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Clear Scoped Scope</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {GUIDED_SITUATIONS.map((sit) => {
              const isSelected = selectedCategory === sit.id;
              return (
                <button
                  key={sit.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedCategory(null);
                    } else {
                      setSelectedCategory(sit.id);
                      setSearchQuery(sit.sampleQuery);
                      setPlainInput(sit.sampleQuery);
                      setFactInput(sit.sampleQuery);
                      setLegalProvisionFilter(sit.suggestedProvision);
                      setSearchMode('free_text');
                      setActiveTab('search');
                    }
                  }}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 shadow-xs ring-1 ring-amber-500'
                      : 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base">{sit.icon}</span>
                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase ${isSelected ? 'bg-amber-500 text-stone-950' : 'bg-stone-200 text-stone-700'}`}>
                      {sit.badge}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-stone-900 leading-tight">
                      {sit.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Mode Selector Tabs */}
      <div className="bg-stone-100 p-1.5 rounded-xl border border-stone-300 flex flex-wrap items-center gap-1.5">
        
        {/* Prominent Universal Free Text Search */}
        <button
          type="button"
          onClick={() => {
            setSearchMode('free_text');
            setActiveTab('search');
          }}
          className={`flex-1 min-w-[160px] px-3.5 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            searchMode === 'free_text' && activeTab === 'search'
              ? 'bg-amber-500 text-stone-950 shadow-xs ring-2 ring-amber-400/40'
              : 'bg-amber-50/80 text-amber-950 hover:bg-amber-100 border border-amber-300'
          }`}
        >
          <Search className="w-4 h-4 text-amber-900" />
          <span>🔍 Free Text Search</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('plain_language');
            setActiveTab('search');
          }}
          className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            searchMode === 'plain_language' && activeTab === 'search'
              ? 'bg-amber-500 text-stone-950 shadow-xs'
              : 'bg-white text-stone-700 hover:bg-stone-200 border border-stone-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Plain Language</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSearchMode('facts_similarity');
            setActiveTab('search');
          }}
          className={`flex-1 min-w-[140px] px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
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
          
          {/* Universal Free Text Search Card */}
          <FreeTextSearchCard
            query={searchQuery || plainInput || factInput}
            setQuery={(val) => {
              setSearchQuery(val);
              setPlainInput(val);
              setFactInput(val);
            }}
            searchMode={searchMode}
            setSearchMode={setSearchMode}
            onExecuteSearch={handleExecuteSearch}
            isLoading={isFactSearching}
            onToggleFilters={() => setShowFilters(!showFilters)}
            showFilters={showFilters}
            hasActiveFilters={hasActiveFilters}
            onTestNonexistentCase={testNonexistentCase}
            language={language}
          />

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

                  {/* Feature 1: Citation Confidence for Retrieval */}
                  {searchConfidence && renderConfidenceBadge(searchConfidence)}

                  {/* Feature 2: Next-Step Action Block */}
                  {searchActionBlock && renderActionBlock(searchActionBlock)}

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
                                {result.benchStrength && (
                                  <>
                                    <span>•</span>
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                                      {result.benchStrength}
                                    </span>
                                  </>
                                )}
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
                              {result.alternateCitations && result.alternateCitations.length > 0 && (
                                <div className="text-[11px] text-stone-500 font-mono mt-1">
                                  <span className="font-sans font-medium text-stone-600">Alternate Citations: </span>
                                  {result.alternateCitations.join(' • ')}
                                </div>
                              )}
                            </div>

                            {/* Overall Score Badge */}
                            <div className="text-right shrink-0">
                              <div className="inline-flex flex-col items-end">
                                <span className="text-[10px] font-bold text-stone-500 uppercase">Overall Match</span>
                                <span className="text-xl font-bold font-mono text-amber-600">
                                  {result.overallRelevanceScore}%
                                </span>
                                <span className="text-[9px] text-stone-400 font-mono">Weighted 40/30/20/10</span>
                              </div>
                            </div>
                          </div>

                          {/* Multi-Dimensional Relevance Indicators with Transparent Formula */}
                          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-stone-500 border-b border-stone-200/60 pb-1 font-mono">
                              <span>TRANSPARENT SCORING BREAKDOWN</span>
                              <span>Formula: 40% Legal + 30% Authority + 20% Facts + 10% Source Quality</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              <div>
                                <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                                  <span>Legal Issue (40%)</span>
                                  <span className="font-mono font-bold text-stone-800">{result.legalIssueMatchScore}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-blue-600 h-full rounded-full"
                                    style={{ width: `${result.legalIssueMatchScore}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                                  <span>Authority (30%)</span>
                                  <span className="font-mono font-bold text-stone-800">{result.authorityRelevanceScore}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-emerald-600 h-full rounded-full"
                                    style={{ width: `${result.authorityRelevanceScore}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                                  <span>Factual Similarity (20%)</span>
                                  <span className="font-mono font-bold text-stone-800">{result.factualSimilarityScore}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-amber-600 h-full rounded-full"
                                    style={{ width: `${result.factualSimilarityScore}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                                  <span>Source Quality (10%)</span>
                                  <span className="font-mono font-bold text-stone-800">{result.sourceQualityScore ?? 100}%</span>
                                </div>
                                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-purple-600 h-full rounded-full"
                                    style={{ width: `${result.sourceQualityScore ?? 100}%` }}
                                  ></div>
                                </div>
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
                          <div className={`p-3.5 rounded-r-xl space-y-1 border-l-4 ${
                            result.isVerbatim !== false 
                              ? 'bg-amber-50/50 border-amber-500' 
                              : 'bg-stone-50 border-stone-400'
                          }`}>
                            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                              <span className="flex items-center gap-1.5">
                                <Quote className="w-3.5 h-3.5 text-amber-700" />
                                {result.isVerbatim !== false ? (
                                  <span className="text-amber-950 font-bold">Verbatim Source Text (Exact)</span>
                                ) : (
                                  <span className="text-stone-600 font-bold">AI Summary / Paraphrased</span>
                                )}
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
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Chat Top Controls Header */}
          <div className="px-5 py-3 border-b border-stone-200 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isZeroRetention ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                {isZeroRetention ? <Shield className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-stone-900">
                    {isZeroRetention ? 'Zero-Retention Mode Active' : 'Standard Session Mode'}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isZeroRetention ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {isZeroRetention ? 'Ephemeral' : 'Vault Saved'}
                  </span>
                </div>
                <p className="text-[10px] text-stone-500">
                  {isZeroRetention 
                    ? 'Aapki sensitive queries save nahi hoti jab tak aap na chahein.' 
                    : 'Session dialogues are securely recorded in your research vault.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedCategory && (
                <div className="flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-300">
                  <span>Scoped: {GUIDED_SITUATIONS.find(s => s.id === selectedCategory)?.title || selectedCategory}</span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedCategory(null)}
                    className="hover:text-amber-950 ml-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Quick Zero-Retention Toggle in Chat */}
              <button
                type="button"
                onClick={() => setIsZeroRetention(!isZeroRetention)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isZeroRetention 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700' 
                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{isZeroRetention ? 'Zero-Retention ON' : 'Enable Zero-Retention'}</span>
              </button>
            </div>
          </div>

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
                      {/* Feature 1: Citation Confidence Badge on Assistant Replies */}
                      {!isUser && renderConfidenceBadge(msg.citationConfidence)}

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

                      {/* Feature 2: Next-Step Action Block on Assistant Replies */}
                      {!isUser && renderActionBlock(msg.actionBlock)}
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
