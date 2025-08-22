"use client";

import React, { useState, useEffect } from 'react';
import { useChannelContext } from '@/app/lib/context/ChannelContext';
import { useRouter } from 'next/navigation';
import { ConnectedChannel } from '@/backend/services/channels/channels.types';

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
        tokenExpiresAt: channel.tokenExpiresAt,
        isActive: channel.isActive,
        providerUserId: channel.providerUserId,
        description: channel.description,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading channel details...</div>
      </div>
    );
  }

  if (error_channel) {
    return (
      <div className="min-h-screen p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error_channel}
        </div>
        <button
          onClick={() => router.push(`/business/${businessId}/channels`)}
          className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Channels
        </button>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="min-h-screen p-6">
        <div className="text-lg">Channel not found</div>
        <button
          onClick={() => router.push(`/business/${businessId}/channels`)}
          className="mt-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Channels
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Channel Details</h1>
              <p className="text-gray-600 mt-2">{channel.channelName}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push(`/business/${businessId}/channels`)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Back to Channels
              </button>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Edit Channel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Channel Details Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Channel Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Channel ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel ID
              </label>
              <input
                type="text"
                value={formData.channelId || ''}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500"
              />
            </div>

            {/* Business ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business ID
              </label>
              <input
                type="text"
                value={formData.businessId || ''}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500"
              />
            </div>

            {/* Channel Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Channel Name
              </label>
              <input
                type="text"
                value={formData.channelName || ''}
                onChange={(e) => handleInputChange('channelName', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditing ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
                }`}
              />
            </div>

            {/* Platform Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Type
              </label>
              <select
                value={formData.platformType || ''}
                onChange={(e) => handleInputChange('platformType', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditing ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform Specific ID
              </label>
              <input
                type="text"
                value={formData.platformSpecificId || ''}
                onChange={(e) => handleInputChange('platformSpecificId', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditing ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
                }`}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditing ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
                }`}
                placeholder="Channel description"
              />
            </div>

            {/* Is Active */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Active Status
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  disabled={!isEditing}
                  className={`h-4 w-4 text-blue-600 rounded ${
                    isEditing ? 'focus:ring-blue-500 border-gray-300' : 'text-gray-400'
                  }`}
                />
                <span className="ml-2 text-sm text-gray-700">
                  Channel is active
                </span>
              </div>
            </div>

            {/* Provider User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider User ID
              </label>
              <input
                type="text"
                value={formData.providerUserId || ''}
                onChange={(e) => handleInputChange('providerUserId', e.target.value)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditing ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
                }`}
              />
            </div>

            {/* Access Token */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Access Token
              </label>
              <textarea
                value={formData.accessToken || ''}
                onChange={(e) => handleInputChange('accessToken', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditing ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
                }`}
                placeholder="Access token for platform authentication"
              />
            </div>

            {/* Refresh Token */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Refresh Token
              </label>
              <textarea
                value={formData.refreshToken || ''}
                onChange={(e) => handleInputChange('refreshToken', e.target.value)}
                disabled={!isEditing}
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditing ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
                }`}
                placeholder="Refresh token for platform authentication"
              />
            </div>

            {/* Token Expires At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Expires At
              </label>
              <input
                type="datetime-local"
                value={formData.tokenExpiresAt ? new Date(formData.tokenExpiresAt).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleInputChange('tokenExpiresAt', e.target.value ? new Date(e.target.value) : null)}
                disabled={!isEditing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm ${
                  isEditing ? 'focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
                }`}
              />
            </div>

            {/* Created At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created At
              </label>
              <input
                type="text"
                value={formData.createdAt ? new Date(formData.createdAt).toLocaleString() : ''}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500"
              />
            </div>

            {/* Updated At */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Updated At
              </label>
              <input
                type="text"
                value={formData.updatedAt ? new Date(formData.updatedAt).toLocaleString() : ''}
                disabled={true}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500"
              />
            </div>
          </div>

          {/* Error Display */}
          {error_channel && (
            <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong>Error:</strong> {error_channel}
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${
                  isSaving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
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
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Delete Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Once you delete a channel, there is no going back. Please be certain.
          </p>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded ${
              isDeleting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Delete Channel'}
          </button>
        </div>
      </div>
    </div>
  );
}
