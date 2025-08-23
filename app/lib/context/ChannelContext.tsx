"use client";
import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
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
  connected?: boolean;
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

// Utility function to detect mobile devices
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

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

  // Check for Facebook auth result on component mount (for mobile redirect flow)
  useEffect(() => {
    const checkFacebookAuthResult = async () => {
      const authResult = localStorage.getItem('facebook_auth_result');
      if (authResult) {
        setFbLoading(true);
        setTimeout(async () => {
          localStorage.removeItem('facebook_auth_result');
          const { code, error } = JSON.parse(authResult);
          
          if (code) {
            setFbLoading(true);
            await handleFacebookAuthSuccess(code);
            setFbLoading(false);
          } else if (error) {
            setErrorChannel('Facebook login was cancelled or failed');
          }
        }, 4000);
      }
    };

    checkFacebookAuthResult();
  }, []);

  const handleFacebookAuthSuccess = async (code: string) => {
    // Exchange code for access token using our backend
    const tokenResponse = await request<{ access_token: string }>("POST", "/api/auth/facebook/token", {
      code: code,
      redirectUri: window.location.origin + '/auth/facebook/callback'
    });

    if (tokenResponse.error || !tokenResponse.result) {
      setErrorChannel(tokenResponse.error || 'Failed to exchange code for token');
      return;
    }

    const { access_token } = tokenResponse.result;
    setUserAccessToken(access_token);

    // Set access token in local storage
    localStorage.setItem('facebook_access_token', access_token);

    // Fetch user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${access_token}&fields=id,name,access_token,category,tasks`
    );

    if (!pagesResponse.ok) {
      setErrorChannel('Failed to fetch Facebook pages');
      return;
    }

    const pagesData = await pagesResponse.json();

    if (pagesData.data && pagesData.data.length > 0) {
      const pageIds = pagesData.data.map((page: { id: string }) => page.id);

      // Fetch existing channels to check for connected pages
      const existingChannelsResponse = await request<{ data: ConnectedChannel[] }>("GET", `/api/channels?platformSpecificId=${pageIds.join(',')}`);
      if (existingChannelsResponse.error || !existingChannelsResponse.result) {
        setErrorChannel(existingChannelsResponse.error || 'Failed to fetch existing channels');
        return;
      }
      const existingChannelsData = existingChannelsResponse.result;
      const existingChannelIds = new Set(existingChannelsData.data.map((channel: ConnectedChannel) => channel.platformSpecificId));

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
        tasks: page.tasks,
        connected: existingChannelIds.has(page.id),
      }));
      setFacebookPages(pages);
    } else {
      setErrorChannel('No Facebook pages found');
    }
  };

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

      const isMobile = isMobileDevice();

      if (isMobile) {
        // For mobile: Store current URL and redirect to Facebook
        localStorage.setItem('facebook_auth_return_url', window.location.href);
        window.location.href = authUrl;
      } else {
        // For desktop: Use popup window
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

            await handleFacebookAuthSuccess(event.data.code);

            setFbLoading(false);
          } else if (event.data.type === 'FACEBOOK_AUTH_ERROR') {
            window.removeEventListener('message', handleMessage);
            popup.close();
            setErrorChannel('Facebook login was cancelled or failed');
            setFbLoading(false);
          }
        };

        window.addEventListener('message', handleMessage);

        // Also listen for popup being closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            if (fb_loading) {
              setErrorChannel('Facebook login was cancelled');
              setFbLoading(false);
            }
          }
        }, 1000);
      }

    } catch (error) {
      setErrorChannel(`Failed to initialize Facebook login: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setFbLoading(false);
    }
  }, [fb_loading]);

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
