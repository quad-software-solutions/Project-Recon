const SESSION_KEY_STORAGE = 'ethio_robotics_store_session';

export function getSessionKey(): string {
  let sessionKey = localStorage.getItem(SESSION_KEY_STORAGE);
  if (!sessionKey) {
    sessionKey = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
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
