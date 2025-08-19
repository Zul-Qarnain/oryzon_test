"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useUserContext } from '@/app/lib/context/UserContext';
import Image from 'next/image';
import { User as UserIcon, LogOut } from 'lucide-react'; // Added LogOut

const UserAvatar: React.FC = () => {
  const { FUser, logoutUser } = useUserContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = async () => {
    await logoutUser();
    setIsDropdownOpen(false); // Close dropdown after logout
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="focus:outline-none">
        {FUser?.photoURL ? (
          <Image
            src={FUser.photoURL}
            alt={FUser.displayName || 'User Avatar'}
            width={32}
            height={32}
            className="rounded-full cursor-pointer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--bg-accent)] flex items-center justify-center text-[var(--text-on-dark-primary)] cursor-pointer">
            <UserIcon size={20} />
          </div>
        )}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-accent)] rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus:outline-none"
          >
            <LogOut size={16} className="mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
