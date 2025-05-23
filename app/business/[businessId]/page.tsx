"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Added useRouter
import Link from 'next/link'; // Added Link
import Header from '@/app/components/Header';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, Briefcase, Info, Users, ShoppingBag, ShoppingCart, Settings, List, Package, RadioTower, LayoutDashboard } from 'lucide-react'; // Added more icons
import { BusinessWithRelations } from '@/backend/services/businesses/businesses.types';

const BusinessDetailPage: React.FC = () => {
  const router = useRouter(); // Added router
  const params = useParams();
  const businessId = params.businessId as string;
  const { business, fetchBusiness, businessLoading, businessError } = useBusinessContext();
  const { user, user_loading } = useUserContext();

  useEffect(() => {
    if (businessId && user) {
      // Optionally, include relations if needed, e.g., 'user,products,customers'
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

  const renderSection = (id: string, title: string, children: React.ReactNode) => (
    <div id={id} className="mb-8 p-4 bg-[var(--bg-secondary)] rounded-xl shadow-lg scroll-mt-20"> {/* Added scroll-mt-20 for fixed header offset */}
      <h3 className="text-xl font-semibold mb-4 text-[var(--text-page-heading)] border-b border-[var(--border-card-divider)] pb-2">{title}</h3>
      {children}
    </div>
  );

  const SidebarLink = ({ href, icon: Icon, label, currentSection }: { href: string, icon: React.ElementType, label: string, currentSection: string }) => (
    <Link href={href} scroll={false}>
      <div
        className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors duration-150
                    ${currentSection === href.substring(1) ? 'bg-[var(--color-accent-primary)] text-white' : 'hover:bg-[var(--bg-accent)] text-[var(--text-on-dark-secondary)] hover:text-[var(--text-on-dark-primary)]'}`}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
    </Link>
  );
  
  // For now, active section can be managed via URL hash or a more complex state if sections become separate views
  const [activeSection, setActiveSection] = useState('info'); // Default to 'info'

  useEffect(() => {
    const handleHashChange = () => {
      setActiveSection(window.location.hash.substring(1) || 'info');
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  const sidebarItems = [
    { id: 'info', label: 'Information', icon: LayoutDashboard, href: '#info' },
    { id: 'channels', label: 'Channels', icon: RadioTower, href: '#channels' },
    { id: 'products', label: 'Products', icon: Package, href: '#products' },
    { id: 'customers', label: 'Customers', icon: Users, href: '#customers' },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '#orders' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '#settings' }, // Placeholder for settings
  ];


  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)]">
      <Header />
      <div className="flex flex-col md:flex-row">
        {/* Sidebar */}
        {business && (
        <aside className="w-full md:w-64 bg-[var(--bg-secondary)] p-4 space-y-2 md:min-h-[calc(100vh-var(--header-height,64px))] md:sticky md:top-[var(--header-height,64px)] overflow-y-auto">
          {sidebarItems.map(item => (
            <SidebarLink key={item.id} href={item.href} icon={item.icon} label={item.label} currentSection={activeSection} />
          ))}
        </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {(user_loading || (businessLoading && !business)) && (
            <div className="flex flex-col justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
              <p className="ml-4 mt-4 text-lg text-[var(--text-on-dark-secondary)]">Loading business details...</p>
            </div>
          )}

          {businessError && !businessLoading && (
            <div className="text-center text-[var(--text-error)] bg-[var(--bg-error-transparent)] p-6 rounded-md shadow-md">
              <h2 className="text-2xl font-semibold mb-3">Error</h2>
              <p>Could not load business details: {businessError}</p>
            </div>
          )}

          {!user_loading && !businessLoading && business && (
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

              {renderSection("channels", "Connected Channels", (
                business.connectedChannels && business.connectedChannels.length > 0 ? (
                  <ul className="space-y-2">
                    {business.connectedChannels.map(channel => (
                      <li key={channel.channelId} className="p-3 bg-[var(--bg-badge)] rounded-md shadow text-sm">
                        <span className="font-medium text-[var(--text-on-dark-secondary)]">Channel ID: {channel.channelId}</span> ({channel.platformType})
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[var(--text-on-dark-muted)]">No connected channels.</p>
              ))}
              
              {renderSection("products", "Products", (
                business.products && business.products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {business.products.map(product => (
                    <div key={product.productId} className="p-4 bg-[var(--bg-badge)] rounded-lg shadow">
                      <ShoppingBag className="h-5 w-5 text-[var(--icon-accent-primary)] mb-2" />
                      <h4 className="font-semibold text-[var(--text-on-dark-primary)]">{product.name}</h4>
                      <p className="text-sm text-[var(--text-on-dark-muted)]">{product.description || 'No description'}</p>
                      <p className="text-sm text-[var(--text-on-dark-secondary)] mt-1">Price: ${product.price}</p>
                    </div>
                  ))}
                </div>
                ) : <p className="text-[var(--text-on-dark-muted)]">No products found.</p>
              ))}

              {renderSection("customers", "Customers", (
                business.customers && business.customers.length > 0 ? (
                 <ul className="space-y-2">
                  {business.customers.map(customer => (
                    <li key={customer.customerId} className="p-3 bg-[var(--bg-badge)] rounded-md shadow text-sm">
                      <span className="font-medium text-[var(--text-on-dark-secondary)]">{customer.fullName || 'Unnamed Customer'}</span> (ID: {customer.platformCustomerId || customer.customerId})
                    </li>
                  ))}
                </ul>
                ) : <p className="text-[var(--text-on-dark-muted)]">No customers found.</p>
              ))}
              
              {renderSection("orders", "Orders", (
                business.orders && business.orders.length > 0 ? (
                <ul className="space-y-2">
                  {business.orders.map(order => (
                    <li key={order.orderId} className="p-3 bg-[var(--bg-badge)] rounded-md shadow text-sm">
                      <ShoppingCart className="h-4 w-4 inline mr-2 text-[var(--icon-accent-primary)]" />
                      Order ID: {order.orderId} - Status: <span className="font-semibold">{order.orderStatus}</span> - Total: ${order.totalAmount}
                    </li>
                  ))}
                </ul>
                ) : <p className="text-[var(--text-on-dark-muted)]">No orders found.</p>
              ))}

              {/* Placeholder for Settings Section */}
              {renderSection("settings", "Settings", (
                <p className="text-[var(--text-on-dark-muted)]">Business settings will be managed here.</p>
              ))}

            </div>
          )}
           {!user_loading && !businessLoading && !business && !businessError && (
            <div className="text-center py-10">
              <p className="text-[var(--text-on-dark-muted)] text-lg">Business not found or you may not have access.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BusinessDetailPage;
