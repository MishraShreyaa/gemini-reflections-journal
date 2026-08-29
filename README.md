# NyayaTrace (Gemini Reflections & Legal Research Workspace)

NyayaTrace is a zero-hallucination legal research, case-law analysis, and judicial ratio extraction workspace designed for Indian jurisprudence, powered by **Gemini** and **Google Cloud Firestore**.

> **Important Legal Disclaimer**: NyayaTrace is an analytical research assistant and workflow productivity platform. It is **not** a substitute for professional legal advice, advocate counsel, or official law reports. AI-generated analyses, summaries, and extractions must never be treated as authoritative sources of law. All legal claims, citations, and propositions must be independently verified against official Gazette notifications, Supreme Court Reports (SCR), or authorized law journals.

---

## 🛡️ Core Product Directives & Anti-Hallucination Guarantees

1. **Zero Legal Authority Fabrication**: NyayaTrace NEVER generates, invents, paraphrases as fact, or fabricates case names, citations, judgments, docket numbers, judge benches, court decisions, statutes, section numbers, article numbers, quotations, or URLs.
2. **Authentic Source Grounding Only**: Legal answers, ratio extraction, fact matching, and precedent relationships are grounded strictly in documents available in the user's authenticated Source Library or explicitly verified primary legal sources.
3. **Mandatory Refusal on Unverified Authorities**: If a requested legal authority or case cannot be verified from an available source in the library, the system explicitly declares:
   > *"No verified judgment was found in the available legal sources. NyayaTrace will not generate or invent a legal authority."*
4. **Fact-Based Case Law Research Engine**:
   Users can search across four specialized modes:
   - `[ Case / Citation ]`: Exact title and official SCR/SCC citation resolution.
   - `[ Section / Article ]`: Statutory acts, sections, and constitutional provisions.
   - `[ Legal Issue ]`: Legal concepts, doctrines, and constitutional tests.
   - `[ Facts & Similar Judgments ]`: Natural language factual matrix description with structured element extraction (parties, material events, chronology, disputed facts).
5. **Multi-Dimensional Transparent Relevance Model**:
   Retrieved judgments display separate indicators for:
   - **Factual Similarity** (0–100%)
   - **Legal Issue Match** (0–100%)
   - **Authority / Precedent Relevance** (0–100%)
   - **Overall Relevance** (0–100%)
   *Notice*: Relevance indicators reflect text correspondence with source records and are never presented as legal certainty or outcome prediction.
6. **Structured Precedent Comparison**:
   Provides side-by-side matrices contrasting `USER'S FACTS | JUDGMENT'S FACTS | SIMILARITY | DIFFERENCE | SOURCE PASSAGE`, distinguishing factual overlap from binding precedent.
7. **Tripartite Output Classification**: Every statement in research sessions is labeled:
   - `[SOURCE-BACKED INFORMATION]`: Directly extracted or cited from attached authentic documents.
   - `[AI ANALYSIS & REASONING]`: Logical synthesis derived strictly from the supplied texts.
   - `[UNVERIFIED]`: Any external concept or query not present in the sources.
8. **Visible Verification States**:
   - `Verified Source Authority`: Landmark judgments / primary texts verified against official law reports.
   - `User-Provided Source — Verification Required`: User-uploaded documents requiring independent confirmation.
   - `Unverified / Source Unavailable`: External queries without backing documentation.
9. **Strict Legal Identifier Invariance**: Across all 12 supported languages, case titles (e.g., *Kesavananda Bharati v. State of Kerala*), Supreme Court citations (e.g., *(1973) 4 SCC 225*), statutory acts/sections (e.g., *Section 438 CrPC*, *Article 21*), and verbatim judicial excerpts remain in their original legal notation without translation or transliteration distortion.
10. **Per-User Firestore Privacy Isolation**: All user libraries, research sessions, case traces, comparisons, saved findings, and reflections are partitioned under `/users/{userId}/*` with owner-bound security rules (`request.auth.uid == userId`).

---

## 🌐 12 Supported Languages (UI & Workflow)

NyayaTrace supports 12 languages with seamless runtime switching:
- **English** (Default)
- **हिन्दी (Hindi)**
- **বাংলা (Bengali)**
- **मराठी (Marathi)**
- **తెలుగు (Telugu)**
- **தமிழ் (Tamil)**
- **ગુજરાતી (Gujarati)**
- **ಕನ್ನಡ (Kannada)**
- **മലയാളം (Malayalam)**
- **ਪੰਜਾਬੀ (Punjabi)**
- **ଓଡ଼ିଆ (Odia)**
- **اردو (Urdu)**

*Language Preservation Rule*: Only user interface controls, navigation labels, and assistance guidance are translated. All case names, legal citations, quotations, docket numbers, and statutory section numbers remain exact.

---

## 🏛️ Architecture & Security Highlights

