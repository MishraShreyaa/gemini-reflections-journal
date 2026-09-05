import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  signInAnonymously,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc,
  getDocFromServer,
  deleteDoc, 
  query, 
  orderBy, 
  type Firestore
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';
import type { 
  JournalEntry, 
  UserProfile, 
  ResearchSession, 
  SourceDocument, 
  CaseAnalysis, 
  SavedFinding, 
  ResearchDigest,
  SupportedLanguage 
} from '../types';

const firebaseConfig = {
  apiKey: firebaseConfigRaw.apiKey,
  authDomain: firebaseConfigRaw.authDomain,
  projectId: firebaseConfigRaw.projectId,
  storageBucket: firebaseConfigRaw.storageBucket,
  messagingSenderId: firebaseConfigRaw.messagingSenderId,
  appId: firebaseConfigRaw.appId,
  measurementId: firebaseConfigRaw.measurementId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Use custom firestore database if specified in config
const targetDbId = (firebaseConfigRaw as any).firestoreDatabaseId || (firebaseConfigRaw as any).databaseId;
export const db: Firestore = targetDbId 
  ? getFirestore(app, targetDbId)
  : getFirestore(app);

// Validate Connection to Firestore on startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline status or pending connection:', error.message);
    }
  }
}
testConnection();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Strips all undefined values recursively from payload before writing to Firestore
 * to guarantee zero-crash payload hygiene.
 */
export function sanitizeFirestorePayload<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeFirestorePayload(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        item !== null && typeof item === 'object' ? sanitizeFirestorePayload(item) : item
      ).filter(item => item !== undefined);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.warn('Popup sign in failed, attempting redirect/fallback:', error);
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, googleProvider);
        const redirectRes = await getRedirectResult(auth);
        if (redirectRes) return redirectRes.user;
      } catch (redirectErr) {
        console.error('Redirect sign in also failed:', redirectErr);
      }
    }
    throw error;
  }
}

export async function loginAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function toUserProfile(user: User): UserProfile {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || (user.isAnonymous ? 'Guest Advocate' : user.email?.split('@')[0] || 'Advocate'),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

// ==========================================
// PRESERVED JOURNAL METHODS (Backward Compatibility)
// ==========================================

export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) throw new Error('User ID is required to fetch journal entries.');
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));
  try {
    const snapshot = await getDocs(q);
    const entries: JournalEntry[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      entries.push({
        id: docSnap.id,
        userId: data.userId || userId,
        title: data.title || 'Untitled Reflection',
        content: data.content || '',
        mood: data.mood || 'Reflective',
        tags: data.tags || [],
        summary: data.summary || '',
        keyInsights: data.keyInsights || [],
        interactions: data.interactions || [],
        createdAt: data.createdAt || Date.now(),
        updatedAt: data.updatedAt || Date.now(),
      });
    });
    return entries;
  } catch (error) {
    console.error('Error fetching user entries:', error);
    throw error;
  }
}

export async function saveUserEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) throw new Error('User ID is required to save entry.');
  if (!entry.id) throw new Error('Entry ID is required.');
  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  const payload = sanitizeFirestorePayload({
    ...entry,
    userId,
    updatedAt: Date.now(),
  });
  await setDoc(entryRef, payload, { merge: true });
}

export async function deleteUserEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required to delete entry.');
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}

// ==========================================
// NYAYATRACE FIRESTORE METHODS
// ==========================================

/**
 * Fetch all research sessions strictly scoped to the authenticated user: /users/{userId}/researchSessions/{sessionId}
 */
