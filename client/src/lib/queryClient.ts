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

  // Get token from localStorage
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.warn("No auth token found in localStorage");
  } else {
    console.log("Found auth token:", token.substring(0, 10) + "...");
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include' // Important: Include cookies for session persistence
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token and user data on auth error
      console.error("Authentication error, clearing token");
      localStorage.removeItem('auth_token');
      queryClient.setQueryData(["/api/user"], null);
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
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(queryKey[0] as string, { 
        headers,
        credentials: 'include' // Important: Include cookies for session persistence
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('auth_token');
          queryClient.setQueryData(["/api/user"], null);
          if (options.on401 === "returnNull") {
            return null;
          }
          throw new Error("Authentication required");
        }
        throw new Error(await res.text());
      }

      return res.json();
    } catch (error) {
      console.error("Query error:", error);
      throw error;
    }
  };
}

// Configure the QueryClient with proper defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(),
      staleTime: 0, // Consider all data stale immediately
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