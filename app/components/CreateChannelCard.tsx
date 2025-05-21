"use client";

import React from 'react';
import Link from 'next/link';
import { Flame, PlusCircle } from 'lucide-react';

const CreateChannelCard: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-red-500 to-violet-800 rounded-lg p-0.5 shadow-lg h-full flex flex-col justify-center items-center    hover:shadow-[var(--shadow-accent-primary-hover)] transition-shadow">
            <div className='w-full bg-[var(--bg-card)] rounded-lg p-6 shadow-lg h-full flex flex-col justify-between'>
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
        </div>
    );
};

export default CreateChannelCard;
