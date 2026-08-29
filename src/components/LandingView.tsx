import React, { useState } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  Lock, 
  BookOpen, 
  GitFork, 
  FileText, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  AlertCircle,
  Columns,
  Bookmark
} from 'lucide-react';
import type { SupportedLanguage } from '../types';
import { getTranslation } from '../lib/i18n';

interface LandingViewProps {
  onGoogleSignIn: () => Promise<void>;
  onGuestSignIn: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
  language: SupportedLanguage;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onGoogleSignIn,
  onGuestSignIn,
  isLoading,
  authError,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'threat-model'>('overview');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-950 text-stone-100">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Hero Card */}
        <div className="bg-stone-900 rounded-3xl border border-stone-800 shadow-xl p-8 sm:p-12 text-center space-y-6">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero-Hallucination Indian Legal Research Platform</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            Trace the Law. <span className="text-amber-400 italic">Verify the Authority.</span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-300 leading-relaxed font-sans">
            NyayaTrace strictly analyzes only authentic, verifiable Supreme Court & High Court judgments and statutory records. 
            All ratio decidendi, case citations, and research digests are cryptographically isolated to your private Firebase account in Cloud Firestore.
          </p>

          {/* Authentication Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="google-signin-button"
              type="button"
              disabled={isLoading}
              onClick={onGoogleSignIn}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-stone-900 bg-white hover:bg-stone-100 active:bg-stone-200 disabled:opacity-50 transition-all cursor-pointer shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoading ? 'Connecting...' : 'Sign In with Google (Legal Workspace)'}</span>
            </button>

            <button
              id="guest-signin-button"
              type="button"
              disabled={isLoading}
              onClick={onGuestSignIn}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 active:bg-stone-600 disabled:opacity-50 transition-colors cursor-pointer border border-stone-700"
            >
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>Explore as Guest Advocate</span>
            </button>
          </div>

          {authError && (
            <div id="auth-error-banner" className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl text-xs text-rose-200 flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Value pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-stone-800 text-left">
            <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-serif font-bold text-white">Source Library & Verified Text</h4>
              <p className="text-xs text-stone-400">
                Ground research on authentic PDFs and SCR transcripts with provenance verification badges.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <GitFork className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-serif font-bold text-white">Interactive Case Trace</h4>
              <p className="text-xs text-stone-400">
                Map overruled, followed, distinguished, and cited precedents with exact verbatim quotes.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-serif font-bold text-white">Isolated Private Findings</h4>
              <p className="text-xs text-stone-400">
                Multi-turn research and executive digests scoped strictly to authenticated Firestore paths.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
