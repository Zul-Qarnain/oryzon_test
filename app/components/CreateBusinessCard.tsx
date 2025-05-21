"use client";

import React from 'react';
import { PlusCircle } from 'lucide-react';
// import Link from 'next/link'; // If you have a dedicated page for creating businesses

const CreateBusinessCard: React.FC = () => {
  // TODO: Implement navigation to a create business page or open a modal
  const handleCreateBusiness = () => {
    // For now, log to console. Replace with actual navigation or modal logic.
    console.log("Navigate to create business page or open modal.");
    // Example using Link (if you have a route like /businesses/new):
    // router.push('/businesses/new'); 
  };

  return (
    <button
      onClick={handleCreateBusiness}
      className="flex flex-col items-center justify-center p-6 bg-[var(--bg-card)] rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer border-2 border-dashed border-[var(--border-card-hover)] hover:border-[var(--border-accent-primary)] min-h-[180px]" // Ensure consistent height with BusinessCard
    >
      <PlusCircle className="h-12 w-12 text-[var(--icon-accent-primary)] mb-3" />
      <span className="text-lg font-semibold text-[var(--text-on-dark-primary)]">Create New Business</span>
      <p className="text-sm text-[var(--text-on-dark-secondary)] mt-1">Add and set up a new business</p>
    </button>
  );
};

export default CreateBusinessCard;
