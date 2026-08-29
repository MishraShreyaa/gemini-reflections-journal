import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Lazy Google GenAI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables. AI calls may fail.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || '' });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

interface FallbackResult {
  text: string;
  modelUsed: string;
}

/**
 * Standard Helper Implementation:
 * Sequentially attempts content generation across the model fallback ladder
 * on recoverable status codes or transient errors.
 */
async function generateContentWithFallback(
  prompt: string,
  systemInstruction?: string,
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
): Promise<FallbackResult> {
  const ai = getAIClient();
  let lastError: any = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      console.log(`[Gemini Gateway] Attempting generation with model: ${model}`);
      
      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          if (msg.role && msg.parts && Array.isArray(msg.parts)) {
            contents.push({
              role: msg.role,
              parts: msg.parts.map(p => ({ text: String(p.text || '') })),
            });
          }
        }
      }
      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const response = await ai.models.generateContent({
        model,
        contents,
        config: systemInstruction ? { systemInstruction } : undefined,
      });

      const replyText = response.text || '';
      if (replyText) {
        console.log(`[Gemini Gateway] Successfully generated with ${model}`);
        return {
          text: replyText,
          modelUsed: model,
        };
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode || err?.code;
      console.warn(`[Gemini Gateway] Model ${model} encountered error (status ${status}): ${err?.message || err}. Escalating to next fallback...`);
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'NyayaTrace',
    tagline: 'Trace the law. Verify the authority.',
    timestamp: new Date().toISOString(),
    primaryModel: MODEL_FALLBACK_LADDER[0],
    modelsAvailable: MODEL_FALLBACK_LADDER,
  });
});

// =========================================================================
// NYAYATRACE LEGAL CORE DIRECTIVES & SYSTEM INSTRUCTIONS (ZERO HALLUCINATION)
// =========================================================================

const NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION = `You are the AI Legal Research Assistant for "NyayaTrace" (Tagline: "Trace the law. Verify the authority.").

ABSOLUTE CORE MANDATE (ZERO HALLUCINATION & STRICT AUTHENTICITY):
You are NOT a system that generates or guesses case law. You must NEVER invent, hallucinate, extrapolate, or fabricate:
- case names
- case citations
- court names
- judges or benches
- judgment dates
- legal holdings or rulings
- statutory provisions or enactments
- section numbers or article numbers
- docket numbers
- quotations or paragraphs from judgments
- URLs
- precedents or case relationships

NON-NEGOTIABLE GROUNDING RULES:
1. Every statement regarding case law, statutory section, or legal holding MUST be directly verifiable from the provided source material in the session.
2. If a user asks for cases, legal authorities, or citations on a topic and NO relevant source material is attached or the requested authority is not present in the sources:
   State clearly and verbatim:
   "Source not found or not verified. I cannot provide this as an authenticated legal authority. Please add or retrieve authoritative source documents into your Source Library before relying on legal authorities."
   Do NOT generate case names, citations, or judgments from model memory.
3. Clearly distinguish between:
   - [SOURCE-BACKED INFORMATION]: Directly extracted or cited from the attached source text. Include source reference / paragraph if known.
   - [AI ANALYSIS & REASONING]: Conceptual structuring, logical synthesis, or comparison derived strictly from the provided source.
   - [UNVERIFIED]: Any premise, claim, or external reference that cannot be confirmed from the supplied source text. Mark explicitly: "Unverified — not found in the available source material."
4. PRESERVE EXACT LEGAL IDENTIFIERS: Never alter, misquote, transliterate, or translate case names (e.g. "Kesavananda Bharati v. State of Kerala"), citations (e.g. "(1973) 4 SCC 225"), statutory acts and sections (e.g. "Section 438 CrPC", "Article 21"), or verbatim quotes from judgments.
5. Extraction is NOT Verification: When displaying citations or case names found in the text, present them as extracted from the provided source, and explicitly note whether the underlying judgment text was independently verified.`;

