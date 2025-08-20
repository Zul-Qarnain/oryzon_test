import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import BusinessDetailContent from './content';

export default function BusinessDetailPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <BusinessDetailContent />
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
