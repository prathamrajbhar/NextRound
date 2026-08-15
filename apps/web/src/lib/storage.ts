const NAMESPACE_PREFIX = 'hireos:u:';

const LEGACY_PREFIXES = [
  'candidate_',
  'hr_',
  'candidateInterview_',
  'assessmentResult_',
  'candidateAssessmentCompleted_',
  'hrRoundResult_',
];

function isLegacyKey(key: string): boolean {
  if (key === 'theme') return false;
  return LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function userStorageKey(userId: string, key: string): string {
  return `${NAMESPACE_PREFIX}${userId}:${key}`;
}

export function getScopedStorage(userId: string | null | undefined, key: string): string | null {
  if (!userId) return localStorage.getItem(key);
  return localStorage.getItem(userStorageKey(userId, key));
}

export function setScopedStorage(userId: string | null | undefined, key: string, value: string): void {
  if (!userId) {
    localStorage.setItem(key, value);
    return;
  }
  localStorage.setItem(userStorageKey(userId, key), value);
}

export function removeScopedStorage(userId: string | null | undefined, key: string): void {
  if (!userId) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.removeItem(userStorageKey(userId, key));
}

export function getScopedStorageJSON<T>(userId: string | null | undefined, key: string): T | null {
  const raw = getScopedStorage(userId, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setScopedStorageJSON(userId: string | null | undefined, key: string, value: unknown): void {
  setScopedStorage(userId, key, JSON.stringify(value));
}

export function removeUserStorage(userId: string): void {
  const prefix = `${NAMESPACE_PREFIX}${userId}:`;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
}

export function purgeLegacyState(): void {
  for (const key of Object.keys(localStorage)) {
    if (isLegacyKey(key)) {
      localStorage.removeItem(key);
    }
  }
}

export function purgeUserState(userId: string): void {
  removeUserStorage(userId);
  purgeLegacyState();
}