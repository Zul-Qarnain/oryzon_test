"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
// Header component is removed as it's in layout.tsx
import { useChannelContext, FacebookPage } from '@/app/lib/context/ChannelContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { platformTypeEnum } from '@/db/schema'; // Assuming this can be imported
import { Loader2, AlertCircle, ChevronLeft, ChevronRight, PlusCircle } from 'lucide-react';
import { CreateChannelData } from '@/backend/services/channels/channels.types';
import { FaFacebook } from 'react-icons/fa';

// Manually define platform types if direct import is problematic or for broader compatibility
const platformTypes = platformTypeEnum?.enumValues || ['FACEBOOK_PAGE', 'INSTAGRAM_BUSINESS', 'WHATSAPP_BUSINESS_ACCOUNT', 'TWITTER_PROFILE', 'LINKEDIN_PAGE']; // Added WhatsApp

const NewChannelForBusinessContent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { user, user_loading } = useUserContext();
  const { 
    createChannel, 
    channel_loading, 
    error_channel, 
    cleanError_Channel,
    facebookPages,
    fb_loading,
    fetchPagesByFacebookLogIn,
    createChannelFromFacebookPage,
    userAccessToken

  } = useChannelContext();

  const [step, setStep] = useState(1);
  const [selectedPage, setSelectedPage] = useState<FacebookPage | null>(null);

  // Step 1 State
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState(''); // Optional description
  const [selectedPlatformType, setSelectedPlatformType] = useState<string>(platformTypes[0]);
  const [platformSpecificId, setPlatformSpecificId] = useState(''); // e.g., Page ID
  const [formErrorStep1, setFormErrorStep1] = useState('');

  // Step 2 State
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState(''); // Optional
  const [formErrorStep2, setFormErrorStep2] = useState('');
  
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const handleFacebookLogin = async () => {
    await fetchPagesByFacebookLogIn();
  };

  // Effect to move to step 3 when Facebook pages are loaded
  useEffect(() => {
    if (facebookPages.length > 0 && !fb_loading) {
      setStep(3); // Move to Facebook page selection step
    }
  }, [facebookPages, fb_loading]);

  const handlePageSelection = (page: FacebookPage) => {
    setSelectedPage(page);
  };

  const handleCreateFromFacebookPage = async () => {
    if (!selectedPage) return;
    const response = await createChannelFromFacebookPage(selectedPage, businessId, userAccessToken);

    if (response.error) {
      setFormErrorStep2(response.error);
    } else {
      setFormSuccess(`Facebook page "${selectedPage.name}" connected successfully!`);
      setTimeout(() => {
        router.push(`/business/${businessId}#channels`);
      }, 2000);
    }
  };


  useEffect(() => {
    cleanError_Channel(); // Clear previous errors on mount or businessId change
  }, [cleanError_Channel, businessId]);

  useEffect(() => {
    if (error_channel) {
      if (step === 1) setFormErrorStep1(error_channel);
      else if (step === 2) setFormErrorStep2(error_channel);
      else console.log(`Error: ${error_channel}`); // Fallback for unhandled step
    }
  }, [error_channel, step]);

  const handleStep1Continue = (e: FormEvent) => {
    e.preventDefault();
    cleanError_Channel();
    setFormErrorStep1('');
    if (!channelName.trim()) {
      setFormErrorStep1('Channel name cannot be empty.');
      return;
    }
    if (!selectedPlatformType) {
      setFormErrorStep1('Please select a platform.');
      return;
    }
    if (!platformSpecificId.trim()) {
      setFormErrorStep1('Platform Specific ID cannot be empty.');
      return;
    }
    setStep(2);
  };

  const handleCreateChannel = async (e: FormEvent) => {
    e.preventDefault();
    cleanError_Channel();
    setFormErrorStep2('');
    setFormSuccess(null);

    if (!user) {
      setFormErrorStep2('User not authenticated. Please sign in.');
      // router.push('/user/signIn'); // Optionally redirect
      return;
    }
    if (!businessId) {
      setFormErrorStep2('Business ID is missing. Cannot create channel.');
      return;
    }
    if (!accessToken.trim()) {
      setFormErrorStep2('Access Token cannot be empty.');
      return;
    }

    const channelDataPayload: Omit<CreateChannelData, 'providerUserId'> & { businessId: string } = {
      businessId,
      channelName: channelName.trim(),
      description: description.trim() || undefined,
      platformType: selectedPlatformType as typeof platformTypeEnum.enumValues[number],
      platformSpecificId: platformSpecificId.trim(), // Assuming this is the correct field name in CreateChannelData
      accessToken: accessToken.trim(),
      refreshToken: refreshToken.trim() || undefined,
      isActive: true,
    };
    
    const response = await createChannel(channelDataPayload);

    if (response.error) {
      setFormErrorStep2(response.error);
    } else {
      setFormSuccess(`Channel "${response.result?.channelName || channelDataPayload.channelName}" created successfully!`);
      setTimeout(() => {
        router.push(`/business/${businessId}#channels`);
      }, 2000);
    }
  };
  
  if (user_loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading...</p>
      </div>
    );
  }
   if (!user && !user_loading) {
    router.push('/user/signIn'); // Redirect if not logged in
    return null; 
  }


  const renderStep1 = () => (
    <form onSubmit={handleStep1Continue} className="space-y-6">
      <div>
        <label htmlFor="channelName" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Channel Name</label>
        <input
          id="channelName" type="text" placeholder="e.g., My Business Facebook Page"
          value={channelName} onChange={(e) => { setChannelName(e.target.value); if (formErrorStep1) setFormErrorStep1(''); }}
          className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Description (Optional)</label>
        <input
          id="description" type="text" placeholder="Briefly describe this channel's purpose"
          value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
        />
      </div>
      <div>
        <label htmlFor="platformType" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Platform</label>
        <select
          id="platformType" value={selectedPlatformType}
          onChange={(e) => { setSelectedPlatformType(e.target.value); if (formErrorStep1) setFormErrorStep1(''); }}
          className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)]"
          required
        >
          {platformTypes.map((type) => (
            <option key={type} value={type} className="bg-[var(--bg-secondary)] text-[var(--text-on-dark-primary)]">
              {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="platformSpecificId" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Platform Account ID</label>
        <input
          id="platformSpecificId" type="text" placeholder="e.g., Facebook Page ID, Instagram User ID"
          value={platformSpecificId} onChange={(e) => { setPlatformSpecificId(e.target.value); if (formErrorStep1) setFormErrorStep1(''); }}
          className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
          required
        />
      </div>
      {formErrorStep1 && <p className="text-sm text-red-400 flex items-center"><AlertCircle size={16} className="mr-1"/>{formErrorStep1}</p>}
      
      <div className="border-t border-[var(--border-medium)] pt-6">
        <p className="text-sm text-[var(--text-on-dark-muted)] mb-4 text-center">Or connect using Facebook</p>
        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={fb_loading}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
        >
          {fb_loading ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <FaFacebook className="h-5 w-5 mr-2" />
          )}
          {fb_loading ? 'Connecting...' : 'Create Using Facebook'}
        </button>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors flex items-center"
        >
          Continue <ChevronRight size={20} className="ml-1" />
        </button>
      </div>
    </form>
  );

  const renderFacebookPageSelection = () => (
    <div className="space-y-6">
      <p className="text-md text-[var(--text-on-dark-muted)]">
        Select a Facebook page to connect:
      </p>
      
      {facebookPages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--text-on-dark-muted)]">No Facebook pages found.</p>
          <button
            onClick={() => setStep(1)}
            className="mt-4 px-4 py-2 text-[var(--color-accent-primary)] hover:underline"
          >
            Go back to manual setup
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {facebookPages.map((page) => (
            <div
              key={page.id}
              onClick={() => handlePageSelection(page)}
              className={`p-4 bg-[var(--bg-input)] border rounded-md cursor-pointer transition-colors ${
                selectedPage?.id === page.id 
                  ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                  : 'border-[var(--border-medium)] hover:border-[var(--color-accent-primary)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-[var(--text-on-dark-primary)]">{page.name}</h3>
                  <p className="text-sm text-[var(--text-on-dark-muted)]">Page ID: {page.id}</p>
                  {page.category && (
                    <p className="text-xs text-[var(--text-on-dark-muted)]">Category: {page.category}</p>
                  )}
                </div>
                <FaFacebook className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error_channel && <p className="text-sm text-red-400 flex items-center"><AlertCircle size={16} className="mr-1"/>{error_channel}</p>}
      
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-6 py-3 text-[var(--text-on-dark-secondary)] hover:text-[var(--text-on-dark-primary)] font-semibold rounded-md transition-colors flex items-center"
        >
          <ChevronLeft size={20} className="mr-1" /> Back
        </button>
        <button
          onClick={handleCreateFromFacebookPage}
          disabled={!selectedPage || channel_loading}
          className="px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {channel_loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <PlusCircle className="h-5 w-5 mr-2" />}
          {channel_loading ? 'Connecting...' : 'Connect Selected Page'}
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <form onSubmit={handleCreateChannel} className="space-y-6">
      <p className="text-md text-[var(--text-on-dark-muted)]">
        Configuring: <span className="font-semibold text-[var(--text-on-dark-primary)]">{channelName}</span> ({selectedPlatformType.replace(/_/g, ' ')})
      </p>
      <div>
        <label htmlFor="accessToken" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Access Token</label>
        <input
          id="accessToken" type="password" placeholder="Enter platform access token"
          value={accessToken} onChange={(e) => { setAccessToken(e.target.value); if (formErrorStep2) setFormErrorStep2(''); }}
          className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
          required
        />
      </div>
      <div>
        <label htmlFor="refreshToken" className="block text-sm font-medium text-[var(--text-on-dark-muted)] mb-1">Refresh Token (Optional)</label>
        <input
          id="refreshToken" type="password" placeholder="Enter platform refresh token if available"
          value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)}
          className="w-full p-3 bg-[var(--bg-input)] text-[var(--text-on-dark-primary)] border border-[var(--border-medium)] rounded-md focus:ring-[var(--color-accent-primary)] focus:border-[var(--color-accent-primary)] placeholder-[var(--text-on-dark-placeholder)]"
        />
      </div>
      {formErrorStep2 && <p className="text-sm text-red-400 flex items-center"><AlertCircle size={16} className="mr-1"/>{formErrorStep2}</p>}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={() => { setStep(1); setFormErrorStep2(''); cleanError_Channel(); }}
          disabled={channel_loading}
          className="px-6 py-3 text-[var(--text-on-dark-secondary)] hover:text-[var(--text-on-dark-primary)] font-semibold rounded-md transition-colors flex items-center disabled:opacity-50"
        >
          <ChevronLeft size={20} className="mr-1" /> Back
        </button>
        <button
          type="submit"
          disabled={channel_loading}
          className="px-6 py-3 bg-[var(--color-accent-primary)] text-white font-semibold rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          {channel_loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <PlusCircle className="h-5 w-5 mr-2" />}
          {channel_loading ? 'Connecting...' : 'Connect Channel'}
        </button>
      </div>
    </form>
  );

  return (
    <>
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center text-sm text-[var(--text-on-dark-muted)] hover:text-[var(--text-on-dark-primary)] transition-colors">
          <ChevronLeft size={18} className="mr-1" />
          Back to Business
        </button>
      </div>
      <h2 className="text-3xl font-bold mb-2 text-[var(--text-page-heading)]">
        Connect New Channel
      </h2>
      <p className="text-md text-[var(--text-on-dark-muted)] mb-8">
        Step {step} of {step === 3 ? 3 : 2}: {step === 1 ? "Channel Details" : step === 2 ? "Provider Authentication" : "Select Facebook Page"}
      </p>

      {formSuccess && (
        <div className="mb-6 p-4 bg-green-600/20 text-green-300 border border-green-500 rounded-md flex items-center">
          <PlusCircle className="h-5 w-5 mr-2" />
          {formSuccess}
        </div>
      )}
      
      <div className="p-6 bg-[var(--bg-secondary)] rounded-xl shadow-lg">
        {step === 1 ? renderStep1() : step === 2 ? renderStep2() : renderFacebookPageSelection()}
      </div>
    </>
  );
};

export default NewChannelForBusinessContent;
