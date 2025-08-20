import { FetchProvider } from '@/app/lib/context/FetchContext';
import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import BusinessDetailLayoutContent from './layout-content';

export default function BusinessDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <BusinessDetailLayoutContent>
            {children}
          </BusinessDetailLayoutContent>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
