import { SavedReading } from "@/lib/types/reading";

const API_BASE = "/api/readings/history";
const DB_NAME = "LenormandReadings";
const STORE_NAME = "readings";
const LOCALSTORAGE_KEY = "lenormand_readings";
const MAX_READINGS = 30;

let db: IDBDatabase | null = null;
let useLocalStorage = false;
let serverSyncFailed = false;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;
  if (useLocalStorage) throw new Error("Using localStorage fallback");

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      useLocalStorage = true;
      reject(new Error("IndexedDB not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => {
      useLocalStorage = true;
      reject(request.error);
    };
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

export async function addReading(reading: SavedReading): Promise<void> {
  // Try server API first for persistent storage
  if (!serverSyncFailed) {
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reading),
      });
      if (response.ok) {
        return;
      }
      console.warn("Server sync failed, falling back to local storage");
    } catch (err) {
      console.warn("Server sync unavailable, using local storage:", err);
      serverSyncFailed = true;
    }
  }

  // Fallback to IndexedDB/localStorage
  try {
    // Try IndexedDB first
    try {
      const database = await initDB();
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.add(reading);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });

      // Clean up old readings if exceeding max
      await cleanupOldReadings(database);
      return;
    } catch (idbError) {
      console.warn("IndexedDB failed, falling back to localStorage:", idbError);
    }

    // Fallback to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      const readings = JSON.parse(
        window.localStorage.getItem(LOCALSTORAGE_KEY) || "[]"
      ) as SavedReading[];
      readings.push(reading);
      
      // Keep only max readings
      if (readings.length > MAX_READINGS) {
        readings.sort((a, b) => b.timestamp - a.timestamp);
        readings.splice(MAX_READINGS);
      }
      
      window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(readings));
    }
  } catch (error) {
    console.error("Error adding reading to storage:", error);
    throw error;
  }
}

export async function getReadings(): Promise<SavedReading[]> {
  // Try server API first for persistent storage
  if (!serverSyncFailed) {
    try {
      const response = await fetch(API_BASE);
      if (response.ok) {
        const data = await response.json();
        return data.readings || [];
      }
    } catch (err) {
      console.warn("Server sync unavailable, using local storage:", err);
    }
  }

  // Fallback to IndexedDB/localStorage
  try {
    // Try IndexedDB first
    try {
      const database = await initDB();
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const readings = request.result as SavedReading[];
          // Sort by timestamp (newest first)
          resolve(readings.sort((a, b) => b.timestamp - a.timestamp));
        };
      });
    } catch (idbError) {
      console.warn("IndexedDB failed, falling back to localStorage:", idbError);
    }

    // Fallback to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      const readings = JSON.parse(
        window.localStorage.getItem(LOCALSTORAGE_KEY) || "[]"
      ) as SavedReading[];
      return readings.sort((a, b) => b.timestamp - a.timestamp);
    }

    return [];
  } catch (error) {
    console.error("Error reading from storage:", error);
    return [];
  }
}

export async function deleteReading(id: string): Promise<void> {
  // Try server API first for persistent storage
  if (!serverSyncFailed) {
    try {
      const response = await fetch(`${API_BASE}?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (response.ok) {
        return;
      }
    } catch (err) {
      console.warn("Server sync unavailable, using local storage:", err);
    }
  }

  // Fallback to IndexedDB/localStorage
  try {
    // Try IndexedDB first
    try {
      const database = await initDB();
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (idbError) {
      console.warn("IndexedDB failed, falling back to localStorage:", idbError);
    }

    // Fallback to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      const readings = JSON.parse(
        window.localStorage.getItem(LOCALSTORAGE_KEY) || "[]"
      ) as SavedReading[];
      const filtered = readings.filter((r) => r.id !== id);
      window.localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (error) {
    console.error("Error deleting reading:", error);
    throw error;
  }
}

export async function clearAllReadings(): Promise<void> {
  // Try server API first for persistent storage
  if (!serverSyncFailed) {
    try {
      const response = await fetch(API_BASE, {
        method: "DELETE",
      });
      if (response.ok) {
        return;
      }
    } catch (err) {
      console.warn("Server sync unavailable, using local storage:", err);
    }
  }

  // Fallback to IndexedDB/localStorage
  try {
    // Try IndexedDB first
    try {
      const database = await initDB();
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (idbError) {
      console.warn("IndexedDB failed, falling back to localStorage:", idbError);
    }

    // Fallback to localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  } catch (error) {
    console.error("Error clearing readings:", error);
    throw error;
  }
}

async function cleanupOldReadings(database: IDBDatabase): Promise<void> {
  try {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const readings = request.result as SavedReading[];
        if (readings.length > MAX_READINGS) {
          // Sort by timestamp and delete oldest
          const sorted = readings.sort((a, b) => b.timestamp - a.timestamp);
          const toDelete = sorted.slice(MAX_READINGS);

          toDelete.forEach((reading) => {
            store.delete(reading.id);
          });
        }
        resolve();
      };
    });
  } catch (error) {
    console.error("Error cleaning up readings:", error);
  }
}
