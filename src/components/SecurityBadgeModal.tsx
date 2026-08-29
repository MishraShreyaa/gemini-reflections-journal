import React from 'react';
import { ShieldCheck, X, Lock, KeyRound, Database, Server, CheckCircle2 } from 'lucide-react';

interface SecurityBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const SecurityBadgeModal: React.FC<SecurityBadgeModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="security-verification-modal"
        className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-stone-900 font-serif">
                Security Architecture & Threat Model
              </h3>
              <p className="text-xs text-stone-500">
                OWASP Top 10 + LLM Security Directives Verification
              </p>
            </div>
          </div>
          <button
            id="close-security-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm text-stone-700">
          
          {/* Active User Isolation Status */}
          <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-semibold text-emerald-900">
                Owner-Bound Firestore Isolation Active
              </span>
              <p className="text-emerald-800">
                Current User UID: <code className="font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px]">{userId || 'Not Authenticated'}</code>
              </p>
              <p className="text-stone-600 text-[11px]">
                Documents are exclusively readable and writable at path <code className="font-mono">/users/{userId || '{uid}'}/entries/*</code>.
              </p>
            </div>
          </div>

          {/* Active Security Rules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Deployed Firestore Security Rules
              </span>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium">
                Enforced in Cloud
              </span>
            </div>
            <pre className="bg-stone-900 text-emerald-400 p-3.5 rounded-xl text-xs font-mono overflow-x-auto border border-stone-800">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>

          {/* 5 Threat Zones Summary Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Agentic Threat Model Matrix
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
                    <td className="px-3 py-2 font-medium text-stone-900">1. Input Surfaces</td>
                    <td className="px-3 py-2 text-stone-600">Payload tampering, oversized prompts</td>
                    <td className="px-3 py-2 text-stone-700">Express JSON limits (10MB) & input sanitization</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">2. Planning & Reasoning</td>
                    <td className="px-3 py-2 text-stone-600">Prompt injection, jailbreak attempts</td>
                    <td className="px-3 py-2 text-stone-700">Strict system instructions & contextual framing</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">3. Tool & API Execution</td>
                    <td className="px-3 py-2 text-stone-600">API Key exposure, model downtime</td>
                    <td className="px-3 py-2 text-stone-700">Server-side proxy + 4-tier Gemini fallback ladder</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">4. Memory & State</td>
                    <td className="px-3 py-2 text-stone-600">Cross-user data read/write leak</td>
                    <td className="px-3 py-2 text-stone-700">Owner-bound Firestore rules & undefined-stripping</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium text-stone-900">5. Inter-System Comm</td>
                    <td className="px-3 py-2 text-stone-600">Token interception, plain secrets</td>
                    <td className="px-3 py-2 text-stone-700">Secret Manager / env vars, HTTPS enforcement</td>
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
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
