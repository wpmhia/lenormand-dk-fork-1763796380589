import { SavedReading } from "@/lib/types/reading";

const DB_NAME = "LenormandReadings";
const STORE_NAME = "readings";
const MAX_READINGS = 30;

let db: IDBDatabase | null = null;

async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
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
  } catch (error) {
    console.error("Error adding reading to storage:", error);
    throw error;
  }
}

export async function getReadings(): Promise<SavedReading[]> {
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
  } catch (error) {
    console.error("Error reading from storage:", error);
    return [];
  }
}

export async function deleteReading(id: string): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Error deleting reading:", error);
    throw error;
  }
}

export async function clearAllReadings(): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
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
