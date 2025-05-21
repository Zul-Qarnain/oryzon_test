"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ConnectedChannel, ConnectedChannelWithIncludes, CreateChannelData } from "@/backend/services/channels/channels.types";
import type { ChannelFilterOptions as ChannelFilter } from "@/backend/services/channels/channels.types";
import { useFetchContext, ApiResponse } from "./FetchContext";
import { useUserContext } from "./UserContext"; // Import useUserContext

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface ChannelContextType {
  channel: ConnectedChannelWithIncludes | null;
  channels: ConnectedChannelWithIncludes[];
  total_channel: number;
  channel_loading: boolean;
  error_channel: string | null;
  fetchChannel: (channelId: string, options?: { include?: string }) => Promise<ApiResponse<ConnectedChannelWithIncludes>>;
  fetchChannels: (options?: { filter?: ChannelFilter; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<{ data: ConnectedChannelWithIncludes[]; total: number }>>;
  createChannel: (data: Omit<CreateChannelData, 'providerUserId'>) => Promise<ApiResponse<ConnectedChannelWithIncludes>>;
  updateChannel: (channelId: string, data: Partial<ConnectedChannel>) => Promise<ApiResponse<ConnectedChannelWithIncludes>>;
  deleteChannel: (channelId: string) => Promise<ApiResponse<null>>;
  cleanError_Channel: () => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const { request } = useFetchContext();
  const { FUser } = useUserContext(); // Get FUser from UserContext
  const [channel, setChannel] = useState<ConnectedChannelWithIncludes | null>(null);
  const [channels, setChannels] = useState<ConnectedChannelWithIncludes[]>([]);
  const [total_channel, setTotalChannel] = useState(0);
  const [channel_loading, setChannelLoading] = useState(false);
  const [error_channel, setErrorChannel] = useState<string | null>(null);

  const fetchChannel = useCallback(async (channelId: string, options?: { include?: string }): Promise<ApiResponse<ConnectedChannelWithIncludes>> => {
    setChannelLoading(true);
    setErrorChannel(null);
    const url = `/api/channels/${channelId}` + (options?.include ? `?include=${options.include}` : "");
    const response = await request<ConnectedChannelWithIncludes>("GET", url);

    if (response.error) {
      setErrorChannel(response.error);
      setChannel(null);
    } else {
      setChannel(response.result);
    }
    setChannelLoading(false);
    return response;
  }, [request]);

  const fetchChannels = useCallback(
    async (options?: { filter?: ChannelFilter; pagination?: PaginationOptions; include?: string }): Promise<ApiResponse<{ data: ConnectedChannelWithIncludes[]; total: number }>> => {
      setChannelLoading(true);
      setErrorChannel(null);
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

      const url = `/api/channels${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await request<{ data: ConnectedChannelWithIncludes[]; total: number }>("GET", url);

      if (response.error) {
        setErrorChannel(response.error);
        setChannels([]);
        setTotalChannel(0);
      } else if (response.result) {
        setChannels(response.result.data || []);
        setTotalChannel(response.result.total || 0);
      }
      setChannelLoading(false);
      return response;
    },
    [request]
  );

  const createChannel = useCallback(
    async (data: Omit<CreateChannelData, 'providerUserId'>): Promise<ApiResponse<ConnectedChannelWithIncludes>> => {
      setChannelLoading(true);
      setErrorChannel(null);

      if (!FUser || !FUser.uid) {
        const errorMsg = "User is not logged in or provider information is missing.";
        setErrorChannel(errorMsg);
        setChannelLoading(false);
        return { error: errorMsg, result: null, statusCode: 401 };
      }

      const completeChannelData: CreateChannelData = {
        ...data,
        providerUserId: FUser.uid,
      };

      const response = await request<ConnectedChannelWithIncludes>("POST", "/api/channels", completeChannelData);

      if (response.error) {
        setErrorChannel(response.error);
      } else {
        setChannel(response.result);
        if (response.result) {
          setChannels(prevChannels => [response.result!, ...prevChannels.filter(ch => ch.channelId !== response.result!.channelId)]);
          setTotalChannel(prevTotal => prevTotal + 1); // Consider if total should be refetched or accurately managed
        }
      }
      setChannelLoading(false);
      return response;
    },
    [request, FUser]
  );

  const updateChannel = useCallback(async (channelId: string, data: Partial<ConnectedChannel>): Promise<ApiResponse<ConnectedChannelWithIncludes>> => {
    setChannelLoading(true);
    setErrorChannel(null);
    const response = await request<ConnectedChannelWithIncludes>("PUT", `/api/channels/${channelId}`, data);

    if (response.error) {
      setErrorChannel(response.error);
    } else {
      setChannel(response.result); // Optionally update current channel or refetch list
    }
    setChannelLoading(false);
    return response;
  }, [request]);

  const deleteChannel = useCallback(async (channelId: string): Promise<ApiResponse<null>> => {
    setChannelLoading(true);
    setErrorChannel(null);
    const response = await request<null>("DELETE", `/api/channels/${channelId}`);

    if (response.error) {
      setErrorChannel(response.error);
    } else {
      setChannel(null); // Clear current channel if it was deleted
      // Optionally refetch channels list
    }
    setChannelLoading(false);
    return response;
  }, [request]);

  const cleanError_Channel = useCallback(() => setErrorChannel(null), []);

  return (
    <ChannelContext.Provider
      value={{
        channel,
        channels,
        total_channel,
        channel_loading,
        error_channel,
        fetchChannel,
        fetchChannels,
        createChannel,
        updateChannel,
        deleteChannel,
        cleanError_Channel,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
};

export function useChannelContext() {
  const ctx = useContext(ChannelContext);
  if (!ctx) throw new Error("useChannelContext must be used within a ChannelProvider");
  return ctx;
}
