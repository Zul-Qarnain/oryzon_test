import { FetchProvider } from '@/app/lib/context/FetchContext';
import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { OrderProvider } from '@/app/lib/context/OrderContext';
import UpdateOrderContent from './content';

export default function UpdateOrderPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <OrderProvider>
            <UpdateOrderContent />
          </OrderProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
