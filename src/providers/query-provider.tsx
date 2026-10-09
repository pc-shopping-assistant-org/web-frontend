"use client";

import {ApiClientError} from "@/lib/api/envelope";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useState, type ReactNode} from "react";

export function QueryProvider({children}: {children: ReactNode}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // A 4xx answer will not change on a retry (not found, validation, forbidden)
            retry: (failureCount, error) => failureCount < 1 && !(error instanceof ApiClientError && error.status < 500),
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
