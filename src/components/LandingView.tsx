import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Lock, 
  BrainCircuit, 
  History, 
  MessageSquare, 
  CheckCircle2, 
  ArrowRight,
  UserCheck,
  AlertCircle
} from 'lucide-react';

interface LandingViewProps {
  onGoogleSignIn: () => Promise<void>;
  onGuestSignIn: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onGoogleSignIn,
  onGuestSignIn,
  isLoading,
  authError,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'threat-model'>('overview');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* Hero Card */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-8 sm:p-12 text-center space-y-6">
          
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Multi-Turn Reflections & Structured Thinking</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
            Think clearly. Converse with <span className="text-amber-700 italic">Gemini 3.6 Flash</span>.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-stone-600 leading-relaxed font-sans">
            A private, user-authenticated digital journal where your thoughts meet an intelligent reflection partner. 
            All interactions are cryptographically isolated to your Firebase account in Cloud Firestore.
          </p>

          {/* Authentication Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="google-signin-button"
              type="button"
              disabled={isLoading}
              onClick={onGoogleSignIn}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-6 py-3.5 rounded-xl text-sm font-semibold text-stone-800 bg-white border border-stone-300 shadow-xs hover:bg-stone-50 active:bg-stone-100 disabled:opacity-50 transition-all cursor-pointer"
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
              <span>{isLoading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>

            <button
              id="guest-signin-button"
              type="button"
              disabled={isLoading}
              onClick={onGuestSignIn}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 disabled:opacity-50 transition-colors cursor-pointer border border-stone-200"
            >
              <UserCheck className="w-4 h-4 text-stone-600" />
              <span>Explore as Guest Member</span>
            </button>
          </div>

          {authError && (
            <div id="auth-error-banner" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Value pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left border-t border-stone-100">
            <div className="p-4 rounded-xl bg-stone-50/60 border border-stone-200/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <BrainCircuit className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Resilient Gemini 3.6 Flash</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Automated multi-model fallback ladder guarantees responsive reflections and brainstorming.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50/60 border border-stone-200/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">User Data Isolation</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Rules-enforced Firestore paths (<code className="text-[11px] bg-stone-200 px-1 py-0.5 rounded">/users/$uid/*</code>) prevent cross-user data leakage.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-stone-50/60 border border-stone-200/60 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-stone-900">Multi-Turn History</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Keep conversational context across sessions with automated executive synthesis and tagging.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
