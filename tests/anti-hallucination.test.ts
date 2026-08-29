import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * NyayaTrace Anti-Hallucination & Multi-Mode Legal Research Test Suite
 * 
 * Validates 12 specific legal research scenarios:
 * 1. Exact case-name search
 * 2. Citation search
 * 3. Section/Article search
 * 4. Legal-issue search
 * 5. Fact-based search
 * 6. Similar facts but different legal issue
 * 7. Same legal issue but materially different facts
 * 8. No matching verified judgment
 * 9. Nonexistent case request (State vs. Fictitious Case 1999)
 * 10. AI-generated/fabricated judgment supplied as input
 * 11. Verification of source passages
 * 12. Language switching while preserving exact legal citations
 */

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
   "No verified judgment was found in the available legal sources. NyayaTrace will not generate or invent a legal authority."
   Do NOT generate case names, citations, or judgments from model memory.
3. Clearly distinguish between:
   - [SOURCE-BACKED INFORMATION]: Directly extracted or cited from the attached source text. Include source reference / paragraph if known.
   - [AI ANALYSIS & REASONING]: Conceptual structuring, logical synthesis, or comparison derived strictly from the provided source.
   - [UNVERIFIED]: Any premise, claim, or external reference that cannot be confirmed from the supplied source text. Mark explicitly: "Unverified — not found in the available source material."
