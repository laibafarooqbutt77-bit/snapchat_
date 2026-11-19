import { PersistedAppState } from '../types';

export const STORAGE_KEY = 'lumo_app_state_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadAppState(): PersistedAppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeParseJSON<PersistedAppState>(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.version !== CURRENT_SCHEMA_VERSION) return null;
    if (!parsed.users || !parsed.settings) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAppState(state: PersistedAppState): boolean {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (err) {
    console.warn('Failed to persist state to LocalStorage:', err);
    return false;
  }
}

export function clearAppState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}