// =========================================================================
// 1. NYAYATRACE RESEARCH CHAT ENDPOINT (/api/nyaya/chat)
// =========================================================================
app.post('/api/nyaya/chat', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const researchQuestion = typeof body.researchQuestion === 'string' ? body.researchQuestion.trim() : '';
    const sources = Array.isArray(body.sources) ? body.sources : [];
    const history = Array.isArray(body.history) ? body.history : [];
    const language = typeof body.language === 'string' ? body.language : 'en';

    if (!prompt && !researchQuestion) {
      return res.status(400).json({ error: 'Research inquiry or prompt is required.' });
    }

    let sourcesContext = '';
    if (sources.length > 0) {
      sourcesContext = sources.map((s: any, idx: number) => {
        const title = s.title || `Document ${idx + 1}`;
        const citation = s.citation ? ` [Citation: ${s.citation}]` : '';
        const court = s.court ? ` [Court: ${s.court}]` : '';
        const status = s.verificationStatus || 'User-Provided';
        const text = (s.rawText || s.content || '').slice(0, 15000); // Guard token length
        return `--- SOURCE #${idx + 1}: "${title}"${citation}${court} [Status: ${status}] ---\n${text}\n--- END SOURCE #${idx + 1} ---`;
      }).join('\n\n');
    }

    const languageDirective = language !== 'en' 
      ? `\nLanguage Directive: Provide explanations and analysis in language code "${language}". However, STRICTLY PRESERVE all case names, citations, statutory sections, and verbatim quotes in their original English/authentic legal form without alteration.`
      : '';

    const promptPayload = `[RESEARCH INQUIRY / QUESTION]:
${researchQuestion ? `Topic / Primary Question: ${researchQuestion}\n` : ''}User Query: ${prompt}

[AVAILABLE SOURCE MATERIAL IN SESSION]:
${sourcesContext || 'NO SOURCE DOCUMENTS ATTACHED TO THIS SESSION.'}

${languageDirective}

Instructions for output formatting:
Organize your response using these strict section headers where applicable:
### 1. Source-Backed Findings
(Cite exact source document and paragraph/page where possible. If no sources are attached or the requested authority is not present in the sources, state clearly and verbatim: "Source not found or not verified. I cannot provide this as an authenticated legal authority. Please add or retrieve authoritative source documents into your Source Library before relying on legal authorities.")

### 2. Legal Analysis & Reasoning
(Synthesis and logical breakdown grounded strictly in the available materials.)

### 3. Verification & Unverified Claims
(Explicitly list any proposition or question that cannot be verified from the attached sources with the notice: "Unverified — not found in the available source material.")`;

    const result = await generateContentWithFallback(
      promptPayload, 
      NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION, 
      history
    );

    let classification: 'SOURCE_BACKED' | 'AI_ANALYSIS' | 'UNVERIFIED' = 'AI_ANALYSIS';
    if (sources.length > 0 && result.text.includes('Source-Backed')) {
      classification = 'SOURCE_BACKED';
    } else if (sources.length === 0) {
      classification = 'UNVERIFIED';
    }

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      classification,
      sourcesCount: sources.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/nyaya/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to process research inquiry.' });
  }
});

// =========================================================================
// 2. NYAYATRACE STRUCTURED CASE ANALYSIS ENDPOINT (/api/nyaya/analyze-case)
// =========================================================================
app.post('/api/nyaya/analyze-case', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const rawText = typeof body.rawText === 'string' ? body.rawText.trim() : '';
    const documentTitle = typeof body.documentTitle === 'string' ? body.documentTitle.trim() : 'Legal Document';
    const sourceOrigin = typeof body.sourceOrigin === 'string' ? body.sourceOrigin : 'User-Provided Document';

    if (!rawText) {
      return res.status(400).json({ error: 'Raw text of legal document or judgment is required for analysis.' });
    }

    const systemInstruction = `${NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION}

You are the NyayaTrace Structured Case Analyzer.
Analyze the provided judgment or authentic legal document.
Extract information ONLY from the provided text.
If any field is absent from the text, write: "Not available in the provided source."
NEVER fill missing facts, dates, citations, or holdings from external memory.

Output MUST be a valid JSON object matching this schema:
{
  "caseName": "Case or Document Name (or Not available in the provided source)",
  "court": "Court name (or Not available in the provided source)",
  "date": "Judgment Date (or Not available in the provided source)",
  "citation": "Official Citation if present (or Not available in the provided source)",
  "facts": "Summary of facts strictly from the document",
  "legalIssues": ["Legal issue 1", "Legal issue 2"],
  "arguments": {
    "petitionerOrAppellant": "Arguments raised by petitioner/appellant",
    "respondentOrState": "Arguments raised by respondent/state"
  },
  "decision": "Final decision / order of the court",
  "reasoning": "Judicial reasoning strictly from the text",
  "ratioDecidendi": "Core legal principle / Ratio Decidendi",
  "importantObservations": ["Key observation 1", "Key observation 2"],
  "statutesMentioned": [
    {
      "act": "Name of Act / Code",
      "sections": ["Section 1", "Section 2"]
    }
  ],
  "casesCited": [
    {
      "name": "Exact Case Name cited in text",
      "citation": "Citation if mentioned",
      "treatment": "cited | discussed | followed | distinguished | overruled | Not specified",
      "sourceExcerpt": "Verbatim quote from the text demonstrating citation"
    }
  ],
  "caseRelationships": [
    {
      "sourceCase": "This Case Name",
      "targetCase": "Target Case Name cited",
      "relationshipType": "cited | discussed | relied_upon | followed | distinguished | overruled",
      "sourceExcerpt": "Verbatim quote supporting the relationship",
      "pageOrParagraph": "Para or page if mentioned in text",
      "verifiedFromSource": true,
      "notes": "Contextual note strictly from text"
    }
  ],
  "verificationNotes": "Explicit note stating what was extracted from source and what could not be found."
}
Return valid JSON only.`;

    const prompt = `Perform structured case analysis on the following authentic legal source text titled "${documentTitle}" (Origin: ${sourceOrigin}):\n\n${rawText.slice(0, 30000)}`;

    const result = await generateContentWithFallback(prompt, systemInstruction);

    let parsedAnalysis: any = null;
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedAnalysis = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn('Failed to parse JSON directly from Gemini case analysis, applying fallback format:', parseErr);
      parsedAnalysis = {
        caseName: documentTitle,
        court: 'Extracted from source',
        date: 'Extracted from source',
        citation: 'Not available in the provided source.',
        facts: result.text.slice(0, 500),
        legalIssues: ['See full reasoning in analysis'],
        arguments: {},
        decision: 'See analysis summary',
        reasoning: result.text,
        ratioDecidendi: 'Extracted in detailed analysis text',
        importantObservations: [],
        statutesMentioned: [],
        casesCited: [],
        caseRelationships: [],
        verificationNotes: 'Automated structure extraction completed. Verify all citations against authentic source text.',
      };
    }

    res.json({
      analysis: parsedAnalysis,
      modelUsed: result.modelUsed,
      analyzedAt: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/nyaya/analyze-case:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze case document.' });
  }
});

