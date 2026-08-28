import { DocumentItem } from '../types';

const DB_NAME = 'HTMLLiveEditorDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const ACTIVE_DOC_KEY = 'html_editor_active_doc_id';
const THEME_KEY = 'html_editor_theme';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('title', 'title', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function calculateStats(html: string): { wordCount: number; charCount: number; fileSize: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const text = doc.body.textContent || '';
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  
  return {
    wordCount: words.length,
    charCount: text.length,
    fileSize: new Blob([html]).size
  };
}

export async function saveDocument(doc: DocumentItem): Promise<void> {
  const stats = calculateStats(doc.content);
  const updatedDoc: DocumentItem = {
    ...doc,
    updatedAt: Date.now(),
    wordCount: stats.wordCount,
    charCount: stats.charCount,
    fileSize: stats.fileSize,
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(updatedDoc);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB write failed, falling back to localStorage', err);
    try {
      localStorage.setItem(`doc_${doc.id}`, JSON.stringify(updatedDoc));
      const list = getLocalDocList();
      if (!list.includes(doc.id)) {
        list.unshift(doc.id);
        localStorage.setItem('doc_index', JSON.stringify(list));
      }
    } catch (e) {
      console.error('LocalStorage write failed:', e);
    }
  }
}

export async function getDocument(id: string): Promise<DocumentItem | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem(`doc_${id}`);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function getAllDocuments(): Promise<DocumentItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as DocumentItem[];
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const list = getLocalDocList();
    const docs: DocumentItem[] = [];
    for (const id of list) {
      const raw = localStorage.getItem(`doc_${id}`);
      if (raw) {
        try {
          docs.push(JSON.parse(raw));
        } catch {
          // ignore corrupted entry
        }
      }
    }
    docs.sort((a, b) => b.updatedAt - a.updatedAt);
    return docs;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    localStorage.removeItem(`doc_${id}`);
    const list = getLocalDocList().filter(item => item !== id);
    localStorage.setItem('doc_index', JSON.stringify(list));
  }
}

export async function clearAllDocuments(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const list = getLocalDocList();
    for (const id of list) {
      localStorage.removeItem(`doc_${id}`);
    }
    localStorage.removeItem('doc_index');
  }
  localStorage.removeItem(ACTIVE_DOC_KEY);
}

export function getActiveDocId(): string | null {
  return localStorage.getItem(ACTIVE_DOC_KEY);
}

export function setActiveDocId(id: string): void {
  localStorage.setItem(ACTIVE_DOC_KEY, id);
}

export function getStoredTheme(): 'light' | 'dark' {
  return (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light';
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(THEME_KEY, theme);
}

function getLocalDocList(): string[] {
  try {
    const raw = localStorage.getItem('doc_index');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