1. **User Identity Isolation**: Integrated with Firebase Authentication (Google Sign-In & Guest Advocate). All records are partitioned by authenticated user ID (`/users/{userId}/*`).
2. **Resilient Gemini Fallback Ladder**: Built-in 4-tier model resilience ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`) with automatic error code failover.
3. **Zero Secrets in Frontend**: Server-side Express proxy handles all Gemini API interactions. API keys and credentials are never sent to or stored in client-side code.
4. **Payload Sanitization & Undefined-Stripping**: Defensive null-safe payload parsing and undefined-property stripping ensure zero Firestore driver crashes.
5. **Preserved Journal & Reflections**: Full legacy support for personal reflections, mood tracking, and Socratic coaching in an isolated personal vault.

---

## 1. Environment & Prerequisites

Ensure you have the following installed and configured:
- **Node.js 20+** and **npm**
- **Google Cloud SDK (`gcloud` CLI)**
- **Firebase CLI** (`npm install -g firebase-tools`)

### Enable Google Cloud APIs
```bash
# Set your project ID
export PROJECT_ID="YOUR_PROJECT_ID"
gcloud config set project $PROJECT_ID

# Enable required services
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Management Setup

Store your Gemini API key securely in Google Cloud Secret Manager:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API Key as a version
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Grant your Cloud Run compute service account access to read the secret
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Database Security Configuration (Cloud Firestore)

### Firestore Security Rules (`firestore.rules`)
Deploy the following owner-isolated rules so users can only access their own legal research sessions, sources, and findings:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /researchSessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /sources/{sourceId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /analyses/{analysisId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /findings/{findingId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /digests/{digestId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /entries/{entryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /interactions/{interactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development & Automated Test Suite

```bash
# 1. Install dependencies
npm install

# 2. Run the automated Zero-Hallucination test suite
npm test
# (or npm run test:hallucination)
# Validates programmatic queries for nonexistent legal authorities like 'State vs. Fictitious Case 1999'

# 3. Start the unified full-stack dev server
npm run dev
# The application will be accessible at http://localhost:3000
```

---

## 5. Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run:

```bash
# Deploy to Cloud Run mounting Secret Manager secret as an environment variable
gcloud run deploy nyayatrace-app \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production
```

---

## 6. Required Campaign Verification Labeling

Apply the mandatory resource label to register the service for challenge verification:

```bash
gcloud run services update nyayatrace-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Functional Stability & Walkthrough Testing Guide

The following step-by-step test matrix can be used to verify all user flows:

### Test Case 1: Landing Page & Authentication Flow
1. Navigate to the root URL `/`.
2. Click **"Explore as Guest Advocate"** (or **"Sign in with Google"**).
3. **Expected Result**: Firebase Auth session is established, user profile badge renders in the navbar, and the workspace loads with the 7 views.

### Test Case 2: Zero-Hallucination & Anti-Fabrication Refusal
1. In the **Research Canvas** tab, without attaching any source document, submit:
   *"Summarize the Supreme Court ruling in Mehta v. State of Maharashtra 2029 on AI Personality."*
2. **Expected Result**: NyayaTrace refuses to invent a fictional case and states:
   *"Source not found or not verified. I cannot provide this as an authenticated legal authority."*

### Test Case 3: Authentic Source Management
1. In the **Source Library** tab, click **Load Landmark SC Judgments**.
2. **Expected Result**: Loads authentic judgments (*Kesavananda Bharati*, *Maneka Gandhi*, *Puttaswamy*).
3. Click **Add Source Document**, paste custom statutory or judgment text, and select verification level.
4. **Expected Result**: New source appears with provenance notes and verification badge, persisted under `/users/{userId}/sources/{sourceId}`.

### Test Case 4: Interactive Case Trace Graph
1. Navigate to the **Case Trace** tab.
2. Click **Extract Source-Backed Case Treatments**.
3. **Expected Result**: Analyzes attached judgments and displays verifiable treatment cards with verbatim excerpts and direct links to source documents.

### Test Case 5: Structured Case Analysis & Ratio Extraction
1. Navigate to the **Structured Analysis** tab.
2. Select *Kesavananda Bharati v. State of Kerala* and click **Generate Structured Case Analysis**.
3. **Expected Result**: Extracts Bench, Facts, Issues, Arguments, Ratio Decidendi, Reasoning, and Statutes with AI classification tags.
4. Click **Save Finding** to persist the ratio to `/users/{userId}/findings/{id}`.

### Test Case 6: Side-by-Side Case Comparison
1. Navigate to the **Case Comparison** tab.
2. Select 2 judgments and click **Compare Selected Judgments**.
3. **Expected Result**: Renders a side-by-side comparison matrix covering Facts, Issues, Ratio Decidendi, Statutes, Similarities, and Distinctions without inventing missing facts.

### Test Case 7: 12 Indian Languages & Legal Identifier Invariance
1. In the top navbar, switch between **हिन्दी (Hindi)**, **தமிழ் (Tamil)**, **বাংলা (Bengali)**, **اردو (Urdu)**, etc.
2. **Expected Result**: UI navigation and buttons translate accurately, while case names (*Kesavananda Bharati*), citations (`(1973) 4 SCC 225`), and statutory sections (`Article 21`) remain completely intact.

### Test Case 8: Preserved Journal & Reflection Vault
1. Navigate to the **Journal** tab in the navbar.
2. Write a reflection, select a coaching mode, and click **Reflect**.
3. **Expected Result**: Multi-turn reflection assistant interacts seamlessly and auto-saves entries to `/users/{userId}/entries/{id}`.

