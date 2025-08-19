"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CloseIcon from '@/components/CloseIcon';
import { useUserContext } from '@/app/lib/context/UserContext';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import Image from 'next/image';

const NewProjectPage = () => {
  const [step, setStep] = useState(1);
  const [inputProjectName, setInputProjectName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [formError, setFormError] = useState('');
  const router = useRouter();

  const { signUpWithGoogle, signUpWithFacebook, user_loading, error_user } = useUserContext();

  const handleContinue = () => {
    if (!inputProjectName.trim()) {
      setFormError('Project name cannot be empty.');
      return;
    }
    setFormError('');
    setProjectName(inputProjectName.trim());
    setStep(2);
  };

  const handleGoogleSignUp = async () => {
    if (!projectName) return;
    await signUpWithGoogle();
    if (!error_user) { // Check if there was no error during sign-up
      router.push('/');
    }
  };

  const handleFacebookSignUp = async () => {
    if (!projectName) return;
    await signUpWithFacebook();
    if (!error_user) { // Check if there was no error during sign-up
      router.push('/');
    }
  };

  const step1Image = "https://firebasestorage.googleapis.com/v0/b/console-assets.appspot.com/o/project_setup%2Fdesktop_create_project.png?alt=media&token=2f3c3690-5494-4bb6-8851-e699d033d02c";
  const step2Image = "https://firebasestorage.googleapis.com/v0/b/oryzon-1556239798085.appspot.com/o/assets%2Fundraw_social_login_re_k29v.svg?alt=media&token=32d32141-2f77-44b3-8a0a-4bb94979aced";

  return (
    <div className="flex min-h-screen bg-color-primary text-color-primary font-sans">
      {/* Left Panel */}
      <div className="w-full lg:w-3/5 p-8 sm:p-12 md:p-16 flex flex-col justify-between">
      
          {/* Header */}
          <div className="flex items-center space-x-3 mb-12 sm:mb-24">
            <CloseIcon />
            <h1 className="text-lg sm:text-xl">Create a project</h1>
          </div>

          {step === 1 && (
            <>
              {/* Main Content - Step 1 */}
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-9 sm:mb-2">
                  Let&apos;s start with a name for your 
                  project<sup>®</sup>
                </h2>

                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Project name"
                    value={inputProjectName}
                    onChange={(e) => {
                      setInputProjectName(e.target.value);
                      if (formError) setFormError('');
                    }}
                    className="w-full bg-transparent border-b border-color-light py-3 text-3xl font-semibold sm:text-2xl placeholder-color-muted placeholder:text-3xl  focus:outline-none focus-border-color-focus transition-colors duration-300"
                  />
                </div>
                {formError && <p className="text-xs sm:text-sm text-red-500 mb-2">{formError}</p>}
                <p className="text-xs sm:text-sm text-color-muted bg-color-badge px-3 py-1 inline-block rounded-full">
                  {inputProjectName.trim().toLowerCase().replace(/\s+/g, '-') || 'my-awesome-project-id'}
                </p>
              </div>
               {/* Footer - Step 1 */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-auto mb-[20%] sm:mb-[0%]">
                <div className="mb-6 sm:mb-0">
                  <p className="text-sm font-semibold mb-1 text-color-secondary">Already have a Oryza<sup>®</sup> account?</p>
                  <a href="#" className="text-sm font-semibold text-color-link text-color-link-hover hover:underline">
                    Sign in
                  </a>
                </div>
                <button 
                  onClick={handleContinue}
                  className="bg-color-secondary bg-color-secondary-hover text-color-secondary py-3 px-8 rounded-md text-sm sm:text-base transition-colors duration-300"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Main Content - Step 2 */}
              <div className="mb-8">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-2 sm:mb-4">
                  Sign up to create your project
                </h2>
                <p className="text-lg sm:text-xl text-color-secondary mb-6 sm:mb-8">
                  Project: <span className="font-semibold">{projectName}</span>
                </p>

                <div className="space-y-4">
                  <button
                    onClick={handleGoogleSignUp}
                    disabled={user_loading}
                    className="w-full flex items-center justify-center bg-color-secondary bg-color-secondary-hover text-color-secondary py-3 px-6 rounded-md text-sm sm:text-base transition-colors duration-300 disabled:opacity-50"
                  >
                    <FcGoogle className="mr-3 text-xl" />
                    Sign up with Google
                  </button>
                  <button
                    onClick={handleFacebookSignUp}
                    disabled={user_loading}
                    className="w-full flex items-center justify-center bg-color-secondary bg-color-secondary-hover text-color-secondary py-3 px-6 rounded-md text-sm sm:text-base transition-colors duration-300 disabled:opacity-50"
                  >
                    <FaFacebook className="mr-3 text-xl text-[#1877F2]" />
                    Sign up with Facebook
                  </button>
                </div>
                {user_loading && <p className="text-sm text-color-muted mt-4 text-center">Processing...</p>}
                {error_user && <p className="text-sm text-red-500 mt-4 text-center">{error_user}</p>}
              </div>
              {/* Footer - Step 2 */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-auto mb-[20%] sm:mb-[0%]">
                <button
                  onClick={() => {
                    setStep(1);
                  }}
                  disabled={user_loading}
                  className="font-semibold text-sm text-color-link text-color-link-hover hover:underline disabled:opacity-50"
                >
                  Back
                </button>
              </div>
            </>
          )}
       
      </div>

      {/* Right Panel (Image) */}
      <div className="hidden lg:flex w-2/5 items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative background elements (optional) */}
        <svg width="300" height="300" viewBox="0 0 200 200" className="absolute text-color-muted opacity-10 transform rotate-45 -translate-x-1/4 -translate-y-1/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M161.803 125L100 159.282L38.1966 125L38.1966 56.4359L100 22.1539L161.803 56.4359L161.803 125Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M100 159.282V22.1539" stroke="currentColor" strokeWidth="2"/>
          <path d="M38.1966 56.4359L100 90.7179L161.803 56.4359" stroke="currentColor" strokeWidth="2"/>
          <path d="M38.1966 125L100 90.7179" stroke="currentColor" strokeWidth="2"/>
        </svg>
         <svg width="250" height="250" viewBox="0 0 200 200" className="absolute text-color-muted opacity-10 bottom-10 right-10 transform -rotate-12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M173.205 150L100 100L173.205 50L100 0L26.7949 50L100 100L26.7949 150L100 200L173.205 150Z" stroke="currentColor" strokeWidth="2"/>
        </svg>

        <div className="z-10 text-center">
          <Image 
            src={step === 1 ? step1Image : step2Image} 
            alt="Project illustration" 
            className="max-w-sm md:max-w-md lg:max-w-lg"
            width={500}
            height={500}
          />
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;
