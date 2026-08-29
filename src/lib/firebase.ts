import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged,
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
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';
import type { JournalEntry, UserProfile } from '../types';

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
export const db: Firestore = (firebaseConfigRaw as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfigRaw as any).firestoreDatabaseId)
  : getFirestore(app);

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
    // If popup is blocked in iframe sandbox, attempt redirect or fallback
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
    displayName: user.displayName || (user.isAnonymous ? 'Guest Member' : user.email?.split('@')[0] || 'User'),
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

/**
 * Fetch all entries strictly isolated to the authenticated user's path:
 * /users/{userId}/entries/{entryId}
 */
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

/**
 * Save or update a journal entry strictly isolated to the authenticated user's path:
 * /users/{userId}/entries/{entryId}
 */
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

  // Also record a mirror interaction log to /users/{userId}/interactions/{interactionId} for auditing & compliance
  if (entry.interactions && entry.interactions.length > 0) {
    const latestInteraction = entry.interactions[entry.interactions.length - 1];
    if (latestInteraction) {
      const interactionRef = doc(db, 'users', userId, 'interactions', latestInteraction.id || `${entry.id}_${Date.now()}`);
      await setDoc(interactionRef, sanitizeFirestorePayload({
        entryId: entry.id,
        entryTitle: entry.title,
        userId,
        prompt: latestInteraction.role === 'user' ? latestInteraction.content : '',
        response: latestInteraction.role === 'assistant' ? latestInteraction.content : '',
        mode: latestInteraction.mode || entry.mode || 'reflection',
        modelUsed: latestInteraction.modelUsed || 'gemini-3.6-flash',
        timestamp: latestInteraction.timestamp || Date.now(),
      }), { merge: true });
    }
  }
}

/**
 * Delete a journal entry isolated to the authenticated user's path
 */
export async function deleteUserEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) throw new Error('User ID and Entry ID are required to delete entry.');
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
}
