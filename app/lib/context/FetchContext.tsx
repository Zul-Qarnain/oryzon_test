"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface ApiResponse<T> {
  result: T | null;
  statusCode: number;
  error: string | null;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface FetchContextType {
  firebaseToken: string | null;
  setFirebaseToken: (token: string | null) => void;
  request: <T>(
    method: HttpMethod,
    url: string,
    body?: unknown,
    additionalHeaders?: Record<string, string>
  ) => Promise<ApiResponse<T>>;
  loading: boolean;
}

const FetchContext = createContext<FetchContextType | undefined>(undefined);

export const FetchProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback<FetchContextType['request']>(
    async <T,>(
      method: HttpMethod,
      url: string, // Match interface
      body?: unknown, // Match interface
      additionalHeaders?: Record<string, string>
    ): Promise<ApiResponse<T>> => {
      setLoading(true);
      const headers: Record<string, string> = {
        ...additionalHeaders,
      };

      if (body && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
      }

      if (firebaseToken) {
        headers["Authorization"] = `Bearer ${firebaseToken}`;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const fullUrl = url.startsWith("http") ? url : `${apiUrl}${url.startsWith("/") ? url : `/${url}`}`;

      try {
        const res = await fetch(fullUrl, {
          method: method,
          headers: headers,
          body: (body && !(body instanceof FormData) ? JSON.stringify(body) : body) as BodyInit | null | undefined,
        });

        const statusCode = res.status;

        if (!res.ok) {
          let errorData: { message?: string } = {};
          try {
            errorData = await res.json();
          } catch (e) {
            errorData.message = res.statusText || `Request failed with status ${statusCode}`;
          }
          const errorMessage = typeof errorData.message === "string" ? errorData.message : `Failed with status: ${statusCode}`;
          setLoading(false);
          return { result: null, statusCode, error: errorMessage };
        }

        if (statusCode === 204) {
          setLoading(false);
          return { result: null, statusCode, error: null };
        }
        
        const result = await res.json() as T; // Explicitly cast to T
        setLoading(false);
        return { result, statusCode, error: null };

      } catch (err) {
        setLoading(false);
        const errorMessage = err instanceof Error ? err.message : "An unknown network error occurred";
        return { result: null, statusCode: 0, error: errorMessage };
      }
    },
    [firebaseToken]
  );

  return (
    <FetchContext.Provider value={{ firebaseToken, setFirebaseToken, request, loading }}>
      {children}
    </FetchContext.Provider>
  );
};

export function useFetchContext() {
  const context = useContext(FetchContext);
  if (context === undefined) {
    throw new Error("useFetchContext must be used within a FetchProvider");
  }
  return context;
}
