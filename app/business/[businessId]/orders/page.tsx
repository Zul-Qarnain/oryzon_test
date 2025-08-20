import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { OrderProvider } from '@/app/lib/context/OrderContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import BusinessOrdersListContent from './content';

export default function BusinessOrdersListPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <OrderProvider>
            <BusinessOrdersListContent />
          </OrderProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
