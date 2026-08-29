import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  loginWithGoogle, 
  loginAsGuest, 
  logoutUser, 
  toUserProfile, 
  fetchUserEntries, 
  saveUserEntry, 
  deleteUserEntry 
} from './lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { JournalEntry, UserProfile } from './types';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { SidebarHistory } from './components/SidebarHistory';
import { ActiveReflectionCanvas } from './components/ActiveReflectionCanvas';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';
import { AlertCircle, CheckCircle, Menu, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to create a fresh new entry
  const createNewEntry = useCallback((userId: string): JournalEntry => {
    const timestamp = Date.now();
    return {
      id: `entry_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: 'New Reflection',
      content: '',
      mood: 'Reflective',
      tags: [],
      interactions: [],
      summary: '',
      keyInsights: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const profile = toUserProfile(user);
        setCurrentUser(profile);
        setAuthLoading(false);
        setAuthError(null);

        // Load isolated entries for this user
        setEntriesLoading(true);
        try {
          const userEntries = await fetchUserEntries(profile.uid);
          setEntries(userEntries);
          if (userEntries.length > 0) {
            setSelectedEntry(userEntries[0]);
          } else {
            // Scaffold initial reflection entry
            const initial = createNewEntry(profile.uid);
            initial.title = 'Welcome to Gemini Reflections';
            initial.content = 'Write down any thought, goal, or creative challenge here. Then choose a perspective and invite Gemini to reflect with you.';
            initial.mood = 'Inspired';
            initial.tags = ['welcome', 'first-reflection'];
            setSelectedEntry(initial);
            await saveUserEntry(profile.uid, initial);
            setEntries([initial]);
          }
        } catch (err: any) {
          console.error('Failed to load user entries from Firestore:', err);
          showToast('error', 'Could not sync Firestore entries: ' + (err.message || 'Permission denied'));
        } finally {
          setEntriesLoading(false);
        }
      } else {
        setCurrentUser(null);
        setEntries([]);
        setSelectedEntry(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [createNewEntry]);

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setAuthError(err?.message || 'Google Sign-In was cancelled or failed. You can also explore with Guest Member mode.');
      setAuthLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginAsGuest();
    } catch (err: any) {
      console.error('Guest sign-in failed:', err);
      setAuthError(err?.message || 'Guest sign-in failed.');
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      showToast('success', 'Signed out successfully.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Entry Management
  const handleSaveEntry = async (updatedEntry: JournalEntry) => {
    if (!currentUser) return;
    setSaveStatus('saving');

    try {
      await saveUserEntry(currentUser.uid, updatedEntry);
      
      // Update local entries list
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === updatedEntry.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedEntry;
          return next.sort((a, b) => b.updatedAt - a.updatedAt);
        } else {
          return [updatedEntry, ...prev];
        }
      });
      setSelectedEntry(updatedEntry);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Failed to persist to Firestore:', err);
      setSaveStatus('error');
      showToast('error', 'Firestore save failed: ' + (err.message || 'Check database permissions'));
    }
  };

  const handleNewEntry = () => {
    if (!currentUser) return;
    const newEntry = createNewEntry(currentUser.uid);
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntry(newEntry);
    setIsMobileSidebarOpen(false);
    saveUserEntry(currentUser.uid, newEntry).catch(console.error);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!currentUser) return;
    try {
      await deleteUserEntry(currentUser.uid, entryId);
      const remaining = entries.filter((e) => e.id !== entryId);
      setEntries(remaining);
      if (selectedEntry?.id === entryId) {
        if (remaining.length > 0) {
          setSelectedEntry(remaining[0]);
        } else {
          const fresh = createNewEntry(currentUser.uid);
          setEntries([fresh]);
          setSelectedEntry(fresh);
          await saveUserEntry(currentUser.uid, fresh);
        }
      }
      showToast('success', 'Entry deleted from Firestore.');
    } catch (err: any) {
      console.error('Delete entry failed:', err);
      showToast('error', 'Failed to delete entry: ' + (err.message || 'Error'));
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Navigation Header */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        entriesCount={entries.length}
      />

      {/* Main App Body */}
      {authLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-3 py-24">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-stone-600">Initializing authenticated session...</p>
        </div>
      ) : !currentUser ? (
        /* Landing & Authentication View */
        <LandingView
          onGoogleSignIn={handleGoogleSignIn}
          onGuestSignIn={handleGuestSignIn}
          isLoading={authLoading}
          authError={authError}
        />
      ) : (
        /* Private Dashboard View */
        <div className="flex-1 flex relative overflow-hidden">
          
          {/* Mobile Sidebar Toggle Button */}
          <div className="md:hidden fixed bottom-4 right-4 z-40">
            <button
              id="mobile-sidebar-toggle"
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-3 bg-stone-900 text-white rounded-full shadow-lg flex items-center justify-center"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Sidebar History (Desktop + Mobile overlay) */}
          <div className={`${
            isMobileSidebarOpen 
              ? 'fixed inset-0 z-30 flex md:relative md:flex' 
              : 'hidden md:flex'
          }`}>
            {isMobileSidebarOpen && (
              <div 
                className="fixed inset-0 bg-stone-900/30 backdrop-blur-xs md:hidden"
                onClick={() => setIsMobileSidebarOpen(false)} 
              />
            )}
            <div className="relative z-10 w-full max-w-xs md:max-w-none md:w-auto bg-white md:bg-transparent">
              <SidebarHistory
                entries={entries}
                selectedEntryId={selectedEntry?.id || null}
                onSelectEntry={(entry) => {
                  setSelectedEntry(entry);
                  setIsMobileSidebarOpen(false);
                }}
                onNewEntry={handleNewEntry}
                onDeleteEntry={handleDeleteEntry}
                isLoading={entriesLoading}
              />
            </div>
          </div>

          {/* Active Reflection Canvas */}
          {selectedEntry ? (
            <ActiveReflectionCanvas
              key={selectedEntry.id}
              entry={selectedEntry}
              onSaveEntry={handleSaveEntry}
              saveStatus={saveStatus}
              userId={currentUser.uid}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-stone-500">
              Select or create a reflection entry to start thinking with Gemini.
            </div>
          )}

        </div>
      )}

      {/* Security Badge Inspector Modal */}
      <SecurityBadgeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        userId={currentUser?.uid}
      />

      {/* Toast Feedback */}
      {toastMessage && (
        <div 
          id="app-toast-alert"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-lg text-xs font-medium flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-stone-900 text-white'
              : 'bg-rose-900 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
}
