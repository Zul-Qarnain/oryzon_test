"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CloseIcon from '@/components/CloseIcon';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import Image from 'next/image';

const NewBusinessPage = () => {
  const router = useRouter();
  const { user, FUser } = useUserContext(); // FUser might be needed for providerUserId
  const { createBusiness, businessLoading, businessError, cleanErrorBusiness } = useBusinessContext();

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (businessError) {
      setFormError(businessError);
    }
  }, [businessError]);

  const handleCreateBusiness = async () => {
    cleanErrorBusiness();
    if (!user) {
      setFormError('User not authenticated. Please sign in.');
      return;
    }
    if (!businessName.trim()) {
      setFormError('Business name cannot be empty.');
      return;
    }
    setFormError('');

    const businessData = {
      userId: user.userId, // Assuming user.userId is the correct internal ID
      providerUserId: FUser?.uid || null, // Optional: if your backend uses Firebase UID
      name: businessName.trim(),
      description: description.trim() || null,
    };

    const response = await createBusiness(businessData);
    if (response && !response.error) {
      router.push('/home'); // Navigate to a relevant page after creation
    } else if (response.error) {
      setFormError(response.error);
    }
  };

  const pageImage = "https://firebasestorage.googleapis.com/v0/b/console-assets.appspot.com/o/project_setup%2Fdesktop_create_project.png?alt=media&token=2f3c3690-5494-4bb6-8851-e699d033d02c"; // Placeholder image

  return (
    <div className="flex min-h-screen bg-color-primary text-color-primary font-sans">
      {/* Left Panel */}
      <div className="w-full lg:w-3/5 p-8 sm:p-12 md:p-16 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-12 sm:mb-24">
          <CloseIcon onClick={() => router.push('/home')} />
          <h1 className="text-lg sm:text-xl">Create a New Business</h1>
        </div>

        {/* Main Content */}
        <div className="mb-8 flex-grow">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-9 sm:mb-6">
            Business Details
          </h2>

          <div className="space-y-6">
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-color-secondary mb-1">Business Name</label>
              <input
                id="businessName"
                type="text"
                placeholder="My Awesome Business"
                value={businessName}
                onChange={(e) => {
                  setBusinessName(e.target.value);
                  if (formError) cleanErrorBusiness(); setFormError('');
                }}
                className="w-full bg-transparent border-b border-color-light py-3 text-xl font-semibold placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-color-secondary mb-1">Description (Optional)</label>
              <input
                id="description"
                type="text"
                placeholder="Briefly describe your business"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b border-color-light py-3 text-xl font-semibold placeholder-color-muted focus:outline-none focus-border-color-focus transition-colors duration-300"
              />
            </div>
          </div>
          {formError && <p className="text-xs sm:text-sm text-red-500 mt-4">{formError}</p>}
          {businessLoading && <p className="text-sm text-color-muted mt-4 text-center">Creating business...</p>}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-end mt-auto pt-8 mb-[20%]">
          <button
            onClick={handleCreateBusiness}
            className="bg-color-accent bg-color-accent-hover text-color-accent-contrast py-3 px-8 rounded-md text-sm sm:text-base transition-colors duration-300 "
          >
            {businessLoading ? 'Creating...' : 'Create Business'}
          </button>
        </div>
      </div>

      {/* Right Panel (Image) */}
      <div className="hidden lg:flex w-2/5 items-center justify-center p-8 relative overflow-hidden bg-color-secondary-variant">
         <div className="z-10 text-center">
          <Image
            src={pageImage}
            alt="Business creation illustration"
            className="max-w-sm md:max-w-md lg:max-w-lg"
            width={500}
            height={500}
          />
        </div>
      </div>
    </div>
  );
};

export default NewBusinessPage;
