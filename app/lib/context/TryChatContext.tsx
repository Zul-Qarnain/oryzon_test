"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { useFetchContext, ApiResponse } from "./FetchContext";
import { useChannelContext } from "./ChannelContext";
import { useChatContext } from "./ChatContext";
import { ChatWithIncludes } from "@/backend/services/chats/chats.types";
import { useBusinessContext } from "./BusinessContext";

interface TestMessagePayload {
  recipient: {
    id: string;
  };
  sender: {
    id: string;
  };
  content: {
    text?: string | null;
    image?: string | null;
  };
}

interface TestMessageResponse {
    image: string | null;
    msg: string;
}

export interface TryChatContextType {
  testChats: ChatWithIncludes[];
  loading: boolean;
  error: string | null;
  sendTestMessage: (content: { text?: string; image?: string }) => Promise<ApiResponse<TestMessageResponse>>;
  refreshTestChats: () => void;
  newChat: () => Promise<void>;
}

const TryChatContext = createContext<TryChatContextType | undefined>(undefined);

const SENDER_ID_KEY = 'try-chat-sender-id';

export const TryChatProvider = ({ children }: { children: ReactNode }) => {
  const { request } = useFetchContext();
  const {  fetchChannels, channels } = useChannelContext();
  const { fetchChats, chats } = useChatContext();
  const { business } = useBusinessContext();
  
  
  const [testChats, setTestChats] = useState<ChatWithIncludes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [senderId, setSenderId] = useState<string | null>(null);

  useEffect(() => {
    let storedSenderId = localStorage.getItem(SENDER_ID_KEY);
    if (!storedSenderId) {
      storedSenderId = uuidv4();
      localStorage.setItem(SENDER_ID_KEY, storedSenderId);
    }
    setSenderId(storedSenderId);
  }, []);

  const refreshTestChats = useCallback(async () => {
    if (!business) return;
    setLoading(true);
    setError(null);
    await fetchChats({
      filter: { businessId: business.businessId, chatType: "test" },
      include: "messages",
    });
    setLoading(false);
  }, [business, fetchChats]);

  useEffect(() => {
    const filteredTestChats = chats.filter(chat => chat.chatType === 'test' && chat.businessId === business?.businessId);
    setTestChats(filteredTestChats);
  }, [chats, business]);

  useEffect(() => {
    if (business) {
      refreshTestChats();
    }
  }, [business, refreshTestChats]);

  const sendTestMessage = useCallback(async (content: { text?: string; image?: string }): Promise<ApiResponse<TestMessageResponse>> => {
    alert(JSON.stringify(channels[0]))
    if (!channels[0] || !channels[0].platformSpecificId) {
      const errorMsg = "Channel or Channel Platform ID not available.";
      setError(errorMsg);
      return { error: errorMsg, result: null, statusCode: 400 };
    }
    if (!senderId) {
        const errorMsg = "Sender ID not available.";
        setError(errorMsg);
        return { error: errorMsg, result: null, statusCode: 400 };
    }

    setLoading(true);
    setError(null);

    const payload: TestMessagePayload = {
      recipient: {
        id: channels[0].platformSpecificId,
      },
      sender: {
        id: senderId,
      },
      content: {
        text: content.text || null,
        image: content.image || null,
      },
    };

    const response = await request<TestMessageResponse>("POST", "/api/webhooks/try", payload);

    if (response.error) {
      setError(response.error);
    } else {
      await refreshTestChats();
    }

    setLoading(false);
    return response;
  }, [request, channels, senderId, refreshTestChats]);

  const newChat = useCallback(async () => {
    if (!business) {
        setError("Business not loaded");
        return;
    }
    setLoading(true);
    const channelsResponse = await fetchChannels({ filter: { businessId: business.businessId } });
    if (channelsResponse.error || !channelsResponse.result || channelsResponse.result.data.length === 0) {
        setError("No channels found for this business.");
        setLoading(false);
        return;
    }
    const firstChannel = channelsResponse.result.data[0];

    if (!firstChannel.platformSpecificId) {
        setError("First channel does not have a platform specific ID.");
        setLoading(false);
        return;
    }

    await sendTestMessage({ text: "hi" });
    setLoading(false);
  }, [business, fetchChannels, sendTestMessage]);

  return (
    <TryChatContext.Provider
      value={{
        testChats,
        loading,
        error,
        sendTestMessage,
        refreshTestChats,
        newChat,
      }}
    >
      {children}
    </TryChatContext.Provider>
  );
};

export function useTryChatContext() {
  const ctx = useContext(TryChatContext);
  if (!ctx) {
    throw new Error("useTryChatContext must be used within a TryChatProvider");
  }
  return ctx;
}
