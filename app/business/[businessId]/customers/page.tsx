"use client";

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCustomerContext } from '@/app/lib/context/CustomerContext';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, Users, AlertCircle, Eye } from 'lucide-react'; // Using Users icon
import { CustomerWithIncludes } from '@/backend/services/customers/customers.types';

const BusinessCustomersListPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { user, user_loading } = useUserContext();
  const { 
    customers, 
    fetchCustomers, 
    customer_loading, 
    error_customer 
  } = useCustomerContext();
  const { 
    business, 
    fetchBusiness, 
    businessLoading, 
    businessError 
  } = useBusinessContext();

  useEffect(() => {
    if (businessId && user) {
      fetchBusiness(businessId); // Fetch business details for context
      fetchCustomers({ filter: { businessId }, include: 'userViaProviderId' }); // Fetch customers for this business, including user details
    }
  }, [businessId, user, fetchBusiness, fetchCustomers]);

  const CustomerCard: React.FC<{ customer: CustomerWithIncludes }> = ({ customer }) => {
    return (
      <div className="bg-[var(--bg-card)] p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out flex flex-col justify-between">
        <div>
          <div className="flex items-center mb-3">
            <Users className="h-7 w-7 text-[var(--icon-accent-primary)] mr-3" />
            <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] truncate" title={customer.fullName || `Customer ID: ${customer.customerId}`}>
              {customer.fullName || `Customer ${customer.customerId.substring(0,8)}...`}
            </h3>
          </div>
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
            Email: <span className="font-medium text-[var(--text-on-dark-secondary)]">{customer.userViaProviderId?.email || 'N/A'}</span>
          </p>
          <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
            Platform ID: <span className="font-medium text-[var(--text-on-dark-secondary)]">{customer.platformCustomerId || 'N/A'}</span>
          </p>
          {customer.userViaProviderId?.phone && (
            <p className="text-sm text-[var(--text-on-dark-muted)] mb-1">
              Phone: <span className="font-medium text-[var(--text-on-dark-secondary)]">{customer.userViaProviderId.phone}</span>
            </p>
          )}
        </div>
        <div className="flex justify-end space-x-2 mt-auto pt-3 border-t border-[var(--border-light)]">
          <button
              onClick={() => router.push(`/business/${businessId}/customers/${customer.customerId}`)} // Assuming a future detail page
              className="p-2 text-xs bg-[var(--bg-accent)] hover:bg-[var(--bg-accent-hover)] text-[var(--text-on-dark-secondary)] rounded-md transition-colors flex items-center"
              title="View Customer Details"
          >
              <Eye size={14} className="mr-1" /> View
          </button>
        </div>
      </div>
    );
  };

  if (user_loading || (businessLoading && !business) || (customer_loading && customers.length === 0 && !error_customer && !businessError)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading customers...</p>
      </div>
    );
  }

  if (!user && !user_loading) {
    router.push('/user/signIn');
    return null;
  }
  
  if (businessError) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-[var(--text-error)] mb-4" />
        <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Business</h2>
        <p className="text-center text-[var(--text-on-dark-muted)]">{businessError}</p>
        <Link href="/home" className="mt-6 px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-page-heading)]">
            Customers for {business?.name || 'Business'}
          </h2>
          <p className="text-[var(--text-on-dark-muted)] mt-1">View all your customers.</p>
        </div>
        {/* Add New Customer button removed as per "only for viewing customers" requirement */}
      </div>

      {customer_loading && !error_customer && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--icon-accent-primary)]" />
          <p className="ml-3 text-[var(--text-on-dark-secondary)]">Fetching customers...</p>
        </div>
      )}

      {error_customer && (
        <div className="my-6 p-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-md flex items-center">
          <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Failed to load customers</h4>
            <p className="text-sm">{error_customer}</p>
          </div>
        </div>
      )}

      {!customer_loading && !error_customer && customers.length === 0 && (
        <div className="text-center py-12 bg-[var(--bg-secondary)] rounded-lg shadow">
          <Users className="h-16 w-16 text-[var(--icon-accent-primary)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-[var(--text-on-dark-primary)] mb-2">No Customers Found</h3>
          <p className="text-[var(--text-on-dark-muted)] mb-6">
            This business does not have any customers yet.
          </p>
        </div>
      )}

      {!customer_loading && !error_customer && customers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {customers.map(customer => (
            <CustomerCard key={customer.customerId} customer={customer} />
          ))}
        </div>
      )}
    </>
  );
};

export default BusinessCustomersListPage;
