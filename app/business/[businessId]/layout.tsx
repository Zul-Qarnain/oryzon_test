"use client";

import React, { useEffect, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/app/components/Header';
import { useBusinessContext } from '@/app/lib/context/BusinessContext';
import { useUserContext } from '@/app/lib/context/UserContext';
import { Loader2, Settings, Package, RadioTower, LayoutDashboard, Users, ShoppingCart, Briefcase } from 'lucide-react';

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
  const { user, user_loading } = useUserContext();

  const [activeSectionId, setActiveSectionId] = useState('info'); // Stores the ID of the active section
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (businessId && user && (!business || business.businessId !== businessId)) { 
      fetchBusiness(businessId, { include: 'user' }); 
    }
  }, [businessId, user, fetchBusiness, business]);

  // Define sidebar items with unique IDs and correct hrefs
  const sidebarItems = [
    { id: 'info', label: 'Information', icon: LayoutDashboard, href: `/business/${businessId}`, isPageLink: true, exactMatch: true },
    { id: 'channels', label: 'Channels', icon: RadioTower, href: `/business/${businessId}/channels`, isPageLink: true },
    { id: 'products', label: 'Products', icon: Package, href: `#products`, isPageLink: false, parentPagePath: `/business/${businessId}` },
    { id: 'customers', label: 'Customers', icon: Users, href: `#customers`, isPageLink: false, parentPagePath: `/business/${businessId}` },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, href: `#orders`, isPageLink: false, parentPagePath: `/business/${businessId}` },
    { id: 'settings', label: 'Settings', icon: Settings, href: `/business/${businessId}/settings`, isPageLink: true },
  ];
  
  // Determine active section based on pathname and hash
  useEffect(() => {
    const currentPath = pathname;
    const currentHash = typeof window !== 'undefined' ? window.location.hash : ''; // Keep the '#' for hash links

    let newActiveId = 'info'; // Default

    for (const item of sidebarItems) {
      if (item.isPageLink) {
        // For page links, check if the current path starts with the item's href.
        // More specific paths (like /channel/new under /channels) should match their parent.
        if (item.exactMatch) { // For the main business page /business/[id]
            if (currentPath === item.href && (!currentHash || currentHash === "#")) {
                newActiveId = item.id;
                break;
            }
        } else if (currentPath.startsWith(item.href)) {
          newActiveId = item.id;
          // Don't break immediately, allow more specific matches like 'settings' over 'business/[id]' if both start similarly
        }
      } else {
        // For hash links, check if on the correct parent page and the hash matches.
        if (currentPath === item.parentPagePath && currentHash === item.href) {
          newActiveId = item.id;
          break;
        }
      }
    }
    // If after checking page links, we are on the main business page and have a hash, prioritize hash links
    if (currentPath === `/business/${businessId}` && currentHash) {
        const hashItem = sidebarItems.find(item => !item.isPageLink && item.href === currentHash);
        if (hashItem) {
            newActiveId = hashItem.id;
        } else if (!currentHash || currentHash === "#" || currentHash === "#info"){ // if hash is empty or #info, set to info
            newActiveId = 'info';
        }
    } else if (currentPath === `/business/${businessId}` && (!currentHash || currentHash === "#")) { // Default to 'info' if on main page without specific hash
        newActiveId = 'info';
    }


    setActiveSectionId(newActiveId);

  }, [pathname, businessId, sidebarItems]); // sidebarItems is stable, but good practice to include if it could change

  // Handle hash changes for the main business page to update active section
  useEffect(() => {
    const handleHashChange = () => {
      const currentHash = window.location.hash;
      if (pathname === `/business/${businessId}`) {
        const hashItem = sidebarItems.find(item => !item.isPageLink && item.href === currentHash);
        if (hashItem) {
          setActiveSectionId(hashItem.id);
        } else if (!currentHash || currentHash === "#" || currentHash === "#info") { // Default to 'info' if hash is empty or #info
          setActiveSectionId('info');
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
      // Initial check on load if there's a hash
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

  if (!user && !user_loading) {
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
                // For page links, href is the full path. For hash links, it's just the hash.
                href={item.isPageLink ? item.href : (item.parentPagePath ? `${item.parentPagePath}${item.href}`: item.href)}
                icon={item.icon} 
                label={item.label} 
                activeSectionId={activeSectionId}
                isPageLink={item.isPageLink}
                onClick={() => {
                  if (isMobileSidebarOpen) setIsMobileSidebarOpen(false);
                  // Active section ID is updated by useEffect watching pathname/hash
                }}
              />
            ))}
          </aside>
        )}
        <main className={`flex-1 p-4 md:p-8 overflow-y-auto transition-all duration-300 ease-in-out 
                         ${businessId ? (isMobileSidebarOpen && 'md:ml-0') || (!isMobileSidebarOpen && 'md:ml-64') : 'ml-0'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
