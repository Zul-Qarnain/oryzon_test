"use client";

import React from 'react';
import { ConnectedChannelWithIncludes } from '@/backend/services/channels/channels.types';
import { Facebook, Instagram, Linkedin, Twitter, Code2 } from 'lucide-react';

interface ChannelCardProps {
  channel: ConnectedChannelWithIncludes;
}

const PlatformIcon: React.FC<{ type: ConnectedChannelWithIncludes['platformType'], size?: number }> = ({ type, size = 24 }) => {
  switch (type) {
    case 'FACEBOOK_PAGE':
      return <Facebook size={size} className="text-[var(--icon-platform-facebook)]" />;
    case 'INSTAGRAM_BUSINESS':
      return <Instagram size={size} className="text-[var(--icon-platform-instagram)]" />;
    case 'LINKEDIN_PAGE':
      return <Linkedin size={size} className="text-[var(--icon-platform-linkedin)]" />;
    case 'TWITTER_PROFILE':
      return <Twitter size={size} className="text-[var(--icon-platform-twitter)]" />;
    default:
      return <Code2 size={size} className="text-[var(--icon-platform-default)]" />;
  }
};

const ChannelCard: React.FC<ChannelCardProps> = ({ channel }) => {
  return (
    <div className="bg-[var(--bg-card)] rounded-lg p-6 shadow-lg h-full flex flex-col justify-between hover:bg-[var(--bg-card-hover)] transition-colors">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-on-dark-primary)] mb-1 truncate" title={channel.channelName || 'Unnamed Channel'}>
          {channel.channelName || 'Unnamed Channel'}
        </h3>
        <p className="text-xs text-[var(--text-on-dark-muted)] mb-3 truncate" title={channel.channelId}>
          ID: {channel.channelId.substring(0, 12)}...
        </p>
        {channel.description && (
           <p className="text-sm text-[var(--text-on-dark-secondary)] mb-3 text-ellipsis overflow-hidden h-10">
             {channel.description}
           </p>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--border-card-divider)]">
        <PlatformIcon type={channel.platformType} />
        <Code2 size={20} className="text-[var(--icon-platform-default)]" />
      </div>
    </div>
  );
};

export default ChannelCard;
