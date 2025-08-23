"use client";

import React, { useState, useEffect } from 'react';
import { useChannelContext } from '@/app/lib/context/ChannelContext';
import { useRouter } from 'next/navigation';
import { ConnectedChannel } from '@/backend/services/channels/channels.types';
import { Loader2, AlertCircle, Save, Trash2 } from 'lucide-react';

interface ChannelDetailContentProps {
  businessId: string;
  channelId: string;
}

export default function ChannelDetailContent({ businessId, channelId }: ChannelDetailContentProps) {
  const {
    channel,
    channel_loading,
    error_channel,
    fetchChannel,
    updateChannel,
    deleteChannel,
    cleanError_Channel
  } = useChannelContext();

  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isDeleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState<Partial<ConnectedChannel>>({});

  // Fetch channel details on component mount
  useEffect(() => {
    if (channelId) {
      fetchChannel(channelId, { include: 'business,chats' });
    }
  }, [channelId, fetchChannel]);

  // Update form data when channel is loaded
  useEffect(() => {
    if (channel) {
      setFormData({
        channelId: channel.channelId,
        businessId: channel.businessId,
        channelName: channel.channelName,
        platformType: channel.platformType,
        platformSpecificId: channel.platformSpecificId,
        accessToken: channel.accessToken,
        refreshToken: channel.refreshToken,
 
        isActive: channel.isActive,
        providerUserId: channel.providerUserId,
        description: channel.description,
      
      });
    }
  }, [channel]);

  const handleInputChange = (field: keyof ConnectedChannel, value: string | boolean | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!channelId) return;
    
    setSaving(true);
    cleanError_Channel();
    
    try {
      const response = await updateChannel(channelId, formData);
      if (!response.error) {
        setIsEditing(false);
        // Refresh the channel data
        await fetchChannel(channelId, { include: 'business,chats' });
      }
    } catch (error) {
      console.error('Error updating channel:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!channelId) return;
    
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this channel? This action cannot be undone.'
    );
    
    if (!confirmDelete) return;
    
    setDeleting(true);
    cleanError_Channel();
    
    try {
      const response = await deleteChannel(channelId);
      if (!response.error) {
        // Redirect to channels list after successful deletion
        router.push(`/business/${businessId}/channels`);
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (channel_loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading channel details...</p>
      </div>
    );
  }

  if (error_channel) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Channel</h2>
        <p className="text-center text-[var(--text-on-dark-muted)] mb-6">{error_channel}</p>
        <button
          onClick={() => router.push(`/business/${businessId}/channels`)}
          className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors"
        >
          Back to Channels
        </button>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Channel Not Found</h2>
        <p className="text-center text-[var(--text-on-dark-muted)] mb-6">The requested channel could not be found.</p>
        <button
          onClick={() => router.push(`/business/${businessId}/channels`)}
          className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors"
        >
          Back to Channels
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-page-heading)]">Channel Details</h1>
          <p className="text-[var(--text-on-dark-muted)] mt-2">{channel.channelName}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push(`/business/${businessId}/channels`)}
            className="px-4 py-2 bg-[var(--bg-accent)] text-[var(--text-on-dark-secondary)] hover:bg-[var(--bg-accent-hover)] hover:text-[var(--text-on-dark-primary)] transition-colors rounded-md"
          >
            Back to Channels
          </button>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-glow)] transition-colors rounded-md"
            >
              Edit Channel
            </button>
          )}
        </div>
      </div>

      {/* Channel Details Form */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-6 text-[var(--text-on-dark-secondary)]">Channel Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel ID */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Channel ID
              </label>
              <input
                type="text"
                value={formData.channelId || ''}
                disabled={true}
                className="w-full p-3 bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)] border border-[var(--border-medium)] rounded-md"
              />
            </div>

            {/* Business ID */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Business ID
              </label>
              <input
                type="text"
                value={formData.businessId || ''}
                disabled={true}
                className="w-full p-3 bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)] border border-[var(--border-medium)] rounded-md"
              />
            </div>

            {/* Channel Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Channel Name
              </label>
              <input
                type="text"
                value={formData.channelName || ''}
                onChange={(e) => handleInputChange('channelName', e.target.value)}
                disabled={!isEditing}
                className={`w-full p-3 border border-[var(--border-medium)] rounded-md ${
                  isEditing 
                    ? 'bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]' 
                    : 'bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)]'
                }`}
              />
            </div>

            {/* Platform Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Platform Type
              </label>
              <select
                value={formData.platformType || ''}
                onChange={(e) => handleInputChange('platformType', e.target.value)}
                disabled={!isEditing}
                className={`w-full p-3 border border-[var(--border-medium)] rounded-md ${
                  isEditing 
                    ? 'bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]' 
                    : 'bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)]'
                }`}
              >
                <option value="FACEBOOK_PAGE">Facebook Page</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="TELEGRAM">Telegram</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
                <option value="WEBSITE_CHAT">Website Chat</option>
              </select>
            </div>

            {/* Platform Specific ID */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Platform Specific ID
              </label>
              <input
                type="text"
                value={formData.platformSpecificId || ''}
                onChange={(e) => handleInputChange('platformSpecificId', e.target.value)}
                disabled={!isEditing}
                className={`w-full p-3 border border-[var(--border-medium)] rounded-md ${
                  isEditing 
                    ? 'bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]' 
                    : 'bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)]'
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!isEditing}
                className={`w-full p-3 border border-[var(--border-medium)] rounded-md ${
                  isEditing 
                    ? 'bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]' 
                    : 'bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)]'
                }`}
                placeholder="Channel description"
              />
            </div>

            {/* Is Active */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Active Status
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  disabled={!isEditing}
                  className={`h-5 w-5 text-[var(--color-accent-primary)] border-[var(--border-medium)] rounded ${
                    isEditing ? 'focus:ring-[var(--color-accent-primary)]' : 'opacity-50'
                  }`}
                />
                <span className="ml-2 text-sm font-medium text-[var(--text-on-dark-primary)]">
                  Channel is active
                </span>
              </div>
            </div>

            {/* Provider User ID */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Provider User ID
              </label>
              <input
                type="text"
                value={formData.providerUserId || ''}
                onChange={(e) => handleInputChange('providerUserId', e.target.value)}
                disabled={!isEditing}
                className={`w-full p-3 border border-[var(--border-medium)] rounded-md ${
                  isEditing 
                    ? 'bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]' 
                    : 'bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)]'
                }`}
              />
            </div>

            {/* Access Token */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Access Token
              </label>
              <textarea
                value={formData.accessToken || ''}
                onChange={(e) => handleInputChange('accessToken', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className={`w-full p-3 border border-[var(--border-medium)] rounded-md ${
                  isEditing 
                    ? 'bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]' 
                    : 'bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)]'
                }`}
                placeholder="Access token for platform authentication"
              />
            </div>

            {/* Refresh Token */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-2">
                Refresh Token
              </label>
              <textarea
                value={formData.refreshToken || ''}
                onChange={(e) => handleInputChange('refreshToken', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className={`w-full p-3 border border-[var(--border-medium)] rounded-md ${
                  isEditing 
                    ? 'bg-[var(--bg-badge)] text-[var(--text-on-dark-primary)] focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]' 
                    : 'bg-[var(--bg-badge)] text-[var(--text-on-dark-muted)]'
                }`}
                placeholder="Refresh token for platform authentication"
              />
            </div>

            
          </div>

          {/* Error Display */}
          {error_channel && (
            <div className="mt-6 p-3 bg-red-500/20 text-red-300 border border-red-500 rounded-md">
              <strong>Error:</strong> {error_channel}
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full md:w-auto px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center ${
                  isSaving ? 'cursor-not-allowed' : ''
                }`}
              >
                {isSaving ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Save className="h-5 w-5 mr-2" />
                )}
                {isSaving ? 'Saving Changes...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data to original channel data
                  if (channel) {
                    setFormData({
                      channelId: channel.channelId,
                      businessId: channel.businessId,
                      channelName: channel.channelName,
                      platformType: channel.platformType,
                      platformSpecificId: channel.platformSpecificId,
                      accessToken: channel.accessToken,
                      refreshToken: channel.refreshToken,
                      tokenExpiresAt: channel.tokenExpiresAt,
                      isActive: channel.isActive,
                      providerUserId: channel.providerUserId,
                      description: channel.description,
                      createdAt: channel.createdAt,
                      updatedAt: channel.updatedAt
                    });
                  }
                }}
                disabled={isSaving}
                className="px-6 py-3 bg-[var(--bg-accent)] text-[var(--text-on-dark-secondary)] hover:bg-[var(--bg-accent-hover)] hover:text-[var(--text-on-dark-primary)] transition-colors rounded-md"
              >
                Cancel
              </button>
            </div>
          )}
      </div>

      {/* Delete Section */}
      <div className="bg-[var(--bg-secondary)] rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-[var(--text-error)] mb-4">Danger Zone</h3>
        <p className="text-[var(--text-on-dark-muted)] mb-4">
          Once you delete a channel, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`px-6 py-3 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center ${
            isDeleting ? 'cursor-not-allowed' : ''
          }`}
        >
          {isDeleting ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Trash2 className="h-5 w-5 mr-2" />
          )}
          {isDeleting ? 'Deleting Channel...' : 'Delete Channel'}
        </button>
      </div>
    </>
  );
}
