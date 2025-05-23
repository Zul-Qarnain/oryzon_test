"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { BusinessWithRelations } from '@/backend/services/businesses/businesses.types';
import { Briefcase, Users, ShoppingBag, MessageSquare, Settings } from 'lucide-react'; // Example icons

interface BusinessCardProps {
  business: BusinessWithRelations;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business }) => {
  const router = useRouter();

  const handleViewBusiness = () => {
    router.push(`/business/${business.businessId}`);
  };

  return (
    <div 
      onClick={handleViewBusiness}
      className="bg-[var(--bg-card)] rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out cursor-pointer overflow-hidden min-h-[180px] flex flex-col" // Ensure consistent height
    >
      <div className="p-5 flex-grow">
        <div className="flex items-center mb-3">
          <Briefcase className="h-6 w-6 text-[var(--icon-accent-primary)] mr-3" />
          <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] truncate" title={business.name}>
            {business.name}
          </h3>
        </div>
        {business.description && (
          <p className="text-sm text-[var(--text-on-dark-secondary)] mb-3 h-10 overflow-hidden text-ellipsis">
            {business.description}
          </p>
        )}
        {!business.description && (
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-3 h-10 italic">
            No description provided.
          </p>
        )}
        
        {/* Optional: Display some stats or quick info */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--text-on-dark-muted)]">
          {business.connectedChannels && (
            <div className="flex items-center">
              <MessageSquare size={14} className="mr-1.5" /> Channels: {business.connectedChannels.length}
            </div>
          )}
          {business.products && (
            <div className="flex items-center">
              <ShoppingBag size={14} className="mr-1.5" /> Products: {business.products.length}
            </div>
          )}
          {business.customers && (
            <div className="flex items-center">
              <Users size={14} className="mr-1.5" /> Customers: {business.customers.length}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-[var(--bg-card-footer)] p-3 border-t border-[var(--border-card)]">
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click event
            console.log(`Settings for ${business.name}`);
            // TODO: Navigate to business settings or open settings modal
          }}
          className="text-xs text-[var(--text-on-dark-secondary)] hover:text-[var(--text-accent-primary)] flex items-center"
        >
          <Settings size={14} className="mr-1.5" />
          Manage Business
        </button>
      </div>
    </div>
  );
};

export default BusinessCard;