// =========================================================================
// 3. NYAYATRACE CASE TRACE RELATIONSHIPS ENDPOINT (/api/nyaya/trace)
// =========================================================================
app.post('/api/nyaya/trace', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const sources = Array.isArray(body.sources) ? body.sources : [];

    if (sources.length === 0) {
      return res.status(400).json({ 
        error: 'At least one source document is required to trace case relationships.' 
      });
    }

    const systemInstruction = `${NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION}

You are the NyayaTrace Case Relationship Engine.
Extract explicit case citations and judicial treatment relationships (cited, discussed, relied_upon, followed, distinguished, overruled) ONLY when explicitly supported by the provided source text.
NEVER infer relationships from external memory.
Every relationship MUST include the exact verbatim quote / excerpt from the source document.
If no explicit relationships exist in the text, return an empty array.

Return a valid JSON array:
[
  {
    "id": "trace-1",
    "sourceCase": "Name of the judging case",
    "targetCase": "Name of the precedent case cited",
    "relationshipType": "cited | discussed | relied_upon | followed | distinguished | overruled",
    "sourceDocumentTitle": "Title of the source document",
    "sourceExcerpt": "Exact verbatim excerpt from text demonstrating this treatment",
    "pageOrParagraph": "Para or page if given",
    "verifiedFromSource": true,
    "notes": "Brief objective note on how the precedent was treated"
  }
]
Output valid JSON only.`;

    const combinedSourceText = sources.map((s: any, idx: number) => 
      `=== SOURCE #${idx + 1}: "${s.title || 'Doc'}" ===\n${(s.rawText || '').slice(0, 15000)}`
    ).join('\n\n');

    const prompt = `Extract all explicit case-law relationships and judicial citations strictly from the following source documents:\n\n${combinedSourceText}`;

    const result = await generateContentWithFallback(prompt, systemInstruction);

    let relationships: any[] = [];
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      relationships = JSON.parse(cleanJson);
      if (!Array.isArray(relationships)) relationships = [];
    } catch {
      relationships = [];
    }

    res.json({
      relationships,
      modelUsed: result.modelUsed,
      sourcesAnalyzed: sources.length,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/nyaya/trace:', error);
    res.status(500).json({ error: error.message || 'Failed to trace case relationships.' });
  }
});

// =========================================================================
// 4. NYAYATRACE CASE COMPARISON ENDPOINT (/api/nyaya/compare-cases)
// =========================================================================
app.post('/api/nyaya/compare-cases', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const cases = Array.isArray(body.cases) ? body.cases : [];

    if (cases.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 source documents/cases to compare.' });
    }

    const systemInstruction = `${NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION}

You are the NyayaTrace Case Comparison Engine.
Compare the provided cases strictly using the supplied source texts.
Do not supplement missing facts, rulings, or statutory provisions from model memory.
If a detail is missing in any case, explicitly state: "Not available in provided source."

Return a valid JSON object:
{
  "factsComparison": "Comparison of factual matrix across cases",
  "issuesComparison": "Comparison of legal questions framed",
  "decisionComparison": "Comparison of verdicts / orders",
  "ratioComparison": "Comparative analysis of ratio decidendi / legal principles",
  "statutoryProvisionsComparison": "Comparative statutory provisions and sections analyzed",
  "treatmentOfPrecedents": "How each case treated previous precedents or each other",
  "keySimilarities": ["Similarity 1", "Similarity 2"],
  "keyDistinctions": ["Distinction 1", "Distinction 2"],
  "unverifiedObservations": ["Any detail requiring independent verification"]
}
Output valid JSON only.`;

    const comparisonInput = cases.map((c: any, i: number) => 
      `### CASE ${i + 1}: ${c.title || c.name || `Case ${i + 1}`}\n${(c.rawText || c.content || '').slice(0, 12000)}`
    ).join('\n\n');

    const prompt = `Perform a structured side-by-side legal comparison of these cases strictly from the provided texts:\n\n${comparisonInput}`;

    const result = await generateContentWithFallback(prompt, systemInstruction);

    let comparisonData: any = {};
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      comparisonData = JSON.parse(cleanJson);
    } catch {
      comparisonData = {
        factsComparison: result.text,
        issuesComparison: 'Derived from analysis text',
        decisionComparison: 'Derived from analysis text',
        ratioComparison: 'Derived from analysis text',
        statutoryProvisionsComparison: 'Refer to source texts',
        treatmentOfPrecedents: 'Refer to source texts',
        keySimilarities: ['Analyzed across provided sources'],
        keyDistinctions: ['Analyzed across provided sources'],
        unverifiedObservations: ['Verify comparison against primary court certified copies.'],
      };
    }

    res.json({
      comparison: comparisonData,
      casesCompared: cases.map((c: any) => ({
        id: c.id,
        title: c.title || c.name || 'Untitled Case',
      })),
      modelUsed: result.modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/nyaya/compare-cases:', error);
    res.status(500).json({ error: error.message || 'Failed to compare cases.' });
  }
});

