import { createRoot } from "react-dom/client";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { HelmetProvider } from "react-helmet-async";
import { MaterialYouProvider } from "./providers/MaterialYouProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { idbPersister } from "./lib/queryPersister";
import App from "./App.tsx";
import "./index.css";

const MS_24H = 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: MS_24H,
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) return false;
        }
        return failureCount < 3;
      },
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const persistOptions = {
  persister: idbPersister,
  maxAge: MS_24H,
  buster: "v1",
};

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HelmetProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
        <MaterialYouProvider>
          <App />
        </MaterialYouProvider>
      </PersistQueryClientProvider>
    </HelmetProvider>
  </ErrorBoundary>
);
