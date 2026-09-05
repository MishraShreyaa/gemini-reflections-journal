import { auth, getAuthToken } from './firebase';

/**
 * Universal authenticated fetch utility.
 * Attaches Firebase ID Token or Guest Identifier automatically.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  } else if (auth.currentUser?.uid) {
    headers.set('Authorization', `Bearer ${auth.currentUser.uid}`);
  } else {
    // Guest fallback
    headers.set('Authorization', `Bearer guest-session-${Date.now()}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