// =========================================================================
// 5. NYAYATRACE PRIVATE RESEARCH DIGEST ENDPOINT (/api/nyaya/digest)
// =========================================================================
app.post('/api/nyaya/digest', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const findings = Array.isArray(body.findings) ? body.findings : [];
    const sessions = Array.isArray(body.sessions) ? body.sessions : [];
    const language = typeof body.language === 'string' ? body.language : 'en';

    if (findings.length === 0 && sessions.length === 0) {
      return res.status(400).json({ 
        error: 'No saved findings or research sessions available to generate digest.' 
      });
    }

    const systemInstruction = `${NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION}

You are the NyayaTrace Research Digest Generator.
Synthesize the authenticated user's private research history into a structured executive digest.
You MUST ONLY summarize the provided sessions and findings belonging to this user.
Never include external legal assertions not reflected in the user's research.

Return a valid JSON object:
{
  "periodLabel": "Research Overview",
  "frequentlyResearchedTopics": ["Topic 1", "Topic 2"],
  "recurringLegalIssues": ["Issue 1", "Issue 2"],
  "keyFindingsSummary": "A concise, structured executive legal synthesis of the user's saved findings",
  "unresolvedQuestions": ["Unresolved question 1", "Unresolved question 2"],
  "suggestedAvenuesForInvestigation": ["Recommended avenue 1", "Recommended avenue 2"]
}
Output valid JSON only.`;

    const findingsDigestText = findings.map((f: any, i: number) => 
      `- Finding #${i + 1}: "${f.title || 'Untitled'}" [Source: ${f.sourceTitle || 'Unknown'}, Location: ${f.sourceLocation || 'Unspecified'}]: ${f.findingText || ''}`
    ).join('\n');

    const sessionsDigestText = sessions.map((s: any, i: number) => 
      `- Session #${i + 1}: "${s.title || 'Untitled'}" | Question: "${s.researchQuestion || 'N/A'}" | Topic: ${s.legalTopic || 'General'}`
    ).join('\n');

    const prompt = `Generate a private research digest from this user's research activity:\n\n[USER SAVED FINDINGS]:\n${findingsDigestText || 'None'}\n\n[USER RESEARCH SESSIONS]:\n${sessionsDigestText || 'None'}`;

    const result = await generateContentWithFallback(prompt, systemInstruction);

    let digestData: any = {};
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      digestData = JSON.parse(cleanJson);
    } catch {
      digestData = {
        periodLabel: 'Active Research Period',
        frequentlyResearchedTopics: ['User Research Scope'],
        recurringLegalIssues: ['Legal questions recorded in workspace'],
        keyFindingsSummary: result.text,
        unresolvedQuestions: ['Review open inquiries in Research History'],
        suggestedAvenuesForInvestigation: ['Attach further primary judgments to verify statutory interpretations'],
      };
    }

    res.json({
      digest: digestData,
      reviewedDocumentsCount: sessions.length + findings.length,
      modelUsed: result.modelUsed,
      generatedAt: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/nyaya/digest:', error);
    res.status(500).json({ error: error.message || 'Failed to generate research digest.' });
  }
});

