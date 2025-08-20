import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { CustomerProvider } from '@/app/lib/context/CustomerContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import BusinessCustomersListContent from './content';

export default function BusinessCustomersListPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <CustomerProvider>
            <BusinessCustomersListContent />
          </CustomerProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
