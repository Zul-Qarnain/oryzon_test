import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Chat, ChatWithIncludes } from "@/backend/services/chats/chats.types";
import type { ChatFilterOptions as ChatFilter } from "@/backend/services/chats/chats.types";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface ChatContextType {
  chat: ChatWithIncludes | null;
  chats: ChatWithIncludes[];
  total_chat: number;
  chat_loading: boolean;
  error_chat: string | null;
  fetchChat: (chatId: string, options?: { include?: string }) => Promise<void>;
  fetchChats: (options?: { filter?: ChatFilter; pagination?: PaginationOptions; include?: string }) => Promise<void>;
  createChat: (data: Partial<Chat>) => Promise<ChatWithIncludes | null>;
  updateChat: (chatId: string, data: Partial<Chat>) => Promise<ChatWithIncludes | null>;
  deleteChat: (chatId: string) => Promise<boolean>;
  cleanError_Chat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chat, setChat] = useState<ChatWithIncludes | null>(null);
  const [chats, setChats] = useState<ChatWithIncludes[]>([]);
  const [total_chat, setTotalChat] = useState(0);
  const [chat_loading, setChatLoading] = useState(false);
  const [error_chat, setErrorChat] = useState<string | null>(null);

  const fetchChat = useCallback(async (chatId: string, options?: { include?: string }) => {
    setChatLoading(true);
    setErrorChat(null);
    try {
      const url = `/api/chats/${chatId}` + (options?.include ? `?include=${options.include}` : "");
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch chat");
      }
      const data: ChatWithIncludes = await res.json();
      setChat(data);
    } catch (err) {
      setErrorChat(err instanceof Error ? err.message : String(err));
      setChat(null);
    } finally {
      setChatLoading(false);
    }
  }, []);

  const fetchChats = useCallback(
    async (options?: { filter?: ChatFilter; pagination?: PaginationOptions; include?: string }) => {
      setChatLoading(true);
      setErrorChat(null);
      try {
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

        const url = `/api/chats${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch chats");
        }
        const data: { data: ChatWithIncludes[]; total: number } = await res.json();
        setChats(data.data || []);
        setTotalChat(data.total || 0);
      } catch (err) {
        setErrorChat(err instanceof Error ? err.message : String(err));
        setChats([]);
        setTotalChat(0);
      } finally {
        setChatLoading(false);
      }
    },
    []
  );

  const createChat = useCallback(async (data: Partial<Chat>) => {
    setChatLoading(true);
    setErrorChat(null);
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to create chat");
      }
      const chat: ChatWithIncludes = await res.json();
      setChat(chat);
      return chat;
    } catch (err) {
      setErrorChat(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setChatLoading(false);
    }
  }, []);

  const updateChat = useCallback(async (chatId: string, data: Partial<Chat>) => {
    setChatLoading(true);
    setErrorChat(null);
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to update chat");
      }
      const updated: ChatWithIncludes = await res.json();
      setChat(updated);
      return updated;
    } catch (err) {
      setErrorChat(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setChatLoading(false);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    setChatLoading(true);
    setErrorChat(null);
    try {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to delete chat");
      }
      setChat(null);
      return true;
    } catch (err) {
      setErrorChat(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setChatLoading(false);
    }
  }, []);

  const cleanError_Chat = useCallback(() => setErrorChat(null), []);

  return (
    <ChatContext.Provider
      value={{
        chat,
        chats,
        total_chat,
        chat_loading,
        error_chat,
        fetchChat,
        fetchChats,
        createChat,
        updateChat,
        deleteChat,
        cleanError_Chat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within a ChatProvider");
  return ctx;
}
