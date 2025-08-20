"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
// Header component is removed as it's in layout.tsx
import { useChannelContext } from '@/app/lib/context/ChannelContext';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, RadioTower, PlusCircle, AlertCircle, Settings, Eye } from 'lucide-react';
import { ConnectedChannelWithIncludes } from '@/backend/services/channels/channels.types';

const BusinessChannelsListContent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { user, user_loading } = useUserContext();
  const { 
    channels, 
    fetchChannels, 
    channel_loading, 
    error_channel 
  } = useChannelContext();
  const { 
    business, 
    fetchBusiness, 
    businessLoading, 
    businessError 
  } = useBusinessContext();

  useEffect(() => {
    if (businessId && user) {
      fetchBusiness(businessId); // Fetch business details for context (e.g., name)
      fetchChannels({ filter: { businessId } });
    }
  }, [businessId, user, fetchBusiness, fetchChannels]);

  const ChannelCard: React.FC<{ channel: ConnectedChannelWithIncludes }> = ({ channel }) => (
    <div className="bg-[var(--bg-card)] p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <div className="flex items-center mb-3">
        <RadioTower className="h-7 w-7 text-[var(--icon-accent-primary)] mr-3" />
        <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] truncate" title={channel.channelName || `Channel ID: ${channel.channelId}`}>
          {channel.channelName || `Channel ${channel.channelId.substring(0,8)}...`}
        </h3>
      </div>
      <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
        Platform: <span className="font-medium text-[var(--text-on-dark-secondary)]">{channel.platformType}</span>
      </p>
      <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
        Account ID: <span className="font-medium text-[var(--text-on-dark-secondary)]">{channel.platformSpecificId || 'N/A'}</span>
      </p>
      <p className="text-sm text-[var(--text-on-dark-muted)] mb-4">
        Status: 
        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
          channel.isActive 
            ? 'bg-green-500/20 text-green-300' 
            : 'bg-red-500/20 text-red-300'
        }`}>
          {channel.isActive ? 'Active' : 'Inactive'}
        </span>
      </p>
      <div className="flex justify-end space-x-2">
        {/* Future actions like view details or edit can go here */}
        {/* For now, settings are managed under business settings */}
        <button
            onClick={() => router.push(`/business/${businessId}/settings#${channel.channelId}`)} // Example: deep link to channel settings if available
            className="p-2 text-xs bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-dark-secondary)] rounded-md transition-colors flex items-center"
            title="Manage Channel in Settings"
        >
            <Settings size={14} className="mr-1" /> Manage
        </button>
      </div>
    </div>
  );

  if (user_loading || (businessLoading && !business) || (channel_loading && channels.length === 0 && !error_channel && !businessError)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading channels...</p>
      </div>
    );
  }

  if (!user && !user_loading) {
    router.push('/user/signIn');
    return null;
  }
  
  if (businessError) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Business</h2>
        <p className="text-center text-[var(--text-on-dark-muted)]">{businessError}</p>
        <Link href="/home" className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-page-heading)]">
            Channels for {business?.name || 'Business'}
          </h2>
          <p className="text-[var(--text-on-dark-muted)] mt-1">Manage all connected communication channels.</p>
        </div>
        <Link
          href={`/business/${businessId}/channel/new`}
          className="mt-4 sm:mt-0 px-5 py-2.5 bg-[var(--color-accent-primary)] text-white font-semibold rounded-lg hover:bg-opacity-80 transition-colors flex items-center justify-center whitespace-nowrap"
        >
          <PlusCircle className="h-5 w-5 mr-2" />
          Add New Channel
        </Link>
      </div>

      {channel_loading && !error_channel && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--icon-accent-primary)]" />
          <p className="ml-3 text-[var(--text-on-dark-secondary)]">Fetching channels...</p>
        </div>
      )}

      {error_channel && (
        <div className="my-6 p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-md flex items-center">
          <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Failed to load channels</h4>
            <p className="text-sm">{error_channel}</p>
          </div>
        </div>
      )}

      {!channel_loading && !error_channel && channels.length === 0 && (
        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg shadow">
          <RadioTower className="h-16 w-16 text-[var(--icon-accent-primary)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] mb-2">No Channels Found</h3>
          <p className="text-[var(--text-on-dark-muted)] mb-6">
            Get started by connecting your first communication channel.
          </p>
          <Link
            href={`/business/${businessId}/channel/new`}
            className="px-6 py-2.5 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors inline-flex items-center"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Add Channel
          </Link>
        </div>
      )}

      {!channel_loading && !error_channel && channels.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map(channel => (
            <ChannelCard key={channel.channelId} channel={channel} />
          ))}
        </div>
      )}
    </>
  );
};

export default BusinessChannelsListContent;
