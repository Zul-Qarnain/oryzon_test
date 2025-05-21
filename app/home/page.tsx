"use client";

import React, { useEffect } from 'react';
import Header from '@/app/components/Header';
import ChannelCard from '@/app/components/ChannelCard';
import CreateChannelCard from '@/app/components/CreateChannelCard';
import { useChannelContext } from '@/app/lib/context/ChannelContext';
import { useUserContext } from '@/app/lib/context/UserContext'; // To ensure user is loaded
import { Loader2 } from 'lucide-react';

const HomePage: React.FC = () => {
  const { channels, fetchChannels, channel_loading, error_channel } = useChannelContext();
  const { user, user_loading, FUser } = useUserContext(); // Access user and FUser

  useEffect(() => {
    // Fetch channels only if a user is logged in (FUser exists)
    // and channels haven't been fetched yet or need refreshing.
    if (FUser && channels.length === 0) { // Basic condition, adjust as needed
      fetchChannels({ filter: { providerUserId: user?.providerUserId } }); // Assuming user object has providerUserId
    }
  }, [FUser, user, fetchChannels, channels.length]);


  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)]">
      <Header />
      <main className="p-4 md:p-8">
        <h2 className="text-2xl font-semibold mb-6 text-[var(--text-page-heading)]">Connected Channels</h2>
        
        {(user_loading || channel_loading) && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
            <p className="ml-4 text-lg">Loading channels...</p>
          </div>
        )}

        {error_channel && !channel_loading && (
          <div className="text-center text-[var(--text-error)] bg-[var(--bg-error-transparent)] p-4 rounded-md">
            Error loading channels: {error_channel}
          </div>
        )}

        {!user_loading && !channel_loading && !error_channel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <CreateChannelCard />
            {channels.map((channel) => (
              <ChannelCard key={channel.channelId} channel={channel} />
            ))}
          </div>
        )}
         {!user_loading && !channel_loading && !error_channel && channels.length === 0 && (
          <div className="col-span-full text-center py-10">
            <p className="text-[var(--text-on-dark-muted)] text-lg">No channels found. Get started by creating one!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
