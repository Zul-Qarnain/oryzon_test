"use client";

import React, { useEffect } from 'react'; // Removed useState as activeSection and mobileSidebarOpen are in layout
import { useParams, usePathname } from 'next/navigation'; // Removed useRouter as it might not be needed directly
import Link from 'next/link';
// Header component is removed as it's in layout.tsx
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, Briefcase, Info, Users, ShoppingBag, ShoppingCart, ExternalLink } from 'lucide-react'; // Removed icons only used in sidebar
import { BusinessWithRelations } from '@/backend/services/businesses/businesses.types';

const BusinessDetailPageContent: React.FC = () => {
  // const router = useRouter(); // Keep if navigation from this page content is needed
  const params = useParams();
  const businessId = params.businessId as string;
  const { business, fetchBusiness, businessLoading, businessError } = useBusinessContext();
  const { user, user_loading } = useUserContext();
  const pathname = usePathname(); // To ensure sections only render on the main page path

  useEffect(() => {
    if (businessId && user) {
      // Fetch all necessary relations for the main detail page, including channel count for summary
      fetchBusiness(businessId, { include: 'user,products,customers,orders,connectedChannels' });
    }
  }, [businessId, user, fetchBusiness]);

  const renderDetailItem = (IconComponent: React.ElementType, label: string, value: string | number | undefined | null) => (
    <div className="flex items-center space-x-3 p-3 bg-[var(--bg-card)] rounded-lg shadow">
      <IconComponent className="h-6 w-6 text-[var(--icon-accent-primary)]" />
      <div>
        <p className="text-sm text-[var(--text-on-dark-muted)]">{label}</p>
        <p className="text-md font-semibold text-[var(--text-on-dark-primary)]">{value || 'N/A'}</p>
      </div>
    </div>
  );

  const renderSection = (id: string, title: string, children: React.ReactNode, showAddBtn?: boolean, addHref?: string, showViewAllBtn?: boolean, viewAllHref?: string, viewAllText?: string) => (
    <div id={id} className="mb-8 p-4 bg-[var(--bg-secondary)] rounded-xl shadow-lg scroll-mt-20"> {/* scroll-mt might be less relevant if not scrolling within page */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-[var(--text-page-heading)] border-b border-[var(--border-card-divider)] pb-2">{title}</h3>
        <div className="flex items-center">
          {showViewAllBtn && viewAllHref && (
            <Link
              href={viewAllHref}
              className="mr-2 px-3 py-1.5 text-xs rounded-md bg-[var(--bg-accent)] text-[var(--text-on-dark-secondary)] hover:bg-[var(--bg-accent-hover)] hover:text-[var(--text-on-dark-primary)] transition-colors flex items-center"
              title={`View all ${title.toLowerCase()}`}
            >
              {viewAllText || "View All"} <ExternalLink size={14} className="ml-1.5" />
            </Link>
          )}
          {showAddBtn && addHref && (
            <Link
              href={addHref}
              className="p-2 rounded-full bg-[var(--color-accent-primary)] text-white hover:bg-[var(--color-accent-primary-glow)] transition-colors"
              title={`Add new ${title.toLowerCase().replace(/s$/, "")}`}
            >
              <span className="sr-only">{`Add new ${title.toLowerCase().replace(/s$/, "")}`}</span>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5"/>
              </svg>
            </Link>
          )}
        </div>
      </div>
      {children}
    </div>
  );

  // SidebarLink and sidebarItems are removed as they are in layout.tsx
  // useEffect for activeSection based on hash/path is removed as it's in layout.tsx

  // This page now only renders its specific content. The Header and Sidebar are in layout.tsx.
  // The main wrapper div and flex structure are also in layout.tsx.
  
  if (user_loading || (businessLoading && !business)) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="ml-4 mt-4 text-lg text-[var(--text-on-dark-secondary)]">Loading business details...</p>
      </div>
    );
  }

  if (businessError && !businessLoading) {
    return (
      <div className="text-center text-[var(--text-error)] bg-[var(--bg-error-transparent)] p-6 rounded-md shadow-md">
        <h2 className="text-2xl font-semibold mb-3">Error</h2>
        <p>Could not load business details: {businessError}</p>
      </div>
    );
  }
  
  // Conditional rendering to ensure sections only appear on the main business detail page path
  // and not on sub-pages like /settings or /channels if they were to be rendered as children of this page
  // (though with the new layout, this page itself is a child).
  if (pathname !== `/business/${businessId}`) {
    // This page's content is specifically for the main /business/[businessId] path.
    // Other paths like /business/[businessId]/settings will render their own page.tsx content via the layout.
    // Returning null or a placeholder if this component is somehow rendered on an unexpected path.
    return null; 
  }

  if (!user_loading && !businessLoading && business) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 p-6 bg-[var(--bg-card)] rounded-xl shadow-xl border-l-4 border-[var(--border-card-accent)]">
          <div className="flex items-center space-x-4">
            <Briefcase className="h-12 w-12 text-[var(--color-accent-primary)]" />
            <div>
              <h2 className="text-3xl font-bold text-[var(--text-on-dark-primary)]">{business.name}</h2>
              <p className="text-md text-[var(--text-on-dark-muted)]">{business.description || 'No description available.'}</p>
            </div>
          </div>
        </div>

        {renderSection("info", "Business Information", (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderDetailItem(Info, "Business ID", business.businessId)}
            {renderDetailItem(Info, "Created At", new Date(business.createdAt).toLocaleDateString())}
            {renderDetailItem(Info, "Updated At", new Date(business.updatedAt).toLocaleDateString())}
            {business.user && renderDetailItem(Users, "Owner Name", business.user.name || business.user.email)}
            {business.user && renderDetailItem(Info, "Owner Email", business.user.email)}
          </div>
        ))}
        
        {renderSection(
          "channels-summary",
          "Connected Channels",
          <>
            <p className="text-[var(--text-on-dark-muted)] mb-3">
              View and manage all connected channels on the dedicated channels page.
            </p>
            {(business.connectedChannels && business.connectedChannels.length > 0) ? (
               <p className="text-sm text-[var(--text-on-dark-secondary)]">
                  Currently <span className="font-semibold">{business.connectedChannels.length}</span> channel(s) connected.
               </p>
            ) : (
               <p className="text-sm text-[var(--text-on-dark-muted)]">No channels connected yet.</p>
            )}
          </>,
          true, 
          `/business/${businessId}/channel/new`,
          true, 
          `/business/${businessId}/channels`,
          "Manage Channels"
        )}

        {renderSection(
          "products",
          "Products",
          business.products && business.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {business.products.slice(0,3).map(product => ( 
                <div key={product.productId} className="p-4 bg-[var(--bg-badge)] rounded-lg shadow">
                  <ShoppingBag className="h-5 w-5 text-[var(--icon-accent-primary)] mb-2" />
                  <h4 className="font-semibold text-[var(--text-on-dark-primary)]">{product.name}</h4>
                  <p className="text-sm text-[var(--text-on-dark-muted)] truncate">{product.description || 'No description'}</p>
                  <p className="text-sm text-[var(--text-on-dark-secondary)] mt-1">Price: ${product.price}</p>
                </div>
              ))}
              {business.products.length > 3 && <p className="text-sm text-center col-span-full mt-2 text-[var(--text-on-dark-muted)]">And {business.products.length - 3} more...</p>}
            </div>
          ) : <p className="text-[var(--text-on-dark-muted)]">No products found.</p>,
          true,
          `/business/${businessId}/product/new`
        )}

        {renderSection(
          "customers",
          "Customers",
          business.customers && business.customers.length > 0 ? (
            <ul className="space-y-2">
              {business.customers.slice(0,3).map(customer => (
                <li key={customer.customerId} className="p-3 bg-[var(--bg-badge)] rounded-md shadow text-sm">
                  <span className="font-medium text-[var(--text-on-dark-secondary)]">{customer.fullName || 'Unnamed Customer'}</span> (ID: {customer.platformCustomerId || customer.customerId})
                </li>
              ))}
               {business.customers.length > 3 && <p className="text-sm text-center mt-2 text-[var(--text-on-dark-muted)]">And {business.customers.length - 3} more...</p>}
            </ul>
          ) : <p className="text-[var(--text-on-dark-muted)]">No customers found.</p>,
          true,
          `/business/${businessId}/customer/new`
        )}

        {renderSection(
          "orders",
          "Orders",
          business.orders && business.orders.length > 0 ? (
            <ul className="space-y-2">
              {business.orders.slice(0,3).map(order => ( 
                <li key={order.orderId} className="p-3 bg-[var(--bg-badge)] rounded-md shadow text-sm">
                  <ShoppingCart className="h-4 w-4 inline mr-2 text-[var(--icon-accent-primary)]" />
                  Order ID: {order.orderId} - Status: <span className="font-semibold">{order.orderStatus}</span> - Total: ${order.totalAmount}
                </li>
              ))}
              {business.orders.length > 3 && <p className="text-sm text-center mt-2 text-[var(--text-on-dark-muted)]">And {business.orders.length - 3} more...</p>}
            </ul>
          ) : <p className="text-[var(--text-on-dark-muted)]">No orders found.</p>,
          true,
          `/business/${businessId}/order/new`
        )}
      </div>
    );
  }

  // Fallback for when business is not found but no error and not loading
  if (!user_loading && !businessLoading && !business && !businessError) {
    return (
      <div className="text-center py-10">
        <p className="text-[var(--text-on-dark-muted)] text-lg">Business not found or you may not have access.</p>
      </div>
    );
  }

  return null; // Should be covered by loading/error/content states
};

export default BusinessDetailPageContent; // Renamed component
