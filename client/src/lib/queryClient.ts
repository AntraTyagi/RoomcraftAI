import { QueryClient } from "@tanstack/react-query";

type GetQueryFnOptions = {
  on401?: "throw" | "returnNull";
};

export async function apiRequest(
  method: string,
  url: string,
  body?: any
): Promise<Response> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response;
}

export function getQueryFn(options: GetQueryFnOptions = {}) {
  return async ({ queryKey }: { queryKey: string[] }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 401 && options.on401 === "returnNull") {
        return null;
      }
      throw new Error(await res.text());
    }

    return res.json();
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn(), // Use the newly defined getQueryFn
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});