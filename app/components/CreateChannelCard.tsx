"use client";

import React from 'react';
import Link from 'next/link';
import { Flame, PlusCircle } from 'lucide-react';

const CreateChannelCard: React.FC = () => {
  return (
    <div className="bg-[var(--bg-card)] rounded-lg p-6 shadow-lg h-full flex flex-col justify-between border-2 border-[var(--border-card-accent)] hover:shadow-[var(--shadow-accent-primary-hover)] transition-shadow">
      <div>
        <div className="flex flex-col items-center text-center mb-4">
          <Flame size={48} className="text-[var(--icon-accent-primary)] mb-3" />
          <h2 className="text-xl font-semibold text-[var(--text-on-dark-primary)]">Create an Oryza Channel</h2>
        </div>
      </div>
      <Link
        href="/channels/new"
        className="block w-full mt-4 py-2 px-4 bg-[var(--bg-button-secondary)] hover:bg-[var(--bg-button-secondary-hover)] text-[var(--text-on-dark-primary)] text-center rounded-md transition-colors"
      >
        Add New Channel
      </Link>
    </div>
  );
};

export default CreateChannelCard;
