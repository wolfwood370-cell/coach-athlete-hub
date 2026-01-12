/**
 * Offline-first storage utilities for PWA
 * Uses IndexedDB via a simple wrapper for better performance than localStorage
 */

const DB_NAME = 'coaching_pwa_offline';
const DB_VERSION = 1;

interface StoredItem<T> {
  key: string;
  value: T;
  timestamp: number;
  expiresAt?: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores for different data types
        if (!db.objectStoreNames.contains('workout_logs')) {
          const workoutStore = db.createObjectStore('workout_logs', { keyPath: 'key' });
          workoutStore.createIndex('timestamp', 'timestamp', { unique: false });
          workoutStore.createIndex('sync_status', 'value.sync_status', { unique: false });
        }

        if (!db.objectStoreNames.contains('daily_metrics')) {
          const metricsStore = db.createObjectStore('daily_metrics', { keyPath: 'key' });
          metricsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  async set<T>(storeName: string, key: string, value: T, ttlMs?: number): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      const item: StoredItem<T> = {
        key,
        value,
        timestamp: Date.now(),
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
      };

      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const item = request.result as StoredItem<T> | undefined;
        
        if (!item) {
          resolve(null);
          return;
        }

        // Check expiration
        if (item.expiresAt && item.expiresAt < Date.now()) {
          this.delete(storeName, key).catch(console.error);
          resolve(null);
          return;
        }

        resolve(item.value);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as StoredItem<T>[];
        const now = Date.now();
        
        // Filter out expired items and return values
        const validItems = items
          .filter(item => !item.expiresAt || item.expiresAt > now)
          .map(item => item.value);
        
        resolve(validItems);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async cleanExpired(storeName: string): Promise<number> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const all = await this.getAll<any>(storeName);
    const transaction = this.db!.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const items = request.result as StoredItem<any>[];
        const now = Date.now();
        let deletedCount = 0;

        for (const item of items) {
          if (item.expiresAt && item.expiresAt < now) {
            await this.delete(storeName, item.key);
            deletedCount++;
          }
        }

        resolve(deletedCount);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();

// Convenience functions for specific data types
export const workoutLogsStorage = {
  save: (key: string, data: any) => offlineStorage.set('workout_logs', key, data),
  get: (key: string) => offlineStorage.get('workout_logs', key),
  getAll: () => offlineStorage.getAll('workout_logs'),
  delete: (key: string) => offlineStorage.delete('workout_logs', key),
  clear: () => offlineStorage.clear('workout_logs'),
};

export const dailyMetricsStorage = {
  save: (key: string, data: any) => offlineStorage.set('daily_metrics', key, data),
  get: (key: string) => offlineStorage.get('daily_metrics', key),
  getAll: () => offlineStorage.getAll('daily_metrics'),
  delete: (key: string) => offlineStorage.delete('daily_metrics', key),
  clear: () => offlineStorage.clear('daily_metrics'),
};

export const cacheStorage = {
  save: (key: string, data: any, ttlMs = 5 * 60 * 1000) => 
    offlineStorage.set('cache', key, data, ttlMs),
  get: (key: string) => offlineStorage.get('cache', key),
  delete: (key: string) => offlineStorage.delete('cache', key),
  clear: () => offlineStorage.clear('cache'),
  cleanExpired: () => offlineStorage.cleanExpired('cache'),
};
