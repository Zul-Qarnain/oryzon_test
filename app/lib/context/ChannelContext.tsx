import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ConnectedChannel, ConnectedChannelWithIncludes } from "@/backend/services/channels/channels.types";
import type { ChannelFilterOptions as ChannelFilter } from "@/backend/services/channels/channels.types";

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
  fetchChannel: (channelId: string, options?: { include?: string }) => Promise<void>;
  fetchChannels: (options?: { filter?: ChannelFilter; pagination?: PaginationOptions; include?: string }) => Promise<void>;
  createChannel: (data: Partial<ConnectedChannel>) => Promise<ConnectedChannelWithIncludes | null>;
  updateChannel: (channelId: string, data: Partial<ConnectedChannel>) => Promise<ConnectedChannelWithIncludes | null>;
  deleteChannel: (channelId: string) => Promise<boolean>;
  cleanError_Channel: () => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

export const ChannelProvider = ({ children }: { children: ReactNode }) => {
  const [channel, setChannel] = useState<ConnectedChannelWithIncludes | null>(null);
  const [channels, setChannels] = useState<ConnectedChannelWithIncludes[]>([]);
  const [total_channel, setTotalChannel] = useState(0);
  const [channel_loading, setChannelLoading] = useState(false);
  const [error_channel, setErrorChannel] = useState<string | null>(null);

  const fetchChannel = useCallback(async (channelId: string, options?: { include?: string }) => {
    setChannelLoading(true);
    setErrorChannel(null);
    try {
      const url = `/api/channels/${channelId}` + (options?.include ? `?include=${options.include}` : "");
      const res = await fetch(url);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch channel");
      }
      const data: ConnectedChannelWithIncludes = await res.json();
      setChannel(data);
    } catch (err) {
      setErrorChannel(err instanceof Error ? err.message : String(err));
      setChannel(null);
    } finally {
      setChannelLoading(false);
    }
  }, []);

  const fetchChannels = useCallback(
    async (options?: { filter?: ChannelFilter; pagination?: PaginationOptions; include?: string }) => {
      setChannelLoading(true);
      setErrorChannel(null);
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

        const url = `/api/channels${params.toString() ? `?${params.toString()}` : ""}`;
        const res = await fetch(url);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(typeof errData.message === "string" ? errData.message : "Failed to fetch channels");
        }
        const data: { data: ConnectedChannelWithIncludes[]; total: number } = await res.json();
        setChannels(data.data || []);
        setTotalChannel(data.total || 0);
      } catch (err) {
        setErrorChannel(err instanceof Error ? err.message : String(err));
        setChannels([]);
        setTotalChannel(0);
      } finally {
        setChannelLoading(false);
      }
    },
    []
  );

  const createChannel = useCallback(async (data: Partial<ConnectedChannel>) => {
    setChannelLoading(true);
    setErrorChannel(null);
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to create channel");
      }
      const channel: ConnectedChannelWithIncludes = await res.json();
      setChannel(channel);
      return channel;
    } catch (err) {
      setErrorChannel(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setChannelLoading(false);
    }
  }, []);

  const updateChannel = useCallback(async (channelId: string, data: Partial<ConnectedChannel>) => {
    setChannelLoading(true);
    setErrorChannel(null);
    try {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to update channel");
      }
      const updated: ConnectedChannelWithIncludes = await res.json();
      setChannel(updated);
      return updated;
    } catch (err) {
      setErrorChannel(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setChannelLoading(false);
    }
  }, []);

  const deleteChannel = useCallback(async (channelId: string) => {
    setChannelLoading(true);
    setErrorChannel(null);
    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(typeof errData.message === "string" ? errData.message : "Failed to delete channel");
      }
      setChannel(null);
      return true;
    } catch (err) {
      setErrorChannel(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setChannelLoading(false);
    }
  }, []);

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
