// Offline persistence layer v1 — forces idb-keyval commit sync
import { get, set, del } from "idb-keyval";
import type { PersistedClient } from "@tanstack/react-query-persist-client";

const IDB_KEY = "rq-offline-cache";

/**
 * IDB-based persister for TanStack Query.
 * Stores the full dehydrated cache in IndexedDB for offline-first PWA support.
 */
export const idbPersister = {
  persistClient: async (client: PersistedClient) => {
    await set(IDB_KEY, client);
  },
  restoreClient: async (): Promise<PersistedClient | undefined> => {
    return await get<PersistedClient>(IDB_KEY);
  },
  removeClient: async () => {
    await del(IDB_KEY);
  },
};
