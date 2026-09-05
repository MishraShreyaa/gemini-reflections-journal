import React from 'react';
import { 
  Scale, 
  ShieldCheck, 
  LogOut, 
  Globe, 
  BookOpen, 
  GitFork, 
  Columns, 
  MessageSquare, 
  Bookmark, 
  BookMarked,
  Sparkles,
  User as UserIcon,
  ShieldAlert,
  Briefcase,
  Crown
} from 'lucide-react';
import type { UserProfile, SupportedLanguage, UserRole, LawyerVerificationStatus } from '../types';
import { SUPPORTED_LANGUAGES, getTranslation } from '../lib/i18n';

interface NavbarProps {
  user: UserProfile | null;
  userRole?: UserRole;
  lawyerStatus?: LawyerVerificationStatus;
  onLogout: () => void;
  onOpenSecurityModal: () => void;
  onOpenLawyerModal?: () => void;
  activeView: 'library' | 'trace' | 'analysis' | 'comparison' | 'canvas' | 'findings' | 'journal' | 'admin' | 'lawyer-workspace';
  onSelectView: (view: 'library' | 'trace' | 'analysis' | 'comparison' | 'canvas' | 'findings' | 'journal' | 'admin' | 'lawyer-workspace') => void;
  language: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  sourcesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  userRole = 'USER',
  lawyerStatus = 'NONE',
  onLogout,
  onOpenSecurityModal,
  onOpenLawyerModal,
  activeView,
  onSelectView,
  language,
  onSelectLanguage,
  sourcesCount,
}) => {
  const t = getTranslation(language);

  return (
    <header id="main-navbar" className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & App Info */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectView('library')}>
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-xs font-serif font-bold">
            <Scale className="w-5 h-5 text-stone-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-white font-serif">
                {t.appName}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                Zero-Hallucination
              </span>
            </div>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Navigation Tabs for Legal Workspace */}
        {user && (
          <nav className="hidden lg:flex items-center space-x-1 bg-stone-800/80 p-1 rounded-xl border border-stone-700/60">
            
            {/* Lawyer Chamber Tab */}
            {(userRole === 'LAWYER' || userRole === 'ADMIN') && (
              <button
                type="button"
                onClick={() => onSelectView('lawyer-workspace')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'lawyer-workspace' ? 'bg-blue-600 text-white shadow-xs' : 'text-blue-300 hover:text-white hover:bg-stone-700/50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Lawyer Chamber</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onSelectView('library')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'library' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t.nav.sourceLibrary}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeView === 'library' ? 'bg-stone-900 text-amber-300' : 'bg-stone-700 text-stone-300'
              }`}>
                {sourcesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('trace')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'trace' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>{t.nav.caseTrace}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('analysis')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'analysis' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>{t.actions.analyzeCase}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('comparison')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'comparison' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{t.nav.caseComparison}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('canvas')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'canvas' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t.nav.newResearch}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('findings')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'findings' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-300 hover:text-white hover:bg-stone-700/50'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{t.nav.savedFindings}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectView('journal')}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'journal' ? 'bg-amber-500 text-stone-950 shadow-xs' : 'text-stone-400 hover:text-white hover:bg-stone-700/50'
              }`}
              title="Personal Journal & Legacy Reflections"
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Journal</span>
            </button>

            {/* Admin Portal Tab (Only for Admin Role) */}
            {userRole === 'ADMIN' && (
              <button
                type="button"
                onClick={() => onSelectView('admin')}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeView === 'admin' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-300 hover:text-white hover:bg-rose-950/50'
                }`}
                title="Master Administrator & Security Dashboard"
              >
                <Crown className="w-3.5 h-3.5 text-rose-300" />
                <span>Admin Portal</span>
              </button>
            )}

          </nav>
        )}

        {/* Right Section: Language Switcher, Lawyer Application, Role Badge, User Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Lawyer Verification Button / Status for Standard Users */}
          {user && userRole === 'USER' && (
            <>
              {lawyerStatus === 'PENDING' ? (
                <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-amber-300 bg-amber-950/60 border border-amber-700/60 font-mono">
                  <span>Advocate Verification: Pending</span>
                </div>
              ) : (
                <button
                  onClick={onOpenLawyerModal}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-300 bg-blue-950/60 border border-blue-700/60 hover:bg-blue-900/60 transition-colors cursor-pointer"
                  title="Verify Bar Council Enrollment"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Advocate Verification</span>
                </button>
              )}
            </>
          )}

          {/* Indian 10-Language Switcher */}
          <div className="relative flex items-center">
            <Globe className="w-3.5 h-3.5 absolute left-2.5 text-stone-400 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
              className="pl-7 pr-2 py-1.5 rounded-lg bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium focus:ring-2 focus:ring-amber-500 cursor-pointer"
              title="Select Indian Language"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-stone-800 text-stone-100">
                  {lang.nativeName} ({lang.label})
                </option>
              ))}
            </select>
          </div>

          {/* Security & Isolation Status Trigger */}
          <button
            id="security-status-button"
            type="button"
            onClick={onOpenSecurityModal}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-700/60 hover:bg-emerald-900/60 transition-colors cursor-pointer"
            title="View Firestore Security & Zero-Hallucination Threat Model"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Isolated Vault</span>
          </button>

          {user && (
            <>
              {/* User Profile Pill & Role Badge */}
              <div 
                id="user-profile-badge" 
                className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-200"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full ring-1 ring-stone-600"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-[10px]">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="font-medium max-w-[100px] truncate hidden sm:inline">
                  {user.displayName}
                </span>

                {/* Dynamic Role Tag */}
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${
                  userRole === 'ADMIN'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    : userRole === 'LAWYER'
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                    : 'bg-stone-700 text-stone-300'
                }`}>
                  {userRole}
                </span>
              </div>

              {/* Sign Out Button */}
              <button
                id="logout-button"
                type="button"
                onClick={onLogout}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-stone-300 bg-stone-800 border border-stone-700 hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-700/60 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.nav.logout}</span>
              </button>
            </>
          )}

        </div>

      </div>

      {/* Mobile Sub-Navigation Bar */}
      {user && (
        <div className="lg:hidden border-t border-stone-800 bg-stone-950 px-3 py-2 flex items-center overflow-x-auto gap-2 text-xs">
          {(userRole === 'LAWYER' || userRole === 'ADMIN') && (
            <button
              onClick={() => onSelectView('lawyer-workspace')}
              className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
                activeView === 'lawyer-workspace' ? 'bg-blue-600 text-white' : 'text-blue-300'
              }`}
            >
              Lawyer Chamber
            </button>
          )}
          {userRole === 'ADMIN' && (
            <button
              onClick={() => onSelectView('admin')}
              className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
                activeView === 'admin' ? 'bg-rose-600 text-white' : 'text-rose-300'
              }`}
            >
              Admin Portal
            </button>
          )}
          <button
            onClick={() => onSelectView('library')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeView === 'library' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            {t.nav.sourceLibrary} ({sourcesCount})
          </button>
          <button
            onClick={() => onSelectView('trace')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeView === 'trace' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            {t.nav.caseTrace}
          </button>
          <button
            onClick={() => onSelectView('analysis')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeView === 'analysis' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            {t.actions.analyzeCase}
          </button>
          <button
            onClick={() => onSelectView('comparison')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeView === 'comparison' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            {t.nav.caseComparison}
          </button>
          <button
            onClick={() => onSelectView('canvas')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeView === 'canvas' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            {t.nav.newResearch}
          </button>
          <button
            onClick={() => onSelectView('findings')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeView === 'findings' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            {t.nav.savedFindings}
          </button>
          <button
            onClick={() => onSelectView('journal')}
            className={`px-2.5 py-1 rounded-md shrink-0 font-medium ${
              activeView === 'journal' ? 'bg-amber-500 text-stone-950' : 'text-stone-400'
            }`}
          >
            Journal
          </button>
        </div>
      )}
    </header>
  );
};