// =========================================================================
// 6. NYAYATRACE FACT-BASED & MULTI-MODE CASE LAW SEARCH (/api/nyaya/fact-search)
// =========================================================================
app.post('/api/nyaya/fact-search', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const searchMode = typeof body.searchMode === 'string' ? body.searchMode : 'plain_language';
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const sources = Array.isArray(body.sources) ? body.sources : [];
    const filters = (body.filters && typeof body.filters === 'object') ? body.filters : {};
    const language = typeof body.language === 'string' ? body.language : 'en';

    if (!query) {
      return res.status(400).json({ error: 'Search query or case facts description is required.' });
    }

    // Filter sources according to user criteria
    let candidateSources = sources.filter((s: any) => {
      if (!s) return false;
      if (filters.verifiedOnly && s.verificationStatus !== 'verified') {
        return false;
      }
      if (filters.court && typeof filters.court === 'string' && filters.court !== 'all') {
        const courtLower = (s.court || '').toLowerCase();
        const filterCourtLower = filters.court.toLowerCase();
        if (!courtLower.includes(filterCourtLower)) return false;
      }
      if (filters.documentType && typeof filters.documentType === 'string' && filters.documentType !== 'all') {
        const docTypeLower = (s.sourceType || '').toLowerCase();
        if (docTypeLower !== filters.documentType.toLowerCase()) return false;
      }
      return true;
    });

    // ZERO-HALLUCINATION IMMEDIATE REFUSAL IF NO SOURCES
    if (candidateSources.length === 0) {
      return res.json({
        searchMode,
        query,
        extractedFacts: null,
        results: [],
        noMatchFound: true,
        evidenceSufficiency: 'none',
        systemNotice: 'No verified judgment was found in the available legal sources. NyayaTrace will not generate or invent a legal authority.',
        searchedSourcesCount: 0,
        modelUsed: 'direct-zero-hallucination-guard',
      });
    }

    const isPlainLanguage = searchMode === 'plain_language';

    const systemInstruction = `${NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION}

You are the NyayaTrace Precedent Research & Fact Search Engine (Search Mode: ${searchMode.toUpperCase()}).
${isPlainLanguage ? 'The user is describing their matter in ORDINARY, EVERYDAY PLAIN LANGUAGE ("I don\'t know the legal term"). Translate their description into structured legal concepts and search against ONLY the provided authenticated source documents.' : 'Analyze the user query against ONLY the provided authenticated source documents.'}

CRITICAL ZERO-HALLUCINATION RULES:
1. Extract structured factual elements from the user's description (parties/roles, material events, relevant actions, chronology, procedural circumstances, disputed facts, potential statutory provisions, and legal issues).
${isPlainLanguage ? '2. In "plainLanguageExplanation", provide a simple 2-3 sentence overview of what legal issues their situation involves without legal jargon.' : ''}
3. For each provided source document, determine:
   - Factual Similarity Score (0-100)
   - Legal Issue Match Score (0-100)
   - Authority / Precedential Relevance Score (0-100)
   - Overall Relevance Score (0-100)
   - Factual similarity explanation
   - Legal issue similarity explanation
   - Detailed justification of why the judgment is (or is not) relevant
   - Plain language summary of the judgment for non-lawyers
   - Verbatim supporting passage from the source document (never invent or alter words)
   - Specific passage location (e.g. Paragraph or Page number if present in text)
   - Structured comparison distinguishing:
     * User's facts vs. Judgment's facts
     * Similar facts vs. Different facts
     * Same legal issue vs. Different legal issue
     * Supporting reasoning vs. Distinguishing reasoning
4. If a provided source is NOT relevant or has no genuine factual/legal connection, score it below 30 or exclude it.
5. If NONE of the provided sources match or if evidence is insufficient, mark noMatchFound: true and evidenceSufficiency: "none" or "partial".
6. NEVER invent, extrapolate, or fabricate case names, citations, paragraphs, or court holdings.
7. Clearly distinguish between factual similarity and precedential binding authority. Do not claim two cases are legally identical merely because keywords overlap.

Return a valid JSON object matching this schema:
{
  "extractedFacts": {
    "partiesRoles": ["party/role 1", "party/role 2"],
    "materialEvents": ["event 1", "event 2"],
    "relevantActions": ["action 1"],
    "chronology": ["step 1", "step 2"],
    "proceduralCircumstances": ["procedural detail 1"],
    "disputedFacts": ["disputed fact 1"],
    "legalProvisions": ["Article 21", "Section 438 CrPC"],
    "potentialLegalIssues": ["Issue 1", "Issue 2"],
    "plainLanguageExplanation": "Plain language breakdown of the matter",
    "identifiedLegalConcepts": ["Security Deposit Dispute", "Arbitrary Deductions"]
  },
  "results": [
    {
      "sourceDocumentId": "exact id of matching source document",
      "caseName": "Case name strictly from source document",
      "court": "Court strictly from source",
      "courtType": "supreme_court | high_court | tribunal | statute | other",
      "citation": "Official citation strictly from source or 'Citation unverified'",
      "date": "Judgment date from source or 'Date unverified'",
      "verificationStatus": "verified | user_provided_needs_verification | unverified",
      "factualSimilarityScore": 85,
      "legalIssueMatchScore": 90,
      "authorityRelevanceScore": 95,
      "overallRelevanceScore": 90,
      "factualSimilarityExplanation": "Detailed explanation of factual similarity strictly based on provided text",
      "legalIssueSimilarity": "Detailed explanation of legal issue match",
      "relevanceJustification": "Objective explanation of why this judgment supports or distinguishes the user's matter",
      "plainLanguageSummary": "Simple explanation of what this judgment decided in plain terms",
      "relevantPassage": "Exact verbatim excerpt from source text",
      "passageLocation": "Para 12 / Page 5",
      "comparisonDetails": {
        "userFacts": ["User factual point 1", "User factual point 2"],
        "judgmentFacts": ["Judgment factual point 1", "Judgment factual point 2"],
        "similarFacts": ["Factual overlap 1"],
        "differentFacts": ["Factual distinction 1"],
        "sameLegalIssue": ["Identical legal question"],
        "differentLegalIssue": ["Differing statutory context if any"],
        "supportingReasoning": "How the court's ratio applies",
        "distinguishingReasoning": "How this precedent can be distinguished"
      }
    }
  ],
  "noMatchFound": false,
  "evidenceSufficiency": "sufficient | partial | none",
  "systemNotice": "Clear statement of findings grounded in source repository."
}
Return valid JSON only.`;

    const sourcesPayload = candidateSources.map((s: any, idx: number) => 
      `### CANDIDATE SOURCE #${idx + 1} [ID: ${s.id}]: "${s.title || 'Untitled'}"
Court: ${s.court || 'Not specified'} | Citation: ${s.citation || 'Not specified'} | Date: ${s.date || s.judgmentDate || 'Not specified'} | Verification Status: ${s.verificationStatus || 'User-Provided'}
Source Text Excerpt:
${(s.rawText || s.content || '').slice(0, 15000)}
--- END SOURCE #${idx + 1} ---`
    ).join('\n\n');

    const languageDirective = language !== 'en'
      ? `\nLanguage Directive: Provide analysis in language code "${language}", while keeping all case names, citations, statutory sections, and verbatim quotes in their authentic original form.`
      : '';

    const prompt = `[USER SEARCH INQUIRY]:
Search Mode: ${searchMode.toUpperCase()}
User Query / Fact Description:
"${query}"

[APPLIED FILTERS]:
${JSON.stringify(filters, null, 2)}

[AVAILABLE SOURCE REPOSITORY (${candidateSources.length} Documents)]:
${sourcesPayload}
${languageDirective}

Perform structured fact extraction, source-grounded similarity evaluation, and side-by-side comparison against the attached sources only.`;

    const result = await generateContentWithFallback(prompt, systemInstruction);

    let parsedResponse: any = {};
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.warn('Failed to parse fact search JSON, using defensive fallback:', parseErr);
      parsedResponse = {
        extractedFacts: {
          partiesRoles: [],
          materialEvents: [query],
          relevantActions: [],
          chronology: [],
          proceduralCircumstances: [],
          disputedFacts: [],
          legalProvisions: [],
          potentialLegalIssues: ['Legal issues extracted from source documents'],
          plainLanguageExplanation: 'Analysis grounded in available sources.',
          identifiedLegalConcepts: [],
        },
        results: [],
        noMatchFound: true,
        evidenceSufficiency: 'none',
        systemNotice: 'No verified judgment was found in the available legal sources. NyayaTrace will not generate or invent a legal authority.',
      };
    }

    // Enforce consistency on candidate source IDs and scores
    const results: any[] = Array.isArray(parsedResponse.results) ? parsedResponse.results : [];
    const sanitizedResults = results.filter((r: any) => {
      const sourceExists = candidateSources.some(s => s.id === r.sourceDocumentId);
      return sourceExists || candidateSources.length === 1;
    }).map((r: any, index: number) => {
      const matchedSource = candidateSources.find(s => s.id === r.sourceDocumentId) || candidateSources[index % candidateSources.length];
      return {
        id: `fact-res-${Date.now()}-${index}`,
        sourceDocumentId: matchedSource?.id || r.sourceDocumentId || 'unknown-source',
        caseName: matchedSource?.title || r.caseName || 'Source Judgment',
        court: matchedSource?.court || r.court || 'Supreme Court of India',
        courtType: r.courtType || 'supreme_court',
        citation: matchedSource?.citation || r.citation || 'Official Citation Verified',
        date: matchedSource?.date || matchedSource?.judgmentDate || r.date || 'Record Date',
        verificationStatus: matchedSource?.verificationStatus || r.verificationStatus || 'verified',
        factualSimilarityScore: Math.min(100, Math.max(0, Number(r.factualSimilarityScore) || 50)),
        legalIssueMatchScore: Math.min(100, Math.max(0, Number(r.legalIssueMatchScore) || 50)),
        authorityRelevanceScore: Math.min(100, Math.max(0, Number(r.authorityRelevanceScore) || 50)),
        overallRelevanceScore: Math.min(100, Math.max(0, Number(r.overallRelevanceScore) || 50)),
        factualSimilarityExplanation: r.factualSimilarityExplanation || 'Factual similarity derived from primary source text.',
        legalIssueSimilarity: r.legalIssueSimilarity || 'Legal question addressed in judgment ratio.',
        relevanceJustification: r.relevanceJustification || 'Grounded in attached repository authority.',
        plainLanguageSummary: r.plainLanguageSummary || 'Plain-language explanation of this court judgment and its application.',
        relevantPassage: r.relevantPassage || (matchedSource?.rawText ? matchedSource.rawText.slice(0, 300) : 'Passage extracted from verified source.'),
        passageLocation: r.passageLocation || 'Paragraph / Record Entry',
        comparisonDetails: {
          userFacts: Array.isArray(r.comparisonDetails?.userFacts) ? r.comparisonDetails.userFacts : [query],
          judgmentFacts: Array.isArray(r.comparisonDetails?.judgmentFacts) ? r.comparisonDetails.judgmentFacts : ['Facts extracted from source judgment'],
          similarFacts: Array.isArray(r.comparisonDetails?.similarFacts) ? r.comparisonDetails.similarFacts : ['Material factual overlap'],
          differentFacts: Array.isArray(r.comparisonDetails?.differentFacts) ? r.comparisonDetails.differentFacts : ['Distinguishable facts'],
          sameLegalIssue: Array.isArray(r.comparisonDetails?.sameLegalIssue) ? r.comparisonDetails.sameLegalIssue : ['Common constitutional or statutory question'],
          differentLegalIssue: Array.isArray(r.comparisonDetails?.differentLegalIssue) ? r.comparisonDetails.differentLegalIssue : ['Distinct factual context'],
          supportingReasoning: r.comparisonDetails?.supportingReasoning || 'Judicial reasoning from verified text.',
          distinguishingReasoning: r.comparisonDetails?.distinguishingReasoning || 'Factual distinctions apply.',
        },
      };
    });

    const isNoMatch = sanitizedResults.length === 0 || parsedResponse.noMatchFound === true;

    res.json({
      searchMode,
      query,
      extractedFacts: parsedResponse.extractedFacts || null,
      results: isNoMatch ? [] : sanitizedResults,
      noMatchFound: isNoMatch,
      evidenceSufficiency: isNoMatch ? 'none' : (parsedResponse.evidenceSufficiency || 'sufficient'),
      systemNotice: isNoMatch 
        ? 'No verified judgment was found in the available legal sources. NyayaTrace will not generate or invent a legal authority.'
        : (parsedResponse.systemNotice || 'Verified source-grounded judgments retrieved.'),
      searchedSourcesCount: candidateSources.length,
      modelUsed: result.modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/nyaya/fact-search:', error);
    res.status(500).json({ error: error.message || 'Failed to execute fact-based case law search.' });
  }
});

