"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ConnectedChannel, ConnectedChannelWithIncludes, CreateChannelData } from "@/backend/services/channels/channels.types";
import type { ChannelFilterOptions as ChannelFilter } from "@/backend/services/channels/channels.types";
import { BusinessWithRelations } from "@/backend/services/businesses/businesses.types";
import { useFetchContext, ApiResponse } from "./FetchContext";
import { useUserContext } from "./UserContext"; // Import useUserContext

// Facebook Page interface
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
}

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
  facebookPages: FacebookPage[];
  userAccessToken: string | null;
  fb_loading: boolean;
  fetchChannel: (channelId: string, options?: { include?: string }) => Promise<ApiResponse<ConnectedChannelWithIncludes>>;
  fetchChannels: (options?: { filter?: ChannelFilter; pagination?: PaginationOptions; include?: string }) => Promise<ApiResponse<{ data: ConnectedChannelWithIncludes[]; total: number }>>;
  createChannel: (data: Omit<CreateChannelData, 'providerUserId'> & { businessId: string }) => Promise<ApiResponse<ConnectedChannelWithIncludes>>; // Added businessId
  updateChannel: (channelId: string, data: Partial<ConnectedChannel>) => Promise<ApiResponse<ConnectedChannelWithIncludes>>;
  deleteChannel: (channelId: string) => Promise<ApiResponse<null>>;
  fetchPagesByFacebookLogIn: () => Promise<void>;
  createChannelFromFacebookPage: (page: FacebookPage, businessId: string, userAccessToken: string | null) => Promise<ApiResponse<ConnectedChannelWithIncludes>>;
  cleanError_Channel: () => void;
}

const ChannelContext = createContext<ChannelContextType | undefined>(undefined);

