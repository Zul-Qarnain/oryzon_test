import React from 'react';
import CloseIcon from '@/components/CloseIcon';

const NewProjectPage = () => {
  return (
    <div className="flex min-h-screen bg-[#1E1E1E] text-white font-sans">
      {/* Left Panel */}
      <div className="w-full lg:w-3/5 p-8 sm:p-12 md:p-16 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center space-x-3 mb-16 sm:mb-24">
            <CloseIcon />
            <h1 className="text-lg sm:text-xl">Create a project</h1>
          </div>

          {/* Main Content */}
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-1 sm:mb-2">
              Let&apos;s start with a name for
            </h2>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium mb-10 sm:mb-12">
              your project<sup>®</sup>
            </h2>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Enter your project name"
                className="w-full bg-transparent border-b border-gray-600 py-3 text-xl sm:text-2xl placeholder-gray-500 focus:outline-none focus:border-gray-400 transition-colors duration-300"
              />
            </div>
            <p className="text-xs sm:text-sm text-gray-400 bg-gray-700 px-3 py-1 inline-block rounded-full">
              my-awesome-project-id
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mt-auto">
          <div className="mb-6 sm:mb-0">
            <p className="text-xs sm:text-sm mb-1 text-gray-300">Already have a Google Cloud project?</p>
            <a href="#" className="text-xs sm:text-sm text-blue-400 hover:text-blue-300 hover:underline">
              Add Firebase to Google Cloud project
            </a>
          </div>
          <button className="bg-[#333333] hover:bg-[#444444] text-gray-200 py-3 px-8 rounded-md text-sm sm:text-base transition-colors duration-300">
            Continue
          </button>
        </div>
      </div>

      {/* Right Panel (Image) */}
      <div className="hidden lg:flex w-2/5 items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative background elements (optional) */}
        <svg width="300" height="300" viewBox="0 0 200 200" className="absolute text-gray-700 opacity-10 transform rotate-45 -translate-x-1/4 -translate-y-1/4" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M161.803 125L100 159.282L38.1966 125L38.1966 56.4359L100 22.1539L161.803 56.4359L161.803 125Z" stroke="currentColor" strokeWidth="2"/>
          <path d="M100 159.282V22.1539" stroke="currentColor" strokeWidth="2"/>
          <path d="M38.1966 56.4359L100 90.7179L161.803 56.4359" stroke="currentColor" strokeWidth="2"/>
          <path d="M38.1966 125L100 90.7179" stroke="currentColor" strokeWidth="2"/>
        </svg>
         <svg width="250" height="250" viewBox="0 0 200 200" className="absolute text-gray-600 opacity-10 bottom-10 right-10 transform -rotate-12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M173.205 150L100 100L173.205 50L100 0L26.7949 50L100 100L26.7949 150L100 200L173.205 150Z" stroke="currentColor" strokeWidth="2"/>
        </svg>

        <div className="z-10 text-center">
          {/* Replace with your actual image component or <img> tag */}
          {/* Example placeholder image: */}
          <img 
            src="https://firebasestorage.googleapis.com/v0/b/console-assets.appspot.com/o/project_setup%2Fdesktop_create_project.png?alt=media&token=2f3c3690-5494-4bb6-8851-e699d033d02c" 
            alt="Project illustration" 
            className="max-w-sm md:max-w-md lg:max-w-lg" 
          />
        </div>
      </div>
    </div>
  );
};

export default NewProjectPage;