export async function fetchUserSessions(userId: string): Promise<ResearchSession[]> {
  if (!userId) throw new Error('User ID is required.');
  const collRef = collection(db, 'users', userId, 'researchSessions');
  const q = query(collRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  const list: ResearchSession[] = [];
  snapshot.forEach(d => {
    const data = d.data();
    list.push({
      id: d.id,
      userId: data.userId || userId,
      title: data.title || 'Untitled Research',
      researchQuestion: data.researchQuestion || '',
      legalTopic: data.legalTopic || 'General Law',
      notes: data.notes || '',
      sourceDocumentIds: data.sourceDocumentIds || data.attachedSourceIds || [],
      messages: data.messages || [],
      caseTraceIds: data.caseTraceIds || data.caseTraceRelationships || [],
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
    });
  });
  return list;
}

export async function saveUserSession(userId: string, session: ResearchSession): Promise<void> {
  if (!userId || !session.id) throw new Error('User ID and Session ID required.');
  const docRef = doc(db, 'users', userId, 'researchSessions', session.id);
  const payload = sanitizeFirestorePayload({
    ...session,
    userId,
    updatedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteUserSession(userId: string, sessionId: string): Promise<void> {
  if (!userId || !sessionId) throw new Error('User ID and Session ID required.');
  const docRef = doc(db, 'users', userId, 'researchSessions', sessionId);
  await deleteDoc(docRef);
}

/**
 * Source Library Operations: /users/{userId}/sources/{sourceId}
 */
export async function fetchUserSources(userId: string): Promise<SourceDocument[]> {
  if (!userId) throw new Error('User ID is required.');
  const collRef = collection(db, 'users', userId, 'sources');
  const q = query(collRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  const list: SourceDocument[] = [];
  snapshot.forEach(d => {
    const data = d.data();
    list.push({
      id: d.id,
      userId: data.userId || userId,
      sessionId: data.sessionId,
      title: data.title || 'Untitled Document',
      sourceType: data.sourceType || 'text',
      rawText: data.rawText || '',
      citation: data.citation || '',
      court: data.court || '',
      date: data.date || '',
      url: data.url,
      pageCount: data.pageCount,
      verificationStatus: data.verificationStatus || 'user_provided_needs_verification',
      sourceOrigin: data.sourceOrigin || 'User Upload',
      isVerified: !!data.isVerified,
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
    });
  });
  return list;
}

export async function saveUserSource(userId: string, source: SourceDocument): Promise<void> {
  if (!userId || !source.id) throw new Error('User ID and Source ID required.');
  const docRef = doc(db, 'users', userId, 'sources', source.id);
  const payload = sanitizeFirestorePayload({
    ...source,
    userId,
    updatedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteUserSource(userId: string, sourceId: string): Promise<void> {
  if (!userId || !sourceId) throw new Error('User ID and Source ID required.');
  const docRef = doc(db, 'users', userId, 'sources', sourceId);
  await deleteDoc(docRef);
}

/**
 * Case Analysis: /users/{userId}/analyses/{analysisId}
 */
export async function fetchUserAnalyses(userId: string): Promise<CaseAnalysis[]> {
  if (!userId) throw new Error('User ID is required.');
  const collRef = collection(db, 'users', userId, 'analyses');
  const snapshot = await getDocs(collRef);
  const list: CaseAnalysis[] = [];
  snapshot.forEach(d => {
    list.push({ id: d.id, ...d.data() } as CaseAnalysis);
  });
  return list;
}

export async function saveUserAnalysis(userId: string, analysis: CaseAnalysis): Promise<void> {
  if (!userId || !analysis.id) throw new Error('User ID and Analysis ID required.');
  const docRef = doc(db, 'users', userId, 'analyses', analysis.id);
  const payload = sanitizeFirestorePayload({
    ...analysis,
    analyzedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

/**
 * Saved Findings: /users/{userId}/findings/{findingId}
 */
export async function fetchUserFindings(userId: string): Promise<SavedFinding[]> {
  if (!userId) throw new Error('User ID is required.');
  const collRef = collection(db, 'users', userId, 'findings');
  const q = query(collRef, orderBy('savedAt', 'desc'));
  const snapshot = await getDocs(q);
  const list: SavedFinding[] = [];
  snapshot.forEach(d => {
    const data = d.data();
    list.push({
      id: d.id,
      userId: data.userId || userId,
      title: data.title || 'Saved Finding',
      findingText: data.findingText || '',
      sourceTitle: data.sourceTitle,
      savedAt: data.savedAt || Date.now(),
    });
  });
  return list;
}

export async function saveUserFinding(userId: string, finding: SavedFinding): Promise<void> {
  if (!userId || !finding.id) throw new Error('User ID and Finding ID required.');
  const docRef = doc(db, 'users', userId, 'findings', finding.id);
  const payload = sanitizeFirestorePayload({
    ...finding,
    userId,
    savedAt: finding.savedAt || Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

export async function deleteUserFinding(userId: string, findingId: string): Promise<void> {
  if (!userId || !findingId) throw new Error('User ID and Finding ID required.');
  const docRef = doc(db, 'users', userId, 'findings', findingId);
  await deleteDoc(docRef);
}

/**
 * Research Digests: /users/{userId}/digests/{digestId}
 */
export async function fetchUserDigests(userId: string): Promise<ResearchDigest[]> {
  if (!userId) return [];
  const collRef = collection(db, 'users', userId, 'digests');
  const q = query(collRef, orderBy('generatedAt', 'desc'));
  try {
    const snapshot = await getDocs(q);
    const list: ResearchDigest[] = [];
    snapshot.forEach(d => {
      list.push({ id: d.id, ...d.data() } as ResearchDigest);
    });
    return list;
  } catch (e) {
    console.warn('Digests collection read warning:', e);
    return [];
  }
}

export async function saveUserDigest(userId: string, digest: ResearchDigest): Promise<void> {
  if (!userId || !digest.id) throw new Error('User ID and Digest ID required.');
  const docRef = doc(db, 'users', userId, 'digests', digest.id);
  const payload = sanitizeFirestorePayload({
    ...digest,
    userId,
    generatedAt: Date.now(),
  });
  await setDoc(docRef, payload, { merge: true });
}

/**
 * User Settings (e.g. Language Preference): /users/{userId}/settings/preferences
 */
export async function fetchUserLanguagePreference(userId: string): Promise<SupportedLanguage> {
  if (!userId) return 'en';
  try {
    const docRef = doc(db, 'users', userId, 'settings', 'preferences');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return (snap.data().language as SupportedLanguage) || 'en';
    }
  } catch (err) {
    console.warn('Could not fetch language preference:', err);
  }
  return 'en';
}

export async function saveUserLanguagePreference(userId: string, language: SupportedLanguage): Promise<void> {
  if (!userId) return;
  const docRef = doc(db, 'users', userId, 'settings', 'preferences');
  await setDoc(docRef, sanitizeFirestorePayload({ language, updatedAt: Date.now() }), { merge: true });
}

// ==========================================
// SERVER-AUTHORITATIVE RBAC & API CLIENT HELPERS
// ==========================================

export async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  try {
    return await user.getIdToken();
  } catch (err) {
    console.warn('Could not get Firebase ID token:', err);
    return null;
  }
}

export async function fetchServerUserProfile(): Promise<{
  uid: string;
  email: string | null;
  role: 'USER' | 'LAWYER' | 'ADMIN';
  lawyerStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  barEnrollmentNumber?: string;
  stateBarCouncil?: string;
  isSuspended: boolean;
  lawyerApplication?: any;
}> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/auth/me', { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch server profile (${res.status})`);
  }
  return res.json();
}

export async function applyForLawyerVerification(data: {
  fullName: string;
  email?: string;
  barEnrollmentNumber: string;
  stateBarCouncil: string;
  practiceAreas?: string[];
  experienceYears?: number;
}): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/lawyer/apply', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to submit lawyer verification application.');
  }
  return res.json();
}

export async function fetchApprovedGlobalSources(): Promise<any[]> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/sources/approved', { headers });
  if (!res.ok) {
    throw new Error('Failed to fetch approved legal sources.');
  }
  const data = await res.json();
  return data.sources || [];
}

export async function fetchAdminUsers(): Promise<any[]> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/admin/users', { headers });
  if (!res.ok) throw new Error('Unauthorized: Admin role required.');
  const data = await res.json();
  return data.users || [];
}

export async function updateAdminUserRole(uid: string, role?: string, isSuspended?: boolean): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/admin/users/${uid}/role`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ role, isSuspended }),
  });
  if (!res.ok) throw new Error('Failed to update user role.');
  return res.json();
}

export async function fetchAdminLawyerApplications(): Promise<any[]> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/admin/lawyer-applications', { headers });
  if (!res.ok) throw new Error('Unauthorized: Admin role required.');
  const data = await res.json();
  return data.applications || [];
}

export async function decideAdminLawyerApplication(appId: string, decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED', adminNotes?: string): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/admin/lawyer-applications/${appId}/decide`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ decision, adminNotes }),
  });
  if (!res.ok) throw new Error('Failed to record lawyer application decision.');
  return res.json();
}

export async function fetchAdminSources(statusFilter?: string): Promise<any[]> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = statusFilter ? `/api/admin/sources?status=${encodeURIComponent(statusFilter)}` : '/api/admin/sources';
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch admin sources.');
  const data = await res.json();
  return data.sources || [];
}

export async function createAdminSource(sourceData: any): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/admin/sources', {
    method: 'POST',
    headers,
    body: JSON.stringify(sourceData),
  });
  if (!res.ok) throw new Error('Failed to upload/create legal source.');
  return res.json();
}

export async function updateAdminSourceStatus(sourceId: string, status: string, adminNotes?: string): Promise<any> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/admin/sources/${sourceId}/status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ status, adminNotes }),
  });
  if (!res.ok) throw new Error('Failed to update legal source status.');
  return res.json();
}

export async function fetchAdminAuditLogs(): Promise<any[]> {
  const token = await getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/admin/audit-logs', { headers });
  if (!res.ok) throw new Error('Failed to fetch audit logs.');
  const data = await res.json();
  return data.logs || [];
}

