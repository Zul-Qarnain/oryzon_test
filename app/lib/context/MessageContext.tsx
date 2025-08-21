"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Message, MessageWithIncludes } from "@/backend/services/messages/messages.types";
import type { MessageFilterOptions as MessageFilter } from "@/backend/services/messages/messages.types";
import { useFetchContext, ApiResponse } from "./FetchContext";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface MessageContextType {
  message: MessageWithIncludes | null;
  messages: MessageWithIncludes[];
  total_message: number;
  message_loading: boolean;
  error_message: string | null;
  fetchMessage: (messageId: string, options?: { include?: string }) => Promise<ApiResponse<MessageWithIncludes>>;
  fetchMessages: (options?: { filter?: MessageFilter; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<{ data: MessageWithIncludes[]; total: number }>>;
  createMessage: (data: Partial<Message>) => Promise<ApiResponse<MessageWithIncludes>>;
  updateMessage: (messageId: string, data: Partial<Message>) => Promise<ApiResponse<MessageWithIncludes>>;
  deleteMessage: (messageId: string) => Promise<ApiResponse<null>>;
  cleanError_Message: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider = ({
  children,
  message: initialMessage = null
}: {
  children: ReactNode;
  message?: MessageWithIncludes | null;
}) => {
  const { request } = useFetchContext();
  const [message, setMessage] = useState<MessageWithIncludes | null>(initialMessage);
  const [messages, setMessages] = useState<MessageWithIncludes[]>([]);
  const [total_message, setTotalMessage] = useState(0);
  const [message_loading, setMessageLoading] = useState(false);
  const [error_message, setErrorMessage] = useState<string | null>(null);

  const fetchMessage = useCallback(async (messageId: string, options?: { include?: string }): Promise<ApiResponse<MessageWithIncludes>> => {
    setMessageLoading(true);
    setErrorMessage(null);
    const url = `/api/messages/${messageId}` + (options?.include ? `?include=${options.include}` : "");
    const response = await request<MessageWithIncludes>("GET", url);

    if (response.error) {
      setErrorMessage(response.error);
      setMessage(null);
    } else {
      setMessage(response.result);
    }
    setMessageLoading(false);
    return response;
  }, [request]);

  const fetchMessages = useCallback(
    async (options?: { filter?: MessageFilter; pagination?: PaginationOptions; include?: string }): Promise<ApiResponse<{ data: MessageWithIncludes[]; total: number }>> => {
      setMessageLoading(true);
      setErrorMessage(null);
      const params = new URLSearchParams();
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) params.append(key, String(value));
        });
      }
      if (options?.pagination) {
        if (options.pagination.limit !== undefined) params.append("limit", String(options.pagination.limit));
        if (options.pagination.offset !== undefined) params.append("offset", String(options.pagination.offset));
      }
      if (options?.include) params.append("include", options.include);

      const url = `/api/messages${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await request<{ data: MessageWithIncludes[]; total: number }>("GET", url);

      if (response.error) {
        setErrorMessage(response.error);
        setMessages([]);
        setTotalMessage(0);
      } else if (response.result) {
        setMessages(response.result.data || []);
        setTotalMessage(response.result.total || 0);
      }
      setMessageLoading(false);
      return response;
    },
    [request]
  );

  const createMessage = useCallback(async (data: Partial<Message>): Promise<ApiResponse<MessageWithIncludes>> => {
    setMessageLoading(true);
    setErrorMessage(null);
    const response = await request<MessageWithIncludes>("POST", "/api/messages", data);

    if (response.error) {
      setErrorMessage(response.error);
    } else {
      // Optionally, update local state, e.g., add to messages list or set as current message
      // For now, just returning the response.
    }
    setMessageLoading(false);
    return response;
  }, [request]);

  const updateMessage = useCallback(async (messageId: string, data: Partial<Message>): Promise<ApiResponse<MessageWithIncludes>> => {
    setMessageLoading(true);
    setErrorMessage(null);
    const response = await request<MessageWithIncludes>("PUT", `/api/messages/${messageId}`, data);

    if (response.error) {
      setErrorMessage(response.error);
    } else {
      // Optionally, update local state
    }
    setMessageLoading(false);
    return response;
  }, [request]);

  const deleteMessage = useCallback(async (messageId: string): Promise<ApiResponse<null>> => {
    setMessageLoading(true);
    setErrorMessage(null);
    const response = await request<null>("DELETE", `/api/messages/${messageId}`);

    if (response.error) {
      setErrorMessage(response.error);
    } else {
      // Optionally, update local state (e.g., remove from messages list)
      if (message?.messageId === messageId) {
        setMessage(null);
      }
    }
    setMessageLoading(false);
    return response;
  }, [request, message]);

  const cleanError_Message = useCallback(() => setErrorMessage(null), []);

  return (
    <MessageContext.Provider
      value={{
        message,
        messages,
        total_message,
        message_loading,
        error_message,
        fetchMessage,
        fetchMessages,
        createMessage,
        updateMessage,
        deleteMessage,
        cleanError_Message,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export function useMessageContext() {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessageContext must be used within a MessageProvider");
  return ctx;
}