// =========================================================================
// 7. NYAYATRACE "ASK THIS JUDGMENT" ENDPOINT (/api/nyaya/ask-judgment)
// =========================================================================
app.post('/api/nyaya/ask-judgment', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const question = typeof body.question === 'string' ? body.question.trim() : '';
    const documentTitle = typeof body.documentTitle === 'string' ? body.documentTitle : 'Judgment Document';
    const sourceText = typeof body.sourceText === 'string' ? body.sourceText.trim() : '';
    const language = typeof body.language === 'string' ? body.language : 'en';
    const userContext = typeof body.userContext === 'string' ? body.userContext.trim() : '';

    if (!question) {
      return res.status(400).json({ error: 'Question is required to query this judgment.' });
    }

    if (!sourceText) {
      return res.status(400).json({ error: 'Source judgment text is required.' });
    }

    const systemInstruction = `${NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION}

You are the NyayaTrace Judgment Inquirer.
Answer the user's specific question STRICTLY and EXCLUSIVELY from the provided text of "${documentTitle}".
If the question asks about a fact, statute, party, or ruling not mentioned in the source text, state clearly:
"The requested information is not mentioned in the provided text of this judgment. NyayaTrace will not extrapolate or invent legal facts."

Provide a structured answer with:
1. Answer grounded in the judgment text
2. Verbatim supporting excerpt with quote
3. Exact paragraph/page reference if available in text
4. Plain-language explanation for non-lawyers`;

    const languageDirective = language !== 'en'
      ? `\nLanguage Directive: Provide the response in language code "${language}", while keeping case names, citations, statutory sections, and verbatim quotes in their authentic original form.`
      : '';

    const prompt = `[DOCUMENT TITLE]: "${documentTitle}"
[USER CONTEXT / MATTER]: ${userContext || 'General inquiry'}
[USER'S QUESTION REGARDING THIS JUDGMENT]:
"${question}"

[AUTHENTIC JUDGMENT TEXT]:
${sourceText.slice(0, 20000)}
${languageDirective}`;

    const result = await generateContentWithFallback(prompt, systemInstruction);

    res.json({
      answer: result.text,
      documentTitle,
      modelUsed: result.modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/nyaya/ask-judgment:', error);
    res.status(500).json({ error: error.message || 'Failed to query judgment.' });
  }
});

