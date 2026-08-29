export type AIInteractionMode = 'reflection' | 'summary' | 'brainstorm' | 'coaching';

export interface InteractionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: AIInteractionMode;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  mode?: AIInteractionMode;
  tags?: string[];
  summary?: string;
  keyInsights?: string[];
  interactions: InteractionMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}

export interface GeminiReflectRequest {
  prompt: string;
  history?: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  mode?: AIInteractionMode;
  contextContent?: string;
  entryTitle?: string;
}

export interface GeminiReflectResponse {
  reply: string;
  modelUsed: string;
  summary?: string;
  keyInsights?: string[];
}

// ==========================================
// NYAYATRACE LEGAL RESEARCH TYPES
// ==========================================

export type SupportedLanguage = 
  | 'en' // English
  | 'hi' // Hindi
  | 'bn' // Bengali
  | 'mr' // Marathi
  | 'te' // Telugu
  | 'ta' // Tamil
  | 'gu' // Gujarati
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'pa' // Punjabi
  | 'or' // Odia
  | 'ur'; // Urdu

export type SourceType = 'pdf' | 'text' | 'pasted' | 'url' | 'statute' | 'judgment';

export type CourtType = 'supreme_court' | 'high_court' | 'tribunal' | 'statute' | 'other';

export type VerificationStatus = 
  | 'verified' 
  | 'user_provided_needs_verification' 
  | 'unverified' 
  | 'source_unavailable';

export type ResearchSearchMode = 
  | 'plain_language'
  | 'facts_similarity'
  | 'case_name_citation' 
  | 'section_statute' 
  | 'legal_issue';

export interface ExtractedFactElements {
  partiesRoles: string[];
  materialEvents: string[];
  relevantActions: string[];
  chronology: string[];
  proceduralCircumstances: string[];
  disputedFacts: string[];
  legalProvisions: string[];
  potentialLegalIssues: string[];
  plainLanguageExplanation?: string;
  identifiedLegalConcepts?: string[];
}

export interface JudgmentSummary {
  caseName: string;
  citation: string;
  court: string;
  plainLanguageOverview: string;
  coreHoldingRatio: string;
  materialFactsSummary: string;
  statutesAndTestsApplied: string[];
  relevanceToUserSituation: string;
  verbatimQuotes: string[];
}

export interface FactSearchResult {
  id: string;
  sourceDocumentId: string;
  caseName: string;
  court: string;
  courtType?: CourtType;
  citation: string;
  date: string;
  verificationStatus: VerificationStatus;
  factualSimilarityScore: number; // 0 - 100
  legalIssueMatchScore: number; // 0 - 100
  authorityRelevanceScore: number; // 0 - 100
  overallRelevanceScore: number; // 0 - 100
  factualSimilarityExplanation: string;
  legalIssueSimilarity: string;
  relevanceJustification: string;
  plainLanguageSummary?: string;
  relevantPassage: string; // Exact verbatim quote from source
  passageLocation?: string; // e.g. "Paragraph 18" or "Page 24"
  comparisonDetails: {
    userFacts: string[];
    judgmentFacts: string[];
    similarFacts: string[];
    differentFacts: string[];
    sameLegalIssue: string[];
    differentLegalIssue: string[];
    supportingReasoning: string;
    distinguishingReasoning: string;
  };
}

export interface FactSearchFilter {
  court?: string;
  dateRange?: { start?: string; end?: string };
  legalProvision?: string;
  documentType?: string;
  minRelevance?: number;
  verifiedOnly?: boolean;
}

export interface FactSearchResponse {
  searchMode: ResearchSearchMode;
  query: string;
  extractedFacts?: ExtractedFactElements;
  results: FactSearchResult[];
  noMatchFound: boolean;
  evidenceSufficiency: 'sufficient' | 'partial' | 'none';
  systemNotice: string;
  modelUsed?: string;
  searchedSourcesCount: number;
}

export interface SourceDocument {
  id: string;
  userId: string;
  sessionId?: string;
  title: string;
  sourceType: SourceType;
  rawText: string;
  citation?: string;
  court?: string;
  date?: string;
  judgmentDate?: string;
  url?: string;
  pageCount?: number;
  verificationStatus: VerificationStatus;
  sourceOrigin?: string;
  isVerified?: boolean;
  provenance?: {
    addedAt: number;
    fileName?: string;
    fileSize?: number;
    sourceOrigin: string; // e.g. "User Upload", "Pasted Judgment", "Supreme Court Archive"
    verificationNotes?: string;
  };
  createdAt: number;
  updatedAt: number;
}

