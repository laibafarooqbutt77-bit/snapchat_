const DB_NAME = 'lumo_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media';

interface StoredMedia {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export async function saveMediaBlob(id: string, blob: Blob): Promise<string> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: StoredMedia = {
      id,
      blob,
      mimeType: blob.type || 'application/octet-stream',
      createdAt: Date.now(),
    };
    const req = store.put(record);
    req.onsuccess = () => resolve(id);
    req.onerror = () => reject(req.error || new Error('Failed to store media'));
  });
}

export async function getMediaBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const result = req.result as StoredMedia | undefined;
        resolve(result ? result.blob : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

const urlCache = new Map<string, string>();

export async function getMediaObjectUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) {
    return urlCache.get(id)!;
  }
  const blob = await getMediaBlob(id);
  if (!blob) return null;
  const objectUrl = URL.createObjectURL(blob);
  urlCache.set(id, objectUrl);
  return objectUrl;
}

export async function deleteMediaBlob(id: string): Promise<void> {
  try {
    if (urlCache.has(id)) {
      URL.revokeObjectURL(urlCache.get(id)!);
      urlCache.delete(id);
    }
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore cleanup errors
  }
}

export async function clearAllMedia(): Promise<void> {
  try {
    urlCache.forEach((url) => URL.revokeObjectURL(url));
    urlCache.clear();
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore cleanup errors
  }
}