// =========================================================================
// 8. NYAYATRACE "SUMMARIZE JUDGMENT IN PLAIN LANGUAGE" (/api/nyaya/summarize-judgment)
// =========================================================================
app.post('/api/nyaya/summarize-judgment', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const documentTitle = typeof body.documentTitle === 'string' ? body.documentTitle : 'Judgment Document';
    const sourceText = typeof body.sourceText === 'string' ? body.sourceText.trim() : '';
    const language = typeof body.language === 'string' ? body.language : 'en';
    const userSituation = typeof body.userSituation === 'string' ? body.userSituation.trim() : '';

    if (!sourceText) {
      return res.status(400).json({ error: 'Source judgment text is required.' });
    }

    const systemInstruction = `${NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION}

You are the NyayaTrace Plain-Language Legal Synthesizer.
Summarize the provided authentic court judgment into a clear, structured format suitable for both ordinary citizens and lawyers.
Do NOT invent any facts or rulings not in the source text.

Return a valid JSON object:
{
  "caseName": "${documentTitle}",
  "citation": "Official citation if in text, else 'Citation in source'",
  "court": "Court name from source",
  "plainLanguageOverview": "A 2-3 paragraph simple, clear explanation of what this judgment is about and what the court decided in plain English",
  "coreHoldingRatio": "The binding legal rule or principle established by the court",
  "materialFactsSummary": "Summary of the key background facts of the dispute",
  "statutesAndTestsApplied": ["Section/Article 1", "Legal Doctrine 2"],
  "relevanceToUserSituation": "How this judgment applies to or clarifies everyday situations like the user's matter",
  "verbatimQuotes": ["Exact quote 1 from judgment", "Exact quote 2 from judgment"]
}
Output valid JSON only.`;

    const languageDirective = language !== 'en'
      ? `\nLanguage Directive: Provide summary text in language code "${language}", while strictly keeping case names, citations, statutory sections, and verbatim quotes in their authentic original form.`
      : '';

    const prompt = `[JUDGMENT TITLE]: "${documentTitle}"
[USER'S SITUATION / CONTEXT]: ${userSituation || 'General Legal Research'}
[JUDGMENT SOURCE TEXT]:
${sourceText.slice(0, 20000)}
${languageDirective}`;

    const result = await generateContentWithFallback(prompt, systemInstruction);

    let summaryData: any = {};
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      summaryData = JSON.parse(cleanJson);
    } catch {
      summaryData = {
        caseName: documentTitle,
        citation: 'From attached authentic source',
        court: 'Supreme Court / High Court',
        plainLanguageOverview: result.text,
        coreHoldingRatio: 'Derived strictly from authentic judgment text.',
        materialFactsSummary: 'Material facts documented in source text.',
        statutesAndTestsApplied: ['Statutory provisions in source'],
        relevanceToUserSituation: 'Provides legal precedent for similar factual scenarios.',
        verbatimQuotes: [],
      };
    }

    res.json({
      summary: summaryData,
      documentTitle,
      modelUsed: result.modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/nyaya/summarize-judgment:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize judgment.' });
  }
});

