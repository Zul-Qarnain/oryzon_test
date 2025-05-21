"use client";

import React from 'react';
import Link from 'next/link';
import UserAvatar from './UserAvatar';
import NotificationIcon from './NotificationIcon';
import { Flame } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-[var(--bg-header)] text-[var(--text-on-dark-primary)] sticky top-0 z-50">
      <Link href="/home" className="flex items-center space-x-2">
        <Flame size={28} className="text-[var(--color-accent-primary)]" />
        <h1 className="text-xl font-semibold">Oryza</h1>
      </Link>
      <div className="flex items-center space-x-4">
        <NotificationIcon count={3} /> {/* Example count */}
        <UserAvatar />
      </div>
    </header>
  );
};

export default Header;
