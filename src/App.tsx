import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, 
  loginWithGoogle, 
  loginAsGuest, 
  logoutUser, 
  toUserProfile, 
  fetchUserEntries, 
  saveUserEntry, 
  deleteUserEntry,
  fetchUserSources,
  saveUserSource,
  deleteUserSource,
  fetchUserSessions,
  saveUserSession,
  fetchUserFindings,
  saveUserFinding,
  deleteUserFinding,
  fetchUserDigests,
  saveUserDigest,
} from './lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import type { 
  JournalEntry, 
  UserProfile, 
  SourceDocument, 
  ResearchSession, 
  CaseAnalysis, 
  CaseRelationship, 
  CaseComparison, 
  SavedFinding, 
  ResearchDigest, 
  SupportedLanguage 
} from './types';
import { Navbar } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { SidebarHistory } from './components/SidebarHistory';
import { ActiveReflectionCanvas } from './components/ActiveReflectionCanvas';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';
import { SourceLibraryView } from './components/SourceLibraryView';
import { CaseTraceGraphView } from './components/CaseTraceGraphView';
import { StructuredCaseAnalysisView } from './components/StructuredCaseAnalysisView';
import { CaseComparisonView } from './components/CaseComparisonView';
import { ResearchAssistantCanvas } from './components/ResearchAssistantCanvas';
import { SavedFindingsView } from './components/SavedFindingsView';
import { AlertCircle, CheckCircle, Menu, X, BookMarked } from 'lucide-react';

