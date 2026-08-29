import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  User as UserIcon, 
  Database,
  Cpu
} from 'lucide-react';
import type { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onOpenSecurityModal: () => void;
  entriesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  onOpenSecurityModal,
  entriesCount,
}) => {
  return (
    <header id="main-navbar" className="bg-white/80 backdrop-blur-md border-b border-stone-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & App Info */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-700">
            <Sparkles className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-semibold tracking-tight text-stone-900 font-serif">
                Reflections & Journal
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              AI-assisted multi-turn reflections & user-isolated Firestore
            </p>
          </div>
        </div>

        {/* Security & User Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Security & Isolation Status Trigger */}
          <button
            id="security-status-button"
            type="button"
            onClick={onOpenSecurityModal}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            title="View Firestore Security & Isolation Verification"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">User Isolated Vault</span>
          </button>

          {user && (
            <>
              {/* User Profile Pill */}
              <div 
                id="user-profile-badge" 
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-xs text-stone-700"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-5 h-5 rounded-full ring-1 ring-stone-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold text-[10px]">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="font-medium max-w-[120px] truncate">
                  {user.displayName}
                </span>
                {user.isAnonymous && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-stone-200 text-stone-600 rounded">
                    Guest
                  </span>
                )}
              </div>

              {/* Sign Out Button */}
              <button
                id="logout-button"
                type="button"
                onClick={onLogout}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 bg-stone-50 border border-stone-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
};
