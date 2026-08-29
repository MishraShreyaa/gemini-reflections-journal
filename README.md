# Gemini Reflections & Journal

A secure, user-authenticated reflection journal powered by **Gemini 3.6 Flash** and **Google Cloud Firestore**. It enables multi-turn conversational journaling, brainstorming, and executive summarization with cryptographically isolated per-user data partitions.

---

## Architecture & Security Highlights

1. **User Identity Isolation**: Integrated with Firebase Authentication (Google Sign-In). All journal records and AI interactions are strictly partitioned by authenticated user ID (`/users/{userId}/*`).
2. **Resilient Gemini 3.6 Flash Fallback Ladder**: Built-in 4-tier model resilience ladder (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`) with error status code handling.
3. **OWASP & LLM Security Directives**: Server-side proxy for Gemini API keys, strict payload schema validation, null-safe destructuring, and undefined-stripping Firestore payload sanitation.

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

Store your Gemini API key securely in Google Cloud Secret Manager.

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
Deploy the following owner-isolated rules so users can only access their own reflections and interaction logs:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Deploy Rules
```bash
firebase deploy --only firestore:rules
```

---

## 4. Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start the unified full-stack dev server
npm run dev
# The application will be accessible at http://localhost:3000
```

---

## 5. Cloud Run Deployment Flow

Build and deploy the application container to Google Cloud Run:

```bash
# Deploy to Cloud Run mounting the Secret Manager secret as an environment variable
gcloud run deploy gemini-reflections-app \
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
gcloud run services update gemini-reflections-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 7. Functional Stability & Walkthrough Testing Guide

The following step-by-step test matrix can be used by automated testing frameworks or manual testers to verify end-to-end functionality:

### Test Case 1: Landing Page & Authentication
1. Navigate to the root URL `/`.
2. Verify that the landing view displays the title, value pillars, and authentication buttons (`#google-signin-button`, `#guest-signin-button`).
3. Click `#guest-signin-button` (or `#google-signin-button`).
4. **Expected Result**: Firebase Auth session is established, user profile badge appears in the navbar, and the app transitions into the private dashboard.

### Test Case 2: User-Isolated Reflection Creation & Auto-Save
1. Click the `+ New Entry` button in the sidebar (`#new-reflection-button`).
2. Type a title in `#reflection-title-input` (e.g., "Navigating Technical Architecture").
3. Type reflection text in `#journal-entry-content`.
4. Select mood `#mood-pill-focused`.
5. Add tag `#strategy` and press Enter.
6. **Expected Result**: `#firestore-save-status` transitions to "Saving to Firestore..." and resolves to "Isolated Vault Saved" within 1 second. Entry is persisted in Firestore under `/users/{uid}/entries/{id}`.

### Test Case 3: Multi-Turn Conversation with Gemini 3.6 Flash
1. Select perspective mode `#mode-button-reflection`.
2. Click a suggested prompt chip (e.g., `"What underlying emotional pattern or assumption stands out here?"`) or type a custom prompt in `#followup-prompt-input`.
3. Click `#send-prompt-button` or press Enter.
4. **Expected Result**: The generating indicator `#ai-generating-indicator` pulses with `Gemini 3.6 Flash is reflecting...`, then displays the AI response formatted in structured markdown. The interaction is recorded in Firestore.
5. Send a follow-up reply.
6. **Expected Result**: Conversation displays as a multi-turn thread maintaining context.

### Test Case 4: Brainstorming & Socratic Coaching Modes
1. Click `#mode-button-brainstorm`.
2. Type `"How can we mitigate cold start latency?"` and submit.
3. **Expected Result**: Gemini responds with structured brainstorming categories (Quick Wins, Non-obvious Angles, Long-term Bets).
4. Click `#mode-button-coaching` to switch to Socratic Coach mode.
5. **Expected Result**: Gemini provides challenging self-inquiry questions.

### Test Case 5: AI Executive Summary & Insights Generation
1. Click `#generate-summary-button`.
2. **Expected Result**: `#executive-summary-card` renders with a 2-3 sentence executive synthesis and bulleted key breakthroughs.

### Test Case 6: User Isolation & Cross-Account Data Protection
1. Open `#security-status-button` to open `#security-verification-modal`.
2. Verify that the current user's UID matches the path `/users/{userId}/entries/*` and the deployed security rule blocks cross-user reads/writes.
3. Sign out and log in as a different user / guest.
4. **Expected Result**: Previous user's entries are not visible in the sidebar history.
