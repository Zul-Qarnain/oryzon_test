"use client";

import React, { useEffect } from 'react';
import Header from '@/app/components/Header';
// import ChannelCard from '@/app/components/ChannelCard';
// import CreateChannelCard from '@/app/components/CreateChannelCard';
import BusinessCard from '@/app/components/BusinessCard';
import CreateBusinessCard from '@/app/components/CreateBusinessCard';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext'; // To ensure user is loaded
import { Loader2 } from 'lucide-react';

const HomePage: React.FC = () => {
  const { businesses, fetchBusinesses, businessLoading, businessError } = useBusinessContext();
  const { user, user_loading, FUser } = useUserContext(); // Access user and FUser

  useEffect(() => {
    // Fetch businesses only if a user is logged in (FUser exists)
    // and businesses haven't been fetched yet or need refreshing.
    if (FUser && businesses.length === 0) { // Basic condition, adjust as needed
      // Ensure the filter matches what your API expects for businesses
      // This might be user.userId or user.providerUserId
      fetchBusinesses({ filter: { providerUserId: FUser.uid} }); 
    }
  }, [FUser, user, fetchBusinesses, businesses.length]);


  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)]">
      <Header />
      <main className="p-4 md:p-8">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--text-page-heading)]">My Businesses</h2>
        
        {(user_loading || businessLoading) && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
            <p className="ml-4 text-lg">Loading businesses...</p>
          </div>
        )}

        {businessError && !businessLoading && (
          <div className="text-center text-[var(--text-error)] bg-[var(--bg-error-transparent)] p-4 rounded-md">
            Error loading businesses: {businessError}
          </div>
        )}

        {!user_loading && !businessLoading && !businessError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <CreateBusinessCard /> 
            {businesses.map((business) => (
              <BusinessCard key={business.businessId} business={business} />
            ))}
          </div>
        )}
         {!user_loading && !businessLoading && !businessError && businesses.length === 0 && (
          <div className="col-span-full text-center py-10">
            <p className="text-[var(--text-on-dark-muted)] text-lg">No businesses found. Get started by creating one!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
