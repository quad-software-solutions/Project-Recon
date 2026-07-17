const SESSION_KEY_STORAGE = 'ethio_robotics_store_session';

export function getSessionKey(): string {
  let sessionKey = localStorage.getItem(SESSION_KEY_STORAGE);
  if (!sessionKey) {
    sessionKey = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY_STORAGE, sessionKey);
  }
  return sessionKey;
}

export function getStoreRequestHeaders(): Record<string, string> {
  const sessionKey = getSessionKey();
  return {
    'X-Session-Key': sessionKey
  };
}
