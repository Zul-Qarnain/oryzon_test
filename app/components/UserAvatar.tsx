"use client";

import React from 'react';
import { useUserContext } from '@/app/lib/context/UserContext';
import Image from 'next/image';
import { User as UserIcon } from 'lucide-react';

const UserAvatar: React.FC = () => {
  const { FUser } = useUserContext();

  if (FUser?.photoURL) {
    return (
      <img
        src={FUser.photoURL}
        alt={FUser.displayName || 'User Avatar'}
        width={32}
        height={32}
        className="rounded-full"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-[var(--bg-accent)] flex items-center justify-center text-[var(--text-on-dark-primary)]">
      <UserIcon size={20} />
    </div>
  );
};

export default UserAvatar;