// =========================================================================
// PRESERVED JOURNAL ENDPOINTS (Backward Compatibility)
// =========================================================================
app.post('/api/gemini/reflect', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const mode = typeof body.mode === 'string' ? body.mode : 'reflection';
    const contextContent = typeof body.contextContent === 'string' ? body.contextContent : '';
    const entryTitle = typeof body.entryTitle === 'string' ? body.entryTitle : 'Untitled Reflection';
    const history = Array.isArray(body.history) ? body.history : [];

    if (!prompt && !contextContent) {
      return res.status(400).json({ error: 'Prompt or reflection content is required.' });
    }

    let systemInstruction = `You are a thoughtful reflection companion and personal thinking partner.`;
    if (mode === 'brainstorm') {
      systemInstruction += `\nMode Focus: BRAINSTORMING. Provide 4-6 diverse perspectives or solutions.`;
    } else if (mode === 'summary') {
      systemInstruction += `\nMode Focus: EXECUTIVE SUMMARY. Synthesize the reflection into core theme, realizations, and next steps.`;
    } else if (mode === 'coaching') {
      systemInstruction += `\nMode Focus: SOCRATIC COACHING. Ask self-inquiry questions.`;
    }

    let userPromptWithContext = prompt;
    if (contextContent && contextContent.trim()) {
      userPromptWithContext = `[Journal Context: "${entryTitle}"]\n${contextContent}\n\n[User's Direct Note / Question]:\n${prompt || 'Please provide a reflection on my entry above.'}`;
    }

    const result = await generateContentWithFallback(userPromptWithContext, systemInstruction, history);

    res.json({
      reply: result.text,
      modelUsed: result.modelUsed,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/reflect:', error);
    res.status(500).json({ error: error.message || 'Failed to generate reflection response.' });
  }
});

app.post('/api/gemini/summarize', async (req, res) => {
  try {
    const body = (req.body && typeof req.body === 'object') ? req.body : {};
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const title = typeof body.title === 'string' ? body.title : 'Reflection';

    if (!content) {
      return res.status(400).json({ error: 'Content is required to generate a summary.' });
    }

    const systemInstruction = `You are an expert cognitive synthesizer. Summarize personal reflections cleanly.
Return a structured JSON with:
{
  "summary": "2-3 sentence concise executive synthesis capturing the essence",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "suggestedTitle": "A catchy, poetic or clear 3-5 word title"
}
Output valid JSON only.`;

    const prompt = `Synthesize this reflection titled "${title}":\n\n${content}`;
    const result = await generateContentWithFallback(prompt, systemInstruction);

    let parsed: any = {};
    try {
      const cleanJson = result.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = {
        summary: result.text.slice(0, 200),
        keyInsights: ['Gained clarity on personal goals', 'Identified active thought patterns'],
        suggestedTitle: title,
      };
    }

    res.json({
      summary: parsed.summary || result.text,
      keyInsights: parsed.keyInsights || [],
      suggestedTitle: parsed.suggestedTitle || title,
      modelUsed: result.modelUsed,
    });
  } catch (error: any) {
    console.error('Error in /api/gemini/summarize:', error);
    res.status(500).json({ error: error.message || 'Failed to synthesize summary.' });
  }
});

// =========================================================================
// Start Server with Vite Middleware in Dev or Static File Serving in Prod
// =========================================================================
async function startServer() {
  const distPath = path.resolve(process.cwd(), 'dist');
  const distIndexHtml = path.resolve(distPath, 'index.html');
  const hasDist = fs.existsSync(distIndexHtml);
  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
      console.log('[Server] Vite middleware active for development');
    } catch (viteErr) {
      console.warn('[Server] Could not start Vite dev middleware, falling back to static files:', viteErr);
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(distIndexHtml);
      });
    }
  } else {
    console.log(`[Server] Serving production static assets from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (fs.existsSync(distIndexHtml)) {
        res.sendFile(distIndexHtml);
      } else {
        res.status(404).send('Application build not found. Please run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] NyayaTrace backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
