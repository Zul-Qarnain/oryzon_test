"use client";

import React, { useEffect, useState, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Header component is removed as it's in layout.tsx
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useChannelContext } from '@/app/lib/context/ChannelContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, Save, ToggleLeft, ToggleRight, RadioTower, AlertCircle } from 'lucide-react';
import { UpdateBusinessPayload } from '@/backend/services/businesses/businesses.types';
import { ConnectedChannelWithIncludes } from '@/backend/services/channels/channels.types';
import Link from 'next/link';

const BusinessSettingsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { user, user_loading } = useUserContext();
  const { 
    business, 
    fetchBusiness, 
    updateBusiness, 
    businessLoading, 
    businessError 
  } = useBusinessContext();
  const { 
    channels, 
    fetchChannels, 
    updateChannel, 
    channel_loading, 
    error_channel 
  } = useChannelContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [localChannels, setLocalChannels] = useState<ConnectedChannelWithIncludes[]>([]);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);


  useEffect(() => {
    if (businessId && user) {
      fetchBusiness(businessId);
      fetchChannels({ filter: { businessId } });
    }
  }, [businessId, user, fetchBusiness, fetchChannels]);

  useEffect(() => {
    if (business) {
      setName(business.name);
      setDescription(business.description || '');
    }
  }, [business]);

  useEffect(() => {
    setLocalChannels(channels);
  }, [channels]);

  const handleBusinessSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setIsSavingBusiness(true);
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    const payload: UpdateBusinessPayload = { name, description };
    const response = await updateBusiness(businessId, payload);
    setIsSavingBusiness(false);
    if (response.error) {
      setSaveErrorMessage(response.error || "Failed to update business details.");
    } else {
      setSaveSuccessMessage("Business details updated successfully!");
      // Optionally refetch business to ensure UI consistency if context doesn't auto-update deeply
      // fetchBusiness(businessId); 
    }
  };

  const handleChannelToggle = async (channelId: string, isActive: boolean) => {
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
    const originalChannels = [...localChannels];
    
    // Optimistically update UI
    setLocalChannels(prevChannels => 
      prevChannels.map(ch => ch.channelId === channelId ? { ...ch, isActive } : ch)
    );

    const response = await updateChannel(channelId, { isActive });

    if (response.error) {
      setSaveErrorMessage(response.error || `Failed to update channel ${channelId}. Reverting.`);
      // Revert optimistic update on error
      setLocalChannels(originalChannels);
    } else {
      setSaveSuccessMessage(`Channel ${channelId} status updated.`);
      // Optionally refetch channels to ensure UI consistency
      // fetchChannels({ filter: { businessId } });
    }
  };
  
  if (user_loading || (businessLoading && !business) || (channel_loading && channels.length === 0 && !error_channel)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading settings...</p>
      </div>
    );
  }

  if (businessError || (!business && !businessLoading)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Business</h2>
        <p className="text-center text-[var(--text-on-dark-muted)]">{businessError || "Business not found or an error occurred."}</p>
        <Link href="/home" className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }


  return (
    <>
      <h2 className="text-3xl font-bold mb-8 text-[var(--text-page-heading)]">
        Business Settings: <span className="text-[var(--color-accent-primary)]">{business?.name}</span>
      </h2>

      {saveSuccessMessage && (
        <div className="mb-4 p-3 bg-green-500/20 text-green-300 border border-green-500 rounded-md">
          {saveSuccessMessage}
        </div>
      )}
      {saveErrorMessage && (
        <div className="mb-4 p-3 bg-red-500/20 text-red-300 border border-red-500 rounded-md">
          {saveErrorMessage}
        </div>
      )}

      <form onSubmit={handleBusinessSubmit} className="mb-12 p-6 bg-[var(--bg-secondary)] rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-[var(--text-on-dark-secondary)]">General Information</h3>
        <div className="mb-6">
          <label htmlFor="businessName" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">
            Business Name
          </label>
          <input
            type="text"
            id="businessName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-color-muted"
            placeholder="Enter business name"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="businessDescription" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">
            Description
          </label>
          <textarea
            id="businessDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full p-3 bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-color-muted"
            placeholder="Enter business description"
          />
        </div>
        <button
          type="submit"
          disabled={isSavingBusiness || businessLoading}
          className="w-full md:w-auto px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {isSavingBusiness ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Save Changes
        </button>
      </form>

      <div className="p-6 bg-[var(--bg-secondary)] rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold mb-6 text-[var(--text-on-dark-secondary)]">Channel Management</h3>
        {channel_loading && <Loader2 className="h-6 w-6 animate-spin text-[var(--icon-accent-primary)] mb-4" />}
        {error_channel && <p className="text-[var(--text-error)] mb-4">Error loading channels: {error_channel}</p>}
        
        {localChannels.length > 0 ? (
          <ul className="space-y-4">
            {localChannels.map(channel => (
              <li key={channel.channelId} className="flex items-center justify-between p-4 bg-[var(--bg-badge)] rounded-md">
                <div className="flex items-center">
                  <RadioTower className="h-5 w-5 mr-3 text-[var(--icon-platform-default)]" /> {/* TODO: Platform specific icon */}
                  <div>
                    <span className="font-medium text-[var(--text-on-dark-primary)]">{channel.channelName || `Channel ${channel.channelId.substring(0,6)}`}</span>
                    <p className="text-xs text-[var(--text-on-dark-muted)]">{channel.platformType}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleChannelToggle(channel.channelId, !channel.isActive)}
                  title={channel.isActive ? "Deactivate Channel" : "Activate Channel"}
                  className={`p-2 rounded-md transition-colors ${
                    channel.isActive 
                      ? 'bg-green-500/30 hover:bg-green-500/50 text-green-300' 
                      : 'bg-red-500/30 hover:bg-red-500/50 text-red-300'
                  }`}
                >
                  {channel.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          !channel_loading && <p className="text-[var(--text-on-dark-muted)]">No channels connected to this business.</p>
        )}
      </div>
    </>
  );
};

export default BusinessSettingsPage;
