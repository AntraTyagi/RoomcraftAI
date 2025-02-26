import { QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@tanstack/react-query";

type GetQueryFnOptions = {
  on401?: "throw" | "returnNull";
};

export async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // Important: ensures cookies are sent with requests
  });

  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error("Authentication required");
      error.name = "AuthError";
      throw error;
    }
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  return response;
}

export function getQueryFn(options: GetQueryFnOptions = {}) {
  return async ({ queryKey }: { queryKey: QueryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include", // Important: ensures cookies are sent with requests
      headers: {
        "Content-Type": "application/json",
      }
    });

    if (!res.ok) {
      if (res.status === 401) {
        if (options.on401 === "returnNull") {
          return null;
        }
        throw new Error("Authentication required");
      }
      throw new Error(await res.text());
    }

    return res.json();
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      staleTime: 0, // Don't cache authentication data
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});