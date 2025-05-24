"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Chat, ChatWithIncludes, ChatFilterOptions, CreateChatData, UpdateChatData } from "@/backend/services/chats/chats.types"; // Added CreateChatData, UpdateChatData
import { useFetchContext, ApiResponse } from "./FetchContext";
import { useUserContext } from "./UserContext"; // Import useUserContext

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
  fetchChat: (chatId: string, options?: { include?: string }) => Promise<ApiResponse<ChatWithIncludes>>;
  fetchChats: (options?: { filter?: ChatFilterOptions; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<{ data: ChatWithIncludes[]; total: number }>>;
  createChat: (data: Omit<CreateChatData, 'providerUserId' | 'customerId'> & { businessId: string; platformCustomerId: string; channelId: string; }) => Promise<ApiResponse<ChatWithIncludes>>; // Updated createChat data type
  updateChat: (chatId: string, data: UpdateChatData) => Promise<ApiResponse<ChatWithIncludes>>; // Updated updateChat data type
  deleteChat: (chatId: string) => Promise<ApiResponse<null>>;
  cleanError_Chat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { request } = useFetchContext();
  const { FUser } = useUserContext(); // Get FUser from UserContext
  const [chat, setChat] = useState<ChatWithIncludes | null>(null);
  const [chats, setChats] = useState<ChatWithIncludes[]>([]);
  const [total_chat, setTotalChat] = useState(0);
  const [chat_loading, setChatLoading] = useState(false);
  const [error_chat, setErrorChat] = useState<string | null>(null);

  const fetchChat = useCallback(async (chatId: string, options?: { include?: string }): Promise<ApiResponse<ChatWithIncludes>> => {
    setChatLoading(true);
    setErrorChat(null);
    const url = `/api/chats/${chatId}` + (options?.include ? `?include=${options.include}` : "");
    const response = await request<ChatWithIncludes>("GET", url);
    
    if (response.error) {
      setErrorChat(response.error);
      setChat(null);
    } else {
      setChat(response.result);
    }
    setChatLoading(false);
    return response;
  }, [request]);

  const fetchChats = useCallback(
    async (options?: { filter?: ChatFilterOptions; pagination?: PaginationOptions; include?: string }): Promise<ApiResponse<{ data: ChatWithIncludes[]; total: number }>> => {
      setChatLoading(true);
      setErrorChat(null);
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
      const response = await request<{ data: ChatWithIncludes[]; total: number }>("GET", url);

      if (response.error) {
        setErrorChat(response.error);
        setChats([]);
        setTotalChat(0);
      } else if(response.result) {
        setChats(response.result.data || []);
        setTotalChat(response.result.total || 0);
      }
      setChatLoading(false);
      return response;
    },
    [request]
  );

  const createChat = useCallback(
    async (data: Omit<CreateChatData, 'providerUserId' | 'customerId'> & { businessId: string; platformCustomerId: string; channelId: string; }): Promise<ApiResponse<ChatWithIncludes>> => {
      setChatLoading(true);
      setErrorChat(null);

      if (!data.businessId || !data.platformCustomerId || !data.channelId) { // Changed from customerId
        const errorMsg = "businessId, platformCustomerId, and channelId are required."; // Changed from customerId
        setErrorChat(errorMsg);
        setChatLoading(false);
        return { error: errorMsg, result: null, statusCode: 400 };
      }
      
      const completeChatData: CreateChatData = {
        ...data,
        providerUserId: FUser?.uid || null, // Set providerUserId from FUser, or null if not available
      };

      const response = await request<ChatWithIncludes>("POST", "/api/chats", completeChatData);

      if (response.error) {
        setErrorChat(response.error);
      } else {
        setChat(response.result);
        if (response.result) {
          setChats(prevChats => [response.result!, ...prevChats.filter(c => c.chatId !== response.result!.chatId)]);
          setTotalChat(prevTotal => prevTotal + 1);
        }
      }
      setChatLoading(false);
      return response;
    },
    [request, FUser]
  );

  const updateChat = useCallback(async (chatId: string, data: UpdateChatData): Promise<ApiResponse<ChatWithIncludes>> => {
    setChatLoading(true);
    setErrorChat(null);
    const response = await request<ChatWithIncludes>("PUT", `/api/chats/${chatId}`, data);

    if (response.error) {
      setErrorChat(response.error);
    } else {
      setChat(response.result); // Optionally update current chat or refetch list
    }
    setChatLoading(false);
    return response;
  }, [request]);

  const deleteChat = useCallback(async (chatId: string): Promise<ApiResponse<null>> => {
    setChatLoading(true);
    setErrorChat(null);
    const response = await request<null>("DELETE", `/api/chats/${chatId}`);

    if (response.error) {
      setErrorChat(response.error);
    } else {
      setChat(null); // Clear current chat if it was deleted
      // Optionally refetch chats list
    }
    setChatLoading(false);
    return response;
  }, [request]);

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