export default function App() {
  // Authentication & User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active Workspace Navigation View
  const [activeView, setActiveView] = useState<'library' | 'trace' | 'analysis' | 'comparison' | 'canvas' | 'findings' | 'journal'>('library');
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  // Legal Data States
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceDocument | null>(null);
  const [activeAnalysis, setActiveAnalysis] = useState<CaseAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Case Relationships State
  const [relationships, setRelationships] = useState<CaseRelationship[]>([]);
  const [isTracing, setIsTracing] = useState<boolean>(false);

  // Research Sessions State
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [isRespondingToChat, setIsRespondingToChat] = useState<boolean>(false);

  // Findings & Digests
  const [findings, setFindings] = useState<SavedFinding[]>([]);
  const [digests, setDigests] = useState<ResearchDigest[]>([]);
  const [isGeneratingDigest, setIsGeneratingDigest] = useState<boolean>(false);

  // Preserved Journal & Reflections State
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Modals & UI Controls
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper to create a fresh new research session
  const createNewSession = useCallback((userId: string): ResearchSession => {
    const timestamp = Date.now();
    return {
      id: `session_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: 'Constitutional Basic Structure Inquiry',
      legalTopic: 'Constitutional Law',
      researchQuestion: 'How does the doctrine of Basic Structure limit amendment powers under Article 368?',
      sourceDocumentIds: [],
      messages: [],
      caseTraceIds: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }, []);

  // Helper to create a fresh new reflection entry
  const createNewEntry = useCallback((userId: string): JournalEntry => {
    const timestamp = Date.now();
    return {
      id: `entry_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      title: 'New Legal & Reflection Note',
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

  // Sync Firebase Auth & Load Isolated User Collections
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const profile = toUserProfile(user);
        setCurrentUser(profile);
        setAuthLoading(false);
        setAuthError(null);

        // Load isolated user data collections
        try {
          const [userSources, userSessions, userFindings, userDigests, userEntries] = await Promise.all([
            fetchUserSources(profile.uid),
            fetchUserSessions(profile.uid),
            fetchUserFindings(profile.uid),
            fetchUserDigests(profile.uid),
            fetchUserEntries(profile.uid),
          ]);

          setSources(userSources);
          if (userSources.length > 0) {
            setSelectedSource(userSources[0]);
          }

          setSessions(userSessions);
          if (userSessions.length > 0) {
            setActiveSession(userSessions[0]);
          } else {
            const initialSession = createNewSession(profile.uid);
            setActiveSession(initialSession);
            await saveUserSession(profile.uid, initialSession);
            setSessions([initialSession]);
          }

          setFindings(userFindings);
          setDigests(userDigests);
          setEntries(userEntries);
          if (userEntries.length > 0) {
            setSelectedEntry(userEntries[0]);
          }
        } catch (err: any) {
          console.error('Failed to sync isolated Firestore collections:', err);
          showToast('error', 'Firestore synchronization: ' + (err.message || 'Permission denied'));
        }
      } else {
        setCurrentUser(null);
        setSources([]);
        setSelectedSource(null);
        setRelationships([]);
        setSessions([]);
        setActiveSession(null);
        setFindings([]);
        setDigests([]);
        setEntries([]);
        setSelectedEntry(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, [createNewSession]);

  // Auth Handlers
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In failed:', err);
      setAuthError(err?.message || 'Google Sign-In was cancelled or failed.');
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
      showToast('success', 'Signed out from legal workspace.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Source Document Handlers
  const handleAddSource = async (source: SourceDocument) => {
    if (!currentUser) return;
    source.userId = currentUser.uid;
    await saveUserSource(currentUser.uid, source);
    setSources((prev) => [source, ...prev]);
    setSelectedSource(source);
    showToast('success', `Saved "${source.title}" to authentic source library.`);
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!currentUser) return;
    await deleteUserSource(currentUser.uid, sourceId);
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
    if (selectedSource?.id === sourceId) {
      setSelectedSource(sources.find((s) => s.id !== sourceId) || null);
    }
    showToast('success', 'Source removed from library.');
  };

  // Structured Analysis Execution
  const handleRunAnalysis = async (source: SourceDocument) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/nyaya/analyze-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: source.rawText,
          documentTitle: source.title,
          sourceOrigin: source.sourceOrigin,
        }),
      });

      if (!response.ok) {
        throw new Error('Structured analysis service returned an error.');
      }

      const data = await response.json();
      setActiveAnalysis(data.analysis);
      setActiveView('analysis');
      showToast('success', `Completed structured analysis for "${source.title}".`);
    } catch (err: any) {
      console.error('Structured analysis error:', err);
      showToast('error', err.message || 'Failed to complete structured analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Case Trace Execution
  const handleRefreshTrace = async () => {
    if (sources.length === 0) return;
    setIsTracing(true);
    try {
      const response = await fetch('/api/nyaya/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources }),
      });

      if (!response.ok) {
        throw new Error('Case trace extraction service returned an error.');
      }

      const data = await response.json();
      setRelationships(data.relationships || []);
      showToast('success', `Extracted ${data.relationships?.length || 0} source-verified precedent treatments.`);
    } catch (err: any) {
      console.error('Case trace error:', err);
      showToast('error', err.message || 'Failed to extract precedent relationships.');
    } finally {
      setIsTracing(false);
    }
  };

  // Case Comparison Execution
  const handleCompareCases = async (caseDocs: SourceDocument[]): Promise<CaseComparison | null> => {
    try {
      const response = await fetch('/api/nyaya/compare-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cases: caseDocs }),
      });

      if (!response.ok) {
        throw new Error('Case comparison service returned an error.');
      }

      const data = await response.json();
      const comp: CaseComparison = {
        id: `comp_${Date.now()}`,
        userId: currentUser?.uid || '',
        casesCompared: data.casesCompared || [],
        factsComparison: data.comparison.factsComparison || '',
        issuesComparison: data.comparison.issuesComparison || '',
        decisionComparison: data.comparison.decisionComparison || '',
        ratioComparison: data.comparison.ratioComparison || '',
        statutoryProvisionsComparison: data.comparison.statutoryProvisionsComparison || '',
        treatmentOfPrecedents: data.comparison.treatmentOfPrecedents || '',
        keySimilarities: data.comparison.keySimilarities || [],
        keyDistinctions: data.comparison.keyDistinctions || [],
        unverifiedObservations: data.comparison.unverifiedObservations || [],
        comparedAt: Date.now(),
      };
      return comp;
    } catch (err: any) {
      console.error('Case comparison error:', err);
      showToast('error', err.message || 'Failed to compare judgments.');
      return null;
    }
  };

  // Multi-Turn Chat Messaging in Research Assistant Canvas
  const handleSendMessage = async (text: string) => {
    if (!currentUser || !activeSession) return;
    setIsRespondingToChat(true);

    const userMessage = {
      id: `msg_${Date.now()}_user`,
      role: 'user' as const,
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...activeSession.messages, userMessage];
    const sessionWithUserMsg = {
      ...activeSession,
      messages: updatedMessages,
      updatedAt: Date.now(),
    };

    setActiveSession(sessionWithUserMsg);
    await saveUserSession(currentUser.uid, sessionWithUserMsg);

    try {
      const response = await fetch('/api/nyaya/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          researchQuestion: activeSession.researchQuestion,
          sources,
          history: updatedMessages.slice(-8).map((m) => ({
            role: m.role,
            parts: [{ text: m.content }],
          })),
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Research inquiry assistant returned an error.');
      }

      const data = await response.json();
      const modelMessage = {
        id: `msg_${Date.now()}_model`,
        role: 'model' as const,
        content: data.reply,
        classification: data.classification || 'AI_ANALYSIS',
        supportingSourceIds: sources.map((s) => s.id),
        timestamp: Date.now(),
      };

      const finalSession = {
        ...sessionWithUserMsg,
        messages: [...updatedMessages, modelMessage],
        updatedAt: Date.now(),
      };

      setActiveSession(finalSession);
      await saveUserSession(currentUser.uid, finalSession);
    } catch (err: any) {
      console.error('Chat inquiry error:', err);
      showToast('error', err.message || 'Failed to generate legal response.');
    } finally {
      setIsRespondingToChat(false);
    }
  };

  // Saved Findings & Digest Handlers
  const handleSaveFinding = async (title: string, text: string, sourceLocation?: string) => {
    if (!currentUser) return;
    const newFinding: SavedFinding = {
      id: `find_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: currentUser.uid,
      title,
      findingText: text,
      sourceTitle: sourceLocation || 'NyayaTrace Analysis',
      savedAt: Date.now(),
    };

    await saveUserFinding(currentUser.uid, newFinding);
    setFindings((prev) => [newFinding, ...prev]);
    showToast('success', 'Finding saved to private vault.');
  };

  const handleDeleteFinding = async (findingId: string) => {
    if (!currentUser) return;
    await deleteUserFinding(currentUser.uid, findingId);
    setFindings((prev) => prev.filter((f) => f.id !== findingId));
    showToast('success', 'Finding deleted from vault.');
  };

  const handleGenerateDigest = async () => {
    if (!currentUser || findings.length === 0) return;
    setIsGeneratingDigest(true);
    try {
      const response = await fetch('/api/nyaya/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          findings,
          sessions,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Research digest service returned an error.');
      }

      const data = await response.json();
      const newDigest: ResearchDigest = {
        id: `digest_${Date.now()}`,
        userId: currentUser.uid,
        periodLabel: data.digest.periodLabel || 'Research Period',
        frequentlyResearchedTopics: data.digest.frequentlyResearchedTopics || [],
        recurringLegalIssues: data.digest.recurringLegalIssues || [],
        keyFindingsSummary: data.digest.keyFindingsSummary || '',
        unresolvedQuestions: data.digest.unresolvedQuestions || [],
        suggestedAvenuesForInvestigation: data.digest.suggestedAvenuesForInvestigation || [],
        generatedAt: Date.now(),
      };

      await saveUserDigest(currentUser.uid, newDigest);
      setDigests((prev) => [newDigest, ...prev]);
      showToast('success', 'Executive research digest generated.');
    } catch (err: any) {
      console.error('Digest error:', err);
      showToast('error', err.message || 'Failed to generate digest.');
    } finally {
      setIsGeneratingDigest(false);
    }
  };

  // Preserved Reflection Management Handlers
  const handleSaveEntry = async (updatedEntry: JournalEntry) => {
    if (!currentUser) return;
    setSaveStatus('saving');
    try {
      await saveUserEntry(currentUser.uid, updatedEntry);
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === updatedEntry.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedEntry;
          return next.sort((a, b) => b.updatedAt - a.updatedAt);
        }
        return [updatedEntry, ...prev];
      });
      setSelectedEntry(updatedEntry);
      setSaveStatus('saved');
    } catch (err: any) {
      console.error('Failed to save entry to Firestore:', err);
      setSaveStatus('error');
      showToast('error', 'Save error: ' + (err.message || 'Permission denied'));
    }
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
          setSelectedEntry(fresh);
          await saveUserEntry(currentUser.uid, fresh);
          setEntries([fresh]);
        }
      }
      showToast('success', 'Reflection deleted.');
    } catch (err: any) {
      console.error('Failed to delete entry from Firestore:', err);
      showToast('error', 'Could not delete entry: ' + (err.message || 'Permission denied'));
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col justify-center items-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-stone-950 shadow-lg animate-pulse mb-4 font-serif font-bold text-lg">
          N
        </div>
        <p className="text-stone-300 font-serif font-bold text-base">Initializing NyayaTrace Secure Legal Workspace...</p>
        <p className="text-stone-500 text-xs mt-1">Verifying authenticated Firestore isolation</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 font-sans selection:bg-amber-500 selection:text-stone-950">
      
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        activeView={activeView}
        onSelectView={setActiveView}
        language={language}
        onSelectLanguage={setLanguage}
        sourcesCount={sources.length}
      />

      {/* Main Content Area */}
      {!currentUser ? (
        <LandingView
          onGoogleSignIn={handleGoogleSignIn}
          onGuestSignIn={handleGuestSignIn}
          isLoading={authLoading}
          authError={authError}
          language={language}
        />
      ) : (
        <main className="flex-1">
          
          {/* VIEW 1: SOURCE LIBRARY */}
          {activeView === 'library' && (
            <SourceLibraryView
              sources={sources}
              selectedSourceId={selectedSource?.id || null}
              onSelectSource={setSelectedSource}
              onAddSource={handleAddSource}
              onDeleteSource={handleDeleteSource}
              onAnalyzeSource={(src) => {
                setSelectedSource(src);
                handleRunAnalysis(src);
              }}
              language={language}
            />
          )}

          {/* VIEW 2: CASE TRACE GRAPH */}
          {activeView === 'trace' && (
            <CaseTraceGraphView
              sources={sources}
              relationships={relationships}
              onRefreshTrace={handleRefreshTrace}
              isLoading={isTracing}
              language={language}
            />
          )}

          {/* VIEW 3: STRUCTURED CASE ANALYSIS */}
          {activeView === 'analysis' && (
            <StructuredCaseAnalysisView
              sources={sources}
              selectedSource={selectedSource}
              onSelectSource={setSelectedSource}
              analysis={activeAnalysis}
              isLoading={isAnalyzing}
              onRunAnalysis={handleRunAnalysis}
              onSaveFinding={handleSaveFinding}
              language={language}
            />
          )}

          {/* VIEW 4: CASE COMPARISON */}
          {activeView === 'comparison' && (
            <CaseComparisonView
              sources={sources}
              onCompare={handleCompareCases}
              language={language}
              onSaveFinding={handleSaveFinding}
            />
          )}

          {/* VIEW 5: RESEARCH ASSISTANT CANVAS */}
          {activeView === 'canvas' && activeSession && (
            <ResearchAssistantCanvas
              currentSession={activeSession}
              sources={sources}
              onSendMessage={handleSendMessage}
              isLoading={isRespondingToChat}
              onSaveFinding={handleSaveFinding}
              onNewSession={() => {
                if (currentUser) {
                  const newSess = createNewSession(currentUser.uid);
                  setActiveSession(newSess);
                  setSessions((prev) => [newSess, ...prev]);
                  saveUserSession(currentUser.uid, newSess);
                }
              }}
              language={language}
              onSelectSource={(src) => {
                setSelectedSource(src);
                setActiveView('library');
              }}
            />
          )}

          {/* VIEW 6: SAVED FINDINGS & DIGEST */}
          {activeView === 'findings' && (
            <SavedFindingsView
              findings={findings}
              digest={digests[0] || null}
              onDeleteFinding={handleDeleteFinding}
              onGenerateDigest={handleGenerateDigest}
              isGeneratingDigest={isGeneratingDigest}
              language={language}
            />
          )}

          {/* VIEW 7: PRESERVED JOURNAL & REFLECTIONS */}
          {activeView === 'journal' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="mb-4 flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                <div>
                  <h3 className="text-base font-serif font-bold text-stone-900">
                    Personal Journal & Socratic Reflection Canvas
                  </h3>
                  <p className="text-xs text-stone-500">
                    Preserved reflection workspace with multi-turn thinking partner.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser) {
                      const fresh = createNewEntry(currentUser.uid);
                      setSelectedEntry(fresh);
                      handleSaveEntry(fresh);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800"
                >
                  + New Reflection
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                  <SidebarHistory
                    entries={entries}
                    selectedEntryId={selectedEntry?.id || null}
                    onSelectEntry={setSelectedEntry}
                    onNewEntry={() => {
                      if (currentUser) {
                        const fresh = createNewEntry(currentUser.uid);
                        setSelectedEntry(fresh);
                        handleSaveEntry(fresh);
                      }
                    }}
                    onDeleteEntry={handleDeleteEntry}
                    isLoading={entriesLoading}
                  />
                </div>
                <div className="lg:col-span-8">
                  {selectedEntry ? (
                    <ActiveReflectionCanvas
                      entry={selectedEntry}
                      onSaveEntry={handleSaveEntry}
                      onDeleteEntry={handleDeleteEntry}
                      saveStatus={saveStatus}
                    />
                  ) : (
                    <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-xs text-stone-500">
                      Select or create a reflection entry.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      )}

      {/* Security Threat Model & Isolation Modal */}
      <SecurityBadgeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          id="global-toast"
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

    </div>
  );
}
