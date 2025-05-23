"use client";

import React from 'react';
import Link from 'next/link';
import UserAvatar from './UserAvatar';
import NotificationIcon from './NotificationIcon';
import { Flame, Menu, X } from 'lucide-react'; // Added Menu, X

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  showToggleButton?: boolean; // To control visibility of the toggle button
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onToggleSidebar, showToggleButton }) => {
  return (
    <header className="flex items-center justify-between p-4 bg-[var(--bg-header)] text-[var(--text-on-dark-primary)] sticky top-0 z-50 h-[var(--header-height,64px)]">
      <div className="flex items-center space-x-2">
        {showToggleButton && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md md:hidden hover:bg-[var(--bg-accent)] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--color-accent-primary)]"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
        <Link href="/home" className="flex items-center space-x-2">
          <Flame size={28} className="text-[var(--color-accent-primary)]" />
          <h1 className="text-xl font-semibold">Oryza</h1>
        </Link>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationIcon count={3} /> {/* Example count */}
        <UserAvatar />
      </div>
    </header>
  );
};

export default Header;