export type CaseRelationshipType = 
  | 'cited'
  | 'discussed'
  | 'relied_upon'
  | 'followed'
  | 'distinguished'
  | 'overruled';

export interface CaseRelationship {
  id: string;
  sourceCase: string; // Case initiating citation/treatment
  targetCase: string; // Case being treated/cited
  relationshipType: CaseRelationshipType;
  sourceDocumentId?: string;
  sourceExcerpt?: string; // Exact verbatim quote from source
  pageOrParagraph?: string;
  verifiedFromSource: boolean;
  notes?: string;
}

export interface CaseAnalysis {
  id: string;
  sourceDocumentId: string;
  caseName: string;
  court: string;
  date: string;
  citation: string;
  facts: string;
  legalIssues: string[];
  arguments: {
    petitionerOrAppellant?: string;
    respondentOrState?: string;
  };
  decision: string;
  reasoning: string;
  ratioDecidendi: string;
  importantObservations: string[];
  statutesMentioned: Array<{
    act: string;
    sections: string[];
  }>;
  casesCited: Array<{
    name: string;
    citation?: string;
    treatment?: string;
    sourceExcerpt?: string;
  }>;
  caseRelationships: CaseRelationship[];
  verificationNotes: string;
  analyzedAt: number;
  modelUsed?: string;
}

export interface ResearchChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp: number;
  classification?: 'SOURCE_BACKED' | 'AI_ANALYSIS' | 'UNVERIFIED';
  referencedSources?: Array<{
    sourceId: string;
    sourceTitle: string;
    excerpt?: string;
    pageOrSection?: string;
  }>;
  supportingSourceIds?: string[];
  modelUsed?: string;
}

// Alias for convenience
export type ResearchMessage = ResearchChatMessage;

export interface ResearchSession {
  id: string;
  userId: string;
  title: string;
  researchQuestion: string;
  legalTopic: string;
  notes?: string;
  sourceDocumentIds?: string[];
  attachedSourceIds?: string[];
  messages: ResearchChatMessage[];
  caseTraceIds?: string[];
  caseTraceRelationships?: CaseRelationship[];
  status?: 'active' | 'archived';
  language?: SupportedLanguage;
  createdAt: number;
  updatedAt: number;
}

export interface SavedFinding {
  id: string;
  userId: string;
  sessionId?: string;
  sessionTitle?: string;
  title: string;
  findingText: string;
  sourceDocumentId?: string;
  sourceTitle?: string;
  sourceLocation?: string; // e.g. "Para 14, Page 8"
  isVerifiedFromSource?: boolean;
  legalTopic?: string;
  tags?: string[];
  savedAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface ResearchDigest {
  id: string;
  userId: string;
  generatedAt: number;
  periodLabel: string;
  frequentlyResearchedTopics: string[];
  recurringLegalIssues: string[];
  keyFindingsSummary: string;
  reviewedDocumentsCount?: number;
  unresolvedQuestions: string[];
  suggestedAvenuesForInvestigation: string[];
  modelUsed?: string;
}

export interface CaseComparison {
  id: string;
  userId: string;
  casesCompared: Array<{
    id: string;
    name: string;
    court: string;
    date: string;
  }>;
  factsComparison: string;
  issuesComparison: string;
  decisionComparison: string;
  ratioComparison: string;
  statutoryProvisionsComparison: string;
  treatmentOfPrecedents: string;
  keySimilarities: string[];
  keyDistinctions: string[];
  unverifiedObservations?: string[];
  comparedAt: number;
}

export interface CaseComparisonRequest {
  caseIds: string[];
  focusAreas?: string[];
}

export interface CaseComparisonResult {
  cases: Array<{
    id: string;
    name: string;
    court: string;
    date: string;
  }>;
  factsComparison: string;
  issuesComparison: string;
  decisionComparison: string;
  ratioComparison: string;
  statutoryProvisionsComparison: string;
  treatmentOfPrecedents: string;
  keySimilarities: string[];
  keyDistinctions: string[];
  unverifiedObservations?: string[];
}
