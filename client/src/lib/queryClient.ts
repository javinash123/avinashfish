import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    
    // Try to parse JSON error response
    try {
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || text);
    } catch {
      // If not JSON, throw the raw text
      throw new Error(text);
    }
  }
}

// 👇 Set BASE_PATH based on VITE_BASE_PATH or fallback to empty string
const BASE_PATH = import.meta.env.VITE_BASE_PATH?.replace(/\/$/, '') || '';

/**
 * Unified API request method with correct base path prepended.
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  // 👇 Always prefix with BASE_PATH
  const fullUrl = url.startsWith("/") ? `${BASE_PATH}${url}` : `${BASE_PATH}/${url}`;

  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // includes cookies (for session auth)
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const fullUrl = url.startsWith("/")
      ? `${BASE_PATH}${url}`
      : `${BASE_PATH}/${url}`;

    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 0,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
