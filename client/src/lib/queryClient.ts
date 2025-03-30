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

  // Add JWT token to headers if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    credentials: 'include', // Added to include cookies in requests
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear token on auth error
      localStorage.removeItem('auth_token');
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
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(queryKey[0] as string, { 
      headers,
      credentials: 'include', // Include cookies for session authentication
    });

    if (!res.ok) {
      if (res.status === 401) {
        localStorage.removeItem('auth_token');
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
      staleTime: 0,
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