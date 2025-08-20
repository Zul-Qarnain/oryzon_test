import { FetchProvider } from '@/app/lib/context/FetchContext';
import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import HomeContent from './home/content';

export default function HomePage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <HomeContent />
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