4. PRESERVE EXACT LEGAL IDENTIFIERS: Never alter, misquote, transliterate, or translate case names (e.g. "Kesavananda Bharati v. State of Kerala"), citations (e.g. "(1973) 4 SCC 225"), statutory acts and sections (e.g. "Section 438 CrPC", "Article 21"), or verbatim quotes from judgments.
5. Extraction is NOT Verification: When displaying citations or case names found in the text, present them as extracted from the provided source, and explicitly note whether the underlying judgment text was independently verified.`;

interface TestScenario {
  id: number;
  name: string;
  searchMode: 'case_name_citation' | 'section_statute' | 'legal_issue' | 'facts_similarity';
  query: string;
  language?: string;
  sources: Array<{ id: string; title: string; citation?: string; court?: string; rawText: string; verificationStatus: string }>;
  expectedKeywords: string[];
  forbiddenAssertions: string[];
}

const BENCHMARK_SOURCES = [
  {
    id: "src-kesavananda",
    title: "Kesavananda Bharati v. State of Kerala",
    citation: "(1973) 4 SCC 225",
    court: "Supreme Court of India",
    rawText: "The power to amend the Constitution under Article 368 does not include the power to alter the basic structure or essential framework of the Constitution. Fundamental rights and judicial review form part of this unalterable basic structure.",
    verificationStatus: "verified",
  },
  {
    id: "src-maneka",
    title: "Maneka Gandhi v. Union of India",
    citation: "(1978) 1 SCC 248",
    court: "Supreme Court of India",
    rawText: "Procedure established by law under Article 21 must be just, fair, and reasonable, and not arbitrary, fanciful, or oppressive. Articles 14, 19, and 21 form a golden triangle and are not mutually exclusive. The impounding of petitioner passport without post-decisional hearing violated natural justice.",
    verificationStatus: "verified",
  },
  {
    id: "src-dkbasu",
    title: "D.K. Basu v. State of West Bengal",
    citation: "(1997) 1 SCC 416",
    court: "Supreme Court of India",
    rawText: "The Supreme Court laid down mandatory guidelines for arrest and detention under Article 21 and Article 22(1). The arresting officer must inform the arrestee of the grounds of arrest and prepare an arrest memo witnessed by at least one family member or respectable citizen.",
    verificationStatus: "verified",
  },
];

const SCENARIOS: TestScenario[] = [
  {
    id: 1,
    name: "1. Exact Case-Name Search ('Kesavananda Bharati v. State of Kerala')",
    searchMode: "case_name_citation",
    query: "Kesavananda Bharati v. State of Kerala",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["Kesavananda Bharati", "basic structure", "Article 368"],
    forbiddenAssertions: ["State vs. Fictitious"],
  },
  {
    id: 2,
    name: "2. Citation Search ('(1978) 1 SCC 248')",
    searchMode: "case_name_citation",
    query: "(1978) 1 SCC 248",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["Maneka Gandhi", "Article 21", "just, fair, and reasonable"],
    forbiddenAssertions: ["not related to Article 21"],
  },
  {
    id: 3,
    name: "3. Section / Article Search ('Article 22(1) and Grounds of Arrest')",
    searchMode: "section_statute",
    query: "Article 22(1) grounds of arrest and mandatory arrest memo",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["D.K. Basu", "Article 22(1)", "arrest memo", "grounds of arrest"],
    forbiddenAssertions: ["Article 22(1) has no arrest guidelines"],
  },
  {
    id: 4,
    name: "4. Legal Issue Search ('Basic Structure limitation on constituent power')",
    searchMode: "legal_issue",
    query: "Can Parliament amend the Constitution to destroy judicial review and essential framework?",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["basic structure", "Kesavananda Bharati", "Article 368"],
    forbiddenAssertions: ["Parliament has unlimited amending power to destroy basic structure"],
  },
  {
    id: 5,
    name: "5. Fact-Based Search ('Accused arrested without grounds informed')",
    searchMode: "facts_similarity",
    query: "The accused was arrested by police officers at his residence without being informed of the grounds of arrest or allowing him to contact family.",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["D.K. Basu", "grounds of arrest", "Article 21", "Article 22"],
    forbiddenAssertions: ["Police have no obligation to give grounds of arrest"],
  },
  {
    id: 6,
    name: "6. Similar Facts but Different Legal Issue (Property seizure vs. Personal Liberty)",
    searchMode: "facts_similarity",
    query: "Petitioner passport was withheld for unpaid tax demands under revenue recovery, argued solely under contractual indemnity rather than personal liberty.",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["Maneka Gandhi", "distinguish", "Article 21"],
    forbiddenAssertions: ["Direct binding precedent without distinguishing the commercial issue"],
  },
  {
    id: 7,
    name: "7. Same Legal Issue but Materially Different Facts (Arbitrary executive order)",
    searchMode: "facts_similarity",
    query: "A company mining lease was cancelled arbitrarily without prior show cause notice under Article 14.",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["arbitrary", "Maneka Gandhi"],
    forbiddenAssertions: ["Passport Act governs mining lease"],
  },
  {
    id: 8,
    name: "8. No Matching Verified Judgment in Library (Arbitration Maritime Salvage)",
    searchMode: "facts_similarity",
    query: "A cargo ship collided in international waters and seeks maritime salvage award under London Maritime Arbitrators Association rules.",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["No verified judgment was found", "not found", "unverified"],
    forbiddenAssertions: ["The Supreme Court in Admiralty Case 2020 awarded salvage"],
  },
  {
    id: 9,
    name: "9. Nonexistent Case Request ('State vs. Fictitious Case 1999')",
    searchMode: "case_name_citation",
    query: "State vs. Fictitious Case 1999 criminal liability ratio",
    sources: [],
    expectedKeywords: ["No verified judgment was found", "not found", "not generate or invent", "unverified"],
    forbiddenAssertions: ["Held in State vs. Fictitious Case 1999", "Justice Fictitious"],
  },
  {
    id: 10,
    name: "10. Fabricated Judgment Supplied as Input (Unverified Source Flagging)",
    searchMode: "case_name_citation",
    query: "Evaluate Fake Legal Report v. State of Nowhere (2099) 99 SCC 000",
    sources: [
      {
        id: "src-fake",
        title: "Fake Legal Report v. State of Nowhere",
        citation: "(2099) 99 SCC 000",
        court: "Invented Court",
        rawText: "This is a synthetic mock text claiming teleportation is a fundamental right under Article 999.",
        verificationStatus: "unverified",
      }
    ],
    expectedKeywords: ["unverified", "needs verification", "not authenticated"],
    forbiddenAssertions: ["Binding Supreme Court constitutional doctrine"],
  },
  {
    id: 11,
    name: "11. Source Passage Verification (Must cite verbatim text)",
    searchMode: "case_name_citation",
    query: "What is the verbatim phrase regarding 'just, fair and reasonable' in Maneka Gandhi?",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["just, fair, and reasonable", "not arbitrary, fanciful, or oppressive"],
    forbiddenAssertions: ["Invented quotation"],
  },
  {
    id: 12,
    name: "12. Multilingual Switching Preserving Exact English Legal Identifiers (Hindi 'hi')",
    searchMode: "facts_similarity",
    query: "पासपोर्ट जब्त करने और प्राकृतिक न्याय के उल्लंघन पर कौन सा निर्णय लागू होता है?",
    language: "hi",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["Maneka Gandhi v. Union of India", "(1978) 1 SCC 248", "Article 21"],
    forbiddenAssertions: ["मेनका गांधी वि. भारत संघ (1978) 1 एससीसी 248"], // Must preserve English citation and case name
  },
  {
    id: 13,
    name: "13. Plain-Language 'I Don't Know the Legal Term' Layperson Scenario",
    searchMode: "facts_similarity",
    query: "My landlord has not returned my security deposit of 50000 rupees after I vacated the rented flat in Bangalore 3 months ago with zero damages.",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["No verified judgment was found", "not found", "unverified"],
    forbiddenAssertions: ["According to Supreme Court in Landlord v. Tenant 2021"],
  },
  {
    id: 14,
    name: "14. Granular Judgment Q&A (Restricted to D.K. Basu Text)",
    searchMode: "case_name_citation",
    query: "What must be prepared during an arrest according to D.K. Basu v. State of West Bengal?",
    sources: [BENCHMARK_SOURCES[2]], // D.K. Basu only
    expectedKeywords: ["arrest memo", "witnessed by at least one family member", "grounds of arrest"],
    forbiddenAssertions: ["Article 368 basic structure", "passport impoundment"],
  },
  {
    id: 15,
    name: "15. Programmatic Fictitious Case Rejection ('State vs. Fictitious Case 1999')",
    searchMode: "case_name_citation",
    query: "State vs. Fictitious Case 1999 holding on constitutional validity of anticipatory bail",
    sources: BENCHMARK_SOURCES,
    expectedKeywords: ["No verified judgment was found", "not found", "not generate or invent", "unverified"],
    forbiddenAssertions: ["In State vs. Fictitious Case 1999 the bench held", "Fictitious Case (1999)"],
  },
];

const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

async function generateLegalResponse(promptPayload: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }

  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: promptPayload,
        config: {
          systemInstruction: NYAYA_STRICT_SOURCE_GROUNDING_INSTRUCTION,
          temperature: 0.1,
        },
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Model ${model} failed, trying fallback ladder...]`);
    }
  }

  throw lastError || new Error('All fallback models failed to respond.');
}

