"use client";

import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationIconProps {
  count?: number;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({ count }) => {
  return (
    <div className="relative text-[var(--icon-color-default)] hover:text-[var(--icon-color-hover)]">
      <Bell size={24} />
      {count && count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--bg-notification-badge)] text-xs text-[var(--text-on-notification-badge)]">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationIcon;