export const ChannelProvider = ({
  children,
  channel: initialChannel = null
}: {
  children: ReactNode;
  channel?: ConnectedChannelWithIncludes | null;
}) => {
  const { request } = useFetchContext();
  const { FUser } = useUserContext(); // Get FUser from UserContext
  const [channel, setChannel] = useState<ConnectedChannelWithIncludes | null>(initialChannel);
  const [channels, setChannels] = useState<ConnectedChannelWithIncludes[]>([]);
  const [total_channel, setTotalChannel] = useState(0);
  const [channel_loading, setChannelLoading] = useState(false);
  const [error_channel, setErrorChannel] = useState<string | null>(null);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [fb_loading, setFbLoading] = useState(false);
  const [userAccessToken, setUserAccessToken] = useState<string | null>(null);

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
    // Ensure data includes businessId, providerUserId is now optional in CreateChannelData
    async (data: Omit<CreateChannelData, 'providerUserId'> & { businessId: string }): Promise<ApiResponse<ConnectedChannelWithIncludes>> => {
      setChannelLoading(true);
      setErrorChannel(null);

      // FUser.uid will be used for the optional providerUserId field in CreateChannelData
      // businessId must be provided in the 'data' argument.
      if (!data.businessId) {
        const errorMsg = "Business ID is required to create a channel.";
        setErrorChannel(errorMsg);
        setChannelLoading(false);
        return { error: errorMsg, result: null, statusCode: 400 };
      }

      const completeChannelData: CreateChannelData = {
        ...data, // This includes businessId and other channel fields
        providerUserId: FUser?.uid || null, // Set providerUserId from FUser, or null if not available
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

  const fetchPagesByFacebookLogIn = useCallback(async (): Promise<void> => {
    setFbLoading(true);
    setErrorChannel(null);

    try {
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      if (!appId) {
        throw new Error('Facebook App ID not configured');
      }

      // Redirect to Facebook OAuth
      const redirectUri = encodeURIComponent(window.location.origin + '/auth/facebook/callback');
      const scope = encodeURIComponent('pages_show_list,pages_read_engagement,pages_manage_posts,pages_manage_metadata,pages_read_user_content,pages_manage_engagement,pages_messaging');

      const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${Date.now()}`;

      // Open popup window for Facebook login
      const popup = window.open(
        authUrl,
        'facebook-login',
        'width=600,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for popup messages
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'FACEBOOK_AUTH_SUCCESS' && event.data.code) {
          window.removeEventListener('message', handleMessage);
          popup.close();

          try {
            // Exchange code for access token using our backend
            const tokenResponse = await fetch('/api/auth/facebook/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code: event.data.code,
                redirectUri: window.location.origin + '/auth/facebook/callback'
              }),
            });

            if (!tokenResponse.ok) {
              throw new Error('Failed to exchange code for token');
            }

            const { access_token } = await tokenResponse.json();
            setUserAccessToken(access_token);

            // Set access token in local storage or state if needed
            localStorage.setItem('facebook_access_token', access_token);

            // Fetch user's Facebook pages
            setFbLoading(true);
            // Fetch user's pages using Facebook Graph API
            const pagesResponse = await fetch(
              `https://graph.facebook.com/v19.0/me/accounts?access_token=${access_token}&fields=id,name,access_token,category,tasks`

            );

            if (!pagesResponse.ok) {
              throw new Error('Failed to fetch Facebook pages');
            }

            const pagesData = await pagesResponse.json();

            if (pagesData.data) {
              const pages: FacebookPage[] = pagesData.data.map((page: {
                id: string;
                name: string;
                access_token: string;
                category?: string;
                tasks?: string[];
              }) => ({
                id: page.id,
                name: page.name,
                access_token: page.access_token,
                category: page.category,
                tasks: page.tasks
              }));
              setFacebookPages(pages);
            } else {
              setErrorChannel('No Facebook pages found');
            }

          } catch (error) {
            setErrorChannel(`Failed to fetch Facebook pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

          setFbLoading(false);
        } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          popup.close();
          setErrorChannel('Facebook login was cancelled or failed');
          setFbLoading(false);
        }
      };

      window.addEventListener('message', handleMessage);




    } catch (error) {
      setErrorChannel(`Failed to initialize Facebook login: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFbLoading(false);
    }
  }, []);

  const createChannelFromFacebookPage = useCallback(
    async (page: FacebookPage, businessId: string, userAccessTokenz: string | null): Promise<ApiResponse<ConnectedChannelWithIncludes>> => {
      setChannelLoading(true);
      setErrorChannel(null);

      if (!businessId) {
        const errorMsg = "Business ID is required to create a channel.";
        setErrorChannel(errorMsg);
        setChannelLoading(false);
        return { error: errorMsg, result: null, statusCode: 400 };
      }

      const channelData: CreateChannelData = {
        businessId,
        channelName: page.name,
        platformType: 'FACEBOOK_PAGE',
        platformSpecificId: page.id,
        accessToken: page.access_token,
        isActive: true,
        providerUserId: FUser?.uid || null,
      };

      if (!userAccessTokenz) {
        const errorMsg = "User access token is required to create a channel.";
        setErrorChannel(errorMsg);
        setChannelLoading(false);
        return { error: errorMsg, result: null, statusCode: 400 };
      }

      // Subscribe the app to the page using our new API route

      const subscribeResponse = await request<{
        success: boolean,
        message: string,
        data: null | object
      }>('POST', '/api/auth/facebook/subscribe', {
        pageId: page.id,
        userAccessToken: page.access_token
      });

      if (subscribeResponse.error) {
        const errorMsg = `Failed to subscribe app to Facebook page: ${subscribeResponse.error}`;
        setErrorChannel(errorMsg);
        setChannelLoading(false);
        return { error: errorMsg, result: null, statusCode: subscribeResponse.statusCode || 400 };
      }

      const subscribeResult = subscribeResponse.result?.data;
      console.log('Facebook page subscription successful:', subscribeResult);



      // Create channel in our backend
      const response = await request<ConnectedChannelWithIncludes>("POST", "/api/channels", channelData);

      if (response.error) {
        setErrorChannel(response.error);
      } else {
        setChannel(response.result);
        if (response.result) {
          setChannels(prevChannels => [response.result!, ...prevChannels.filter(ch => ch.channelId !== response.result!.channelId)]);
          setTotalChannel(prevTotal => prevTotal + 1);
        }
      }
      setChannelLoading(false);
      return response;
    },
    [request, FUser]
  );

  const cleanError_Channel = useCallback(() => setErrorChannel(null), []);

  return (
    <ChannelContext.Provider
      value={{
        channel,
        channels,
        total_channel,
        channel_loading,
        error_channel,
        facebookPages,
        userAccessToken,
        fb_loading,
        fetchChannel,
        fetchChannels,
        createChannel,
        updateChannel,
        deleteChannel,
        fetchPagesByFacebookLogIn,
        createChannelFromFacebookPage,
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
