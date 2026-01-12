import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface OfflineSyncContextValue {
  isOnline: boolean;
  pendingSyncCount: number;
  lastSyncTime: Date | null;
  registerPendingOperation: (key: string, operation: () => Promise<void>) => void;
  unregisterPendingOperation: (key: string) => void;
  forceSyncAll: () => Promise<void>;
}

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null);

interface PendingOperation {
  key: string;
  operation: () => Promise<void>;
  timestamp: number;
}

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingOperations, setPendingOperations] = useState<Map<string, PendingOperation>>(new Map());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const { toast } = useToast();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Sei online",
        description: "Sincronizzazione automatica in corso...",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Sei offline",
        description: "Le modifiche verranno salvate localmente.",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.size > 0) {
      forceSyncAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingOperations.size]);

  const registerPendingOperation = useCallback((key: string, operation: () => Promise<void>) => {
    setPendingOperations(prev => {
      const next = new Map(prev);
      next.set(key, {
        key,
        operation,
        timestamp: Date.now(),
      });
      return next;
    });
  }, []);

  const unregisterPendingOperation = useCallback((key: string) => {
    setPendingOperations(prev => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const forceSyncAll = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Impossibile sincronizzare",
        description: "Nessuna connessione disponibile.",
        variant: "destructive",
      });
      return;
    }

    const operations = Array.from(pendingOperations.values());
    let successCount = 0;
    let failCount = 0;

    for (const op of operations) {
      try {
        await op.operation();
        unregisterPendingOperation(op.key);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync operation ${op.key}:`, error);
        failCount++;
      }
    }

    if (successCount > 0 || failCount > 0) {
      setLastSyncTime(new Date());
      toast({
        title: "Sincronizzazione completata",
        description: failCount > 0 
          ? `${successCount} sincronizzati, ${failCount} falliti.`
          : `${successCount} operazioni sincronizzate.`,
        variant: failCount > 0 ? "destructive" : "default",
      });
    }
  }, [isOnline, pendingOperations, unregisterPendingOperation, toast]);

  const value: OfflineSyncContextValue = {
    isOnline,
    pendingSyncCount: pendingOperations.size,
    lastSyncTime,
    registerPendingOperation,
    unregisterPendingOperation,
    forceSyncAll,
  };

  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  );
}

export function useOfflineSyncContext() {
  const context = useContext(OfflineSyncContext);
  if (!context) {
    throw new Error('useOfflineSyncContext must be used within OfflineSyncProvider');
  }
  return context;
}

// Visual indicator component for sync status
export function SyncStatusIndicator() {
  const { isOnline, pendingSyncCount, forceSyncAll } = useOfflineSyncContext();

  if (isOnline && pendingSyncCount === 0) {
    return null;
  }

  return (
    <button
      onClick={() => forceSyncAll()}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg transition-all hover:scale-105"
      style={{
        backgroundColor: isOnline ? 'hsl(var(--primary))' : 'hsl(var(--destructive))',
        color: isOnline ? 'hsl(var(--primary-foreground))' : 'hsl(var(--destructive-foreground))',
      }}
    >
      {isOnline ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
          </span>
          {pendingSyncCount} da sincronizzare
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-current" />
          Offline ({pendingSyncCount} in attesa)
        </>
      )}
    </button>
  );
}
