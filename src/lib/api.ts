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
  } else {
    // When logged out or guest, remove Authorization header to ensure protected endpoints reject with 401
    headers.delete('Authorization');
    const guestUid = auth.currentUser?.uid || `guest_${Date.now().toString(36)}`;
    headers.set('x-guest-uid', guestUid);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
