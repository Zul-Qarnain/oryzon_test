"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CloseIcon from '@/components/CloseIcon';
import { useChannelContext } from '@/app/lib/context/ChannelContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { platformTypeEnum } from '@/db/schema'; // Assuming this can be imported directly

// Manually define platform types if direct import is problematic
const platformTypes = platformTypeEnum.enumValues || ['FACEBOOK_PAGE', 'INSTAGRAM_BUSINESS', 'LINKEDIN_PAGE', 'TWITTER_PROFILE'];

const NewChannelPage = () => {
  const [step, setStep] = useState(1);
  const router = useRouter();
  const { user } = useUserContext();
  const { createChannel, channel_loading, error_channel, cleanError_Channel } = useChannelContext();

  // Step 1 State
  const [channelName, setChannelName] = useState('');
  const [description, setDescription] = useState('');
  const [platformType, setPlatformType] = useState<string>(platformTypes[0]);
  const [platformSpecificId, setPlatformSpecificId] = useState('');
  const [formErrorStep1, setFormErrorStep1] = useState('');

  // Step 2 State
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [formErrorStep2, setFormErrorStep2] = useState('');

  useEffect(() => {
    if (error_channel) {
      // Display error from context
      if (step === 1 && (channelName || description || platformSpecificId)) { // Heuristic to check if error is for step 1
        setFormErrorStep1(error_channel);
      } else if (step === 2 && (accessToken || refreshToken)) { // Heuristic for step 2
        setFormErrorStep2(error_channel);
      } else {
         // Generic error display or perhaps a toast notification system would be better
        console.log(`Error: ${error_channel}`);
      }
    }
  }, [error_channel, step, channelName, description, platformSpecificId, accessToken, refreshToken]);

  const handleStep1Continue = () => {
    cleanError_Channel();
    if (!channelName.trim()) {
      setFormErrorStep1('Channel name cannot be empty.');
      return;
    }
    if (!platformType) {
      setFormErrorStep1('Please select a provider.');
      return;
    }
    if (!platformSpecificId.trim()) {
      setFormErrorStep1('Platform Specific ID cannot be empty.');
      return;
    }
    setFormErrorStep1('');
    setStep(2);
  };

  const handleCreateChannel = async () => {
    cleanError_Channel();
    if (!user) {
      setFormErrorStep2('User not authenticated. Please sign in.');
      return;
    }
    if (!accessToken.trim()) {
      setFormErrorStep2('Access Token cannot be empty.');
      return;
    }
    // Refresh token can be optional for some providers, adjust if necessary
    // if (!refreshToken.trim()) {
    //   setFormErrorStep2('Refresh Token cannot be empty.');
    //   return;
    // }
    setFormErrorStep2('');

    const channelData = {
      userId: user.userId,
      channelName: channelName.trim(),
      description: description.trim(),
      platformType: platformType as typeof platformTypeEnum.enumValues[number],
      platformSpecificId: platformSpecificId.trim(),
      accessToken: accessToken.trim(),
      refreshToken: refreshToken.trim() || null, // Handle optional refresh token
    };

    const response = await createChannel(channelData);
    if (response && !response.error) {
      router.push('/home'); // Navigate to a relevant page after creation, e.g., dashboard or channels list
    } else if (response.error) {
        setFormErrorStep2(response.error);
    }
  };

  const step1Image = "https://firebasestorage.googleapis.com/v0/b/console-assets.appspot.com/o/project_setup%2Fdesktop_create_project.png?alt=media&token=2f3c3690-5494-4bb6-8851-e699d033d02c"; // Placeholder
  const step2Image = "https://firebasestorage.googleapis.com/v0/b/oryzon-1556239798085.appspot.com/o/assets%2Fundraw_social_login_re_k29v.svg?alt=media&token=32d32141-2f77-44b3-8a0a-4bb94979aced"; // Placeholder


  return (
    <div className="flex min-h-screen bg-color-primary text-color-primary font-sans">
      {/* Left Panel */}
      <div className="w-full lg:w-3/5 p-8 sm:p-12 md:p-16 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-12 sm:mb-24">
          <CloseIcon onClick={() => router.push('/home')} />
          <h1 className="text-lg sm:text-xl">Connect a New Channel</h1>
        </div>

        {step === 1 && (
          <>
            {/* Main Content - Step 1 */}
            <div className="mb-8 flex-grow">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-9 sm:mb-6">
                Channel Details
              </h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="channelName" className="block text-sm font-medium text-color-secondary mb-1">Channel Name</label>
                  <input
                    id="channelName"
                    type="text"
                    placeholder="My Awesome Channel"
                    value={channelName}
                    onChange={(e) => {
                      setChannelName(e.target.value);
                      if (formErrorStep1) setFormErrorStep1('');
                    }}
                    className="w-full bg-transparent border-b border-color-light py-3 text-xl font-semibold placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-color-secondary mb-1">Description (Optional)</label>
                  <input
                    id="description"
                    type="text"
                    placeholder="Briefly describe your channel"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border-b border-color-light py-3 text-xl font-semibold placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="platformType" className="block text-sm font-medium text-color-secondary mb-1">Provider</label>
                  <select
                    id="platformType"
                    value={platformType}
                    onChange={(e) => {
                        setPlatformType(e.target.value);
                        if (formErrorStep1) setFormErrorStep1('');
                    }}
                    className="w-full bg-transparent border-b border-color-light py-3 text-xl font-semibold placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300 appearance-none"
                  >
                    {platformTypes.map((type) => (
                      <option key={type} value={type} className="bg-color-primary text-color-primary">
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                 <div>
                  <label htmlFor="platformSpecificId" className="block text-sm font-medium text-color-secondary mb-1">Platform Specific ID</label>
                  <input
                    id="platformSpecificId"
                    type="text"
                    placeholder="e.g., Page ID, Profile Handle"
                    value={platformSpecificId}
                    onChange={(e) => {
                        setPlatformSpecificId(e.target.value);
                        if (formErrorStep1) setFormErrorStep1('');
                    }}
                    className="w-full bg-transparent border-b border-color-light py-3 text-xl font-semibold placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
                  />
                </div>
              </div>
              {formErrorStep1 && <p className="text-xs sm:text-sm text-red-500 mt-4">{formErrorStep1}</p>}
            </div>
            {/* Footer - Step 1 */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-end mt-auto pt-8">
              <button
                onClick={handleStep1Continue}
             
                className="bg-color-accent bg-color-accent-hover text-color-accent-contrast py-3 px-8 rounded-md text-sm sm:text-base transition-colors duration-300 disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Main Content - Step 2 */}
            <div className="mb-8 flex-grow">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-2 sm:mb-4">
                Provider Authentication
              </h2>
              <p className="text-lg sm:text-xl text-color-secondary mb-6 sm:mb-8">
                Channel: <span className="font-semibold">{channelName}</span> ({platformType.replace(/_/g, ' ')})
              </p>

              <div className="space-y-6">
                <div>
                  <label htmlFor="accessToken" className="block text-sm font-medium text-color-secondary mb-1">Access Token</label>
                  <input
                    id="accessToken"
                    type="password" // Use password type for sensitive tokens
                    placeholder="Enter Access Token"
                    value={accessToken}
                    onChange={(e) => {
                        setAccessToken(e.target.value);
                        if (formErrorStep2) setFormErrorStep2('');
                    }}
                    className="w-full bg-transparent border-b border-color-light py-3 text-xl font-semibold placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
                  />
                </div>
                <div>
                  <label htmlFor="refreshToken" className="block text-sm font-medium text-color-secondary mb-1">Refresh Token (Optional)</label>
                  <input
                    id="refreshToken"
                    type="password" // Use password type for sensitive tokens
                    placeholder="Enter Refresh Token"
                    value={refreshToken}
                    onChange={(e) => setRefreshToken(e.target.value)}
                    className="w-full bg-transparent border-b border-color-light py-3 text-xl font-semibold placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
                  />
                </div>
              </div>
              {formErrorStep2 && <p className="text-xs sm:text-sm text-red-500 mt-4">{formErrorStep2}</p>}
              {channel_loading && <p className="text-sm text-color-muted mt-4 text-center">Connecting channel...</p>}
            </div>
            {/* Footer - Step 2 */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-auto pt-8">
              <button
                onClick={() => {
                  setStep(1);
                  setFormErrorStep2('');
                  cleanError_Channel();
                }}
                disabled={channel_loading}
                className="font-semibold text-sm text-color-link text-color-link-hover hover:underline disabled:opacity-50 mb-4 sm:mb-0"
              >
                Back
              </button>
              <button
                onClick={handleCreateChannel}
                disabled={channel_loading}
                className="bg-color-accent bg-color-accent-hover text-color-accent-contrast py-3 px-8 rounded-md text-sm sm:text-base transition-colors duration-300 disabled:opacity-50"
              >
                {channel_loading ? 'Connecting...' : 'Connect Channel'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right Panel (Image) */}
      <div className="hidden lg:flex w-2/5 items-center justify-center p-8 relative overflow-hidden bg-color-secondary-variant">
         <div className="z-10 text-center">
          <img
            src={step === 1 ? step1Image : step2Image}
            alt="Channel connection illustration"
            className="max-w-sm md:max-w-md lg:max-w-lg"
          />
        </div>
      </div>
    </div>
  );
};

export default NewChannelPage;
