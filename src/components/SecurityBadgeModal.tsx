import React from 'react';
import { ShieldCheck, X, Lock, KeyRound, Database, Server, CheckCircle2, Scale } from 'lucide-react';
import type { UserProfile } from '../types';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="security-verification-modal"
        className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500 rounded-lg text-stone-950 font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold font-serif">
                NyayaTrace Security & Zero-Hallucination Architecture
              </h3>
              <p className="text-xs text-stone-300">
                Cryptographic Firestore Isolation + Strict Source Grounding Directives
              </p>
            </div>
          </div>
          <button
            id="close-security-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm text-stone-700">
          
          {/* Active User Isolation Status */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-emerald-900 block">
                Owner-Bound Firestore Isolation Active
              </span>
              <p className="text-emerald-800">
                Current User UID: <code className="font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px] font-bold">{currentUser?.uid || 'Not Authenticated'}</code>
              </p>
              <p className="text-stone-600 text-[11px]">
                All research sessions, source documents, structured analyses, and findings are strictly bound to path <code className="font-mono">/users/{currentUser?.uid || '{uid}'}/*</code>.
              </p>
            </div>
          </div>

          {/* Active Security Rules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Deployed Cloud Firestore Security Rules
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium">
                Enforced in Cloud Project
              </span>
            </div>
            <pre className="bg-stone-900 text-emerald-400 p-3.5 rounded-xl text-xs font-mono overflow-x-auto border border-stone-800 leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/researchSessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/sources/{sourceId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/analyses/{analysisId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/findings/{findingId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/digests/{digestId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>

          {/* 5 Threat Zones Summary Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Agentic Threat Model & Anti-Hallucination Matrix
            </span>
            <div className="border border-stone-200 rounded-xl overflow-hidden text-xs">
              <table className="min-w-full divide-y divide-stone-200">
                <thead className="bg-stone-50 text-stone-600 font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Threat Zone</th>
                    <th className="px-3 py-2 text-left">Primary Risk</th>
                    <th className="px-3 py-2 text-left">Implemented Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">1. Planning & Reasoning</td>
                    <td className="px-3 py-2 text-stone-600">AI Hallucination of fake case laws or citations</td>
                    <td className="px-3 py-2 text-stone-700">Strict system prompt prohibition. Mandatory fallback: "No verified case-law sources are available."</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">2. Output Classification</td>
                    <td className="px-3 py-2 text-stone-600">Conflating AI opinion with authentic source text</td>
                    <td className="px-3 py-2 text-stone-700">Explicit labeling: [Source-Backed], [AI Analysis], and [Unverified] tags.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">3. Legal Identifiers</td>
                    <td className="px-3 py-2 text-stone-600">Translation distortion of citations & sections</td>
                    <td className="px-3 py-2 text-stone-700">Legal Identifier Invariance Directive across 10 Indian languages.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">4. Memory & State</td>
                    <td className="px-3 py-2 text-stone-600">Cross-user data leakage in Firestore</td>
                    <td className="px-3 py-2 text-stone-700">Owner-bound paths (<code className="font-mono">request.auth.uid == userId</code>) + payload sanitization.</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">5. Tool Execution</td>
                    <td className="px-3 py-2 text-stone-600">Gemini model rate limit / unavailability</td>
                    <td className="px-3 py-2 text-stone-700">4-tier model fallback ladder (<code className="font-mono">gemini-3.6-flash</code> → <code className="font-mono">gemini-3.1-flash-lite</code> → fallback).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