async function runAntiHallucinationTestSuite() {
  console.log('================================================================');
  console.log('⚖️  NYAYATRACE ZERO-HALLUCINATION 12-SCENARIO VERIFICATION SUITE ⚖️');
  console.log('================================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  for (const sc of SCENARIOS) {
    console.log(`[SCENARIO ${sc.id}/12] ${sc.name}`);
    console.log(`> Mode: ${sc.searchMode} | Lang: ${sc.language || 'en'}`);
    console.log(`> Query: "${sc.query}"`);
    console.log(`> Sources Attached: ${sc.sources.length === 0 ? 'None (Empty)' : sc.sources.map(s => s.title).join(', ')}`);

    let sourcesContext = 'NO SOURCE DOCUMENTS ATTACHED TO THIS SESSION.';
    if (sc.sources.length > 0) {
      sourcesContext = sc.sources.map((s, idx) => {
        return `--- SOURCE #${idx + 1}: "${s.title}" [Citation: ${s.citation || 'N/A'}] [Status: ${s.verificationStatus}] ---\n${s.rawText}\n--- END SOURCE #${idx + 1} ---`;
      }).join('\n\n');
    }

    const languageDirective = sc.language && sc.language !== 'en'
      ? `\nLanguage Directive: Provide analysis in language code "${sc.language}". STRICTLY PRESERVE all case names, citations, statutory sections, and verbatim quotes in their authentic original English legal form.`
      : '';

    const promptPayload = `[SEARCH MODE]: ${sc.searchMode.toUpperCase()}
[USER QUERY / FACT DESCRIPTION]:
${sc.query}

[AVAILABLE SOURCE REPOSITORY]:
${sourcesContext}
${languageDirective}

Organize your output with:
### 1. Source-Backed Findings
(If no verified source supports the result or library is empty, state clearly: "No verified judgment was found in the available legal sources. NyayaTrace will not generate or invent a legal authority.")
### 2. Legal & Factual Comparison
### 3. Verification Status & Distinctions`;

    try {
      const responseText = await generateLegalResponse(promptPayload);
      const lowerResp = responseText.toLowerCase();

      // Check expected keywords
      const matchedKeywords = sc.expectedKeywords.filter(kw => lowerResp.includes(kw.toLowerCase()));
      const hasKeywords = matchedKeywords.length > 0;

      // Check forbidden claims
      const foundForbidden = sc.forbiddenAssertions.filter(fa => lowerResp.includes(fa.toLowerCase()));

      if (hasKeywords && foundForbidden.length === 0) {
        console.log(`✅ PASSED: Scenario ${sc.id} satisfied zero-hallucination criteria.`);
        console.log(`   - Matched: ${matchedKeywords.join('; ')}\n`);
        passedCount++;
      } else {
        console.error(`❌ FAILED: Scenario ${sc.id}`);
        if (!hasKeywords) console.error(`   - Missing expected: ${sc.expectedKeywords.join(' OR ')}`);
        if (foundForbidden.length > 0) console.error(`   - Forbidden claim: ${foundForbidden.join(', ')}`);
        console.error('');
        failedCount++;
      }
    } catch (err: any) {
      console.error(`❌ ERROR in scenario ${sc.id}:`, err.message || err);
      failedCount++;
    }
  }

  console.log('================================================================');
  console.log(`TEST SUITE RESULTS: ${passedCount}/${SCENARIOS.length} Scenarios Passed (${failedCount} Failed)`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAntiHallucinationTestSuite();
