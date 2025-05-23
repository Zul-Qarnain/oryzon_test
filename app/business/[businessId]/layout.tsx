"use client";

import React, { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, Settings, Package, RadioTower, LayoutDashboard, Users, ShoppingCart, Briefcase, PlusCircle } from 'lucide-react';

// SidebarLink component definition
const SidebarLink = ({ 
  id, 
  href, 
  icon: Icon, 
  label, 
  activeSectionId, 
  isPageLink,
  onClick 
}: { 
  id: string, 
  href: string, 
  icon: React.ElementType, 
  label: string, 
  activeSectionId: string, 
  isPageLink?: boolean,
  onClick?: () => void;
}) => {
  const isActive = activeSectionId === id;

  return (
    <Link href={href} scroll={!isPageLink} onClick={onClick}>
      <div
        className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer transition-colors duration-150
                    ${isActive ? 'bg-[var(--color-accent-primary)] text-white' : 'hover:bg-[var(--bg-accent)] text-[var(--text-on-dark-secondary)] hover:text-[var(--text-on-dark-primary)]'}`}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </div>
    </Link>
  );
};

export default function BusinessDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const businessId = params.businessId as string;

  const { business, fetchBusiness, businessLoading, businessError } = useBusinessContext();
  const { user, user_loading, FUser } = useUserContext(); // FUser for checking auth

  const [activeSectionId, setActiveSectionId] = useState('info'); 
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (businessId && FUser && (!business || business.businessId !== businessId)) { 
      fetchBusiness(businessId, { include: 'user' }); 
    }
  }, [businessId, FUser, fetchBusiness, business]);

  // Define sidebar items with unique IDs and correct hrefs
  const sidebarItems = React.useMemo(() => [
    { id: 'info', label: 'Information', icon: LayoutDashboard, href: `/business/${businessId}`, isPageLink: true, exactMatch: true },
    { id: 'channels', label: 'Channels', icon: RadioTower, href: `/business/${businessId}/channels`, isPageLink: true },
    { id: 'products-overview', label: 'Products', icon: Package, href: `/business/${businessId}/products`, isPageLink: true },
    { id: 'new-product', label: 'Add Product', icon: PlusCircle, href: `/business/${businessId}/product/new`, isPageLink: true, parentSectionId: 'products-overview' },
    { id: 'customers', label: 'Customers', icon: Users, href: `/business/${businessId}#customers`, isPageLink: false, parentPagePath: `/business/${businessId}` }, 
    { id: 'orders', label: 'Orders', icon: ShoppingCart, href: `/business/${businessId}#orders`, isPageLink: false, parentPagePath: `/business/${businessId}` }, 
    { id: 'settings', label: 'Settings', icon: Settings, href: `/business/${businessId}/settings`, isPageLink: true },
  ], [businessId]);
  
  useEffect(() => {
    const currentPath = pathname;
    const currentHash = typeof window !== 'undefined' ? window.location.hash : '';

    let newActiveId = 'info'; // Default

    // Iterate in reverse to prioritize more specific paths if they share prefixes
    const reversedSidebarItems = [...sidebarItems].reverse();

    for (const item of reversedSidebarItems) {
      if (item.isPageLink) {
        if (item.exactMatch) {
            if (currentPath === item.href && (!currentHash || currentHash === "#" || (item.id === 'info' && currentHash === '#info'))) {
                newActiveId = item.id;
                break; 
            }
        } else if (currentPath.startsWith(item.href)) {
          newActiveId = item.id;
          // If this item has a parentSectionId, we want the parent to be active.
          if (item.parentSectionId) {
            newActiveId = item.parentSectionId;
          }
          break; // Found the most specific match or its parent
        }
      } else { // Hash links
        if (currentPath === item.parentPagePath && currentHash === item.href) {
          newActiveId = item.id;
          break;
        }
      }
    }
    
    // Fallback for main business page with hash, if not caught by specific page links
    if (newActiveId === 'info' && currentPath === `/business/${businessId}` && currentHash && currentHash !== "#" && currentHash !== "#info") {
        const hashItem = sidebarItems.find(item => !item.isPageLink && item.href === currentHash && item.parentPagePath === `/business/${businessId}`);
        if (hashItem) {
            newActiveId = hashItem.id;
        }
    } else if (currentPath === `/business/${businessId}` && (!currentHash || currentHash === "#" || currentHash === "#info")) {
        // Ensure 'info' is selected for the base business page or with #info hash
        newActiveId = 'info';
    }


    setActiveSectionId(newActiveId);

  }, [pathname, businessId, sidebarItems]);

  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      if (pathname === `/business/${businessId}`) { // Only apply hash logic if on the main business page
        const hashItem = sidebarItems.find(item => !item.isPageLink && item.href === currentHash && item.parentPagePath === `/business/${businessId}`);
        if (hashItem) {
          setActiveSectionId(hashItem.id);
        } else if (!currentHash || currentHash === "#" || currentHash === "#info") {
          setActiveSectionId('info');
        }
        // If hash changes to something not in sidebar (e.g. custom scroll), 'info' might be a fallback or keep current page link active.
        // The main useEffect handles page links, this one fine-tunes for hashes on the main page.
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
      // Initial check on load if there's a hash on the main business page
      if (pathname === `/business/${businessId}` && window.location.hash) {
        handleHashChange();
      }
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [pathname, businessId, sidebarItems]);

  if (user_loading || (businessLoading && !business && businessId)) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[var(--icon-accent-primary)]" />
        <p className="mt-4 text-lg">Loading Business Layout...</p>
      </div>
    );
  }

  if (!FUser && !user_loading) { // Check FUser for authentication
    router.push('/user/signIn'); 
    return null;
  }
  
  if (businessId && businessError && !business) {
     return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col">
        <Header /> 
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <Briefcase className="h-16 w-16 text-[var(--text-error)] mb-4" />
            <h2 className="text-2xl font-semibold mb-2 text-[var(--text-error)]">Error Loading Business Information</h2>
            <p className="text-center text-[var(--text-on-dark-muted)] mb-6">{businessError || "The business could not be loaded. It might not exist or you may not have access."}</p>
            <Link href="/home" className="px-4 py-2 bg-[var(--color-accent-primary)] text-white rounded-md hover:bg-opacity-80 transition-colors">
            Go to Home
            </Link>
        </div>
      </div>
    );
  }

  // Determine if the "Add Product" button should be shown in the main content area
  // Show if on the products overview page.
  const showAddProductButtonInMain = activeSectionId === 'products-overview' && pathname === `/business/${businessId}/products`;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)]">
      <Header 
        isSidebarOpen={isMobileSidebarOpen}
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        showToggleButton={!!businessId} 
      />
      <div className="flex flex-col md:flex-row relative">
        {businessId && ( 
          <aside
            className={`
              fixed inset-y-0 left-0 z-30 w-64 bg-[var(--bg-secondary)] p-4 space-y-2 transform
              md:sticky md:top-[var(--header-height,64px)] md:translate-x-0 md:min-h-[calc(100vh-var(--header-height,64px))]
              transition-transform duration-300 ease-in-out overflow-y-auto
              ${isMobileSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}
            `}
            style={{ top: 'var(--header-height, 64px)' }} 
          >
            {sidebarItems.map(item => (
              <SidebarLink 
                key={item.id} 
                id={item.id}
                href={item.isPageLink ? item.href : (item.parentPagePath ? `${item.parentPagePath}${item.href}`: item.href)}
                icon={item.icon} 
                label={item.label} 
                activeSectionId={activeSectionId} // This will be 'products-overview' when on new product page
                isPageLink={item.isPageLink}
                onClick={() => {
                  if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                }}
              />
            ))}
          </aside>
        )}
        <main className={`flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ease-in-out 
                         ${businessId ? (isMobileSidebarOpen && 'md:ml-0') || (!isMobileSidebarOpen && 'md:ml-64') : 'ml-0'}`}>
           {showAddProductButtonInMain && (
            <div className="mb-4 flex justify-end">
              <Link href={`/business/${businessId}/product/new`} className="bg-[var(--color-accent-primary)] text-white px-4 py-2 rounded-md hover:bg-opacity-80 transition-colors flex items-center">
                <PlusCircle size={18} className="mr-2" />
                Add New Product
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
