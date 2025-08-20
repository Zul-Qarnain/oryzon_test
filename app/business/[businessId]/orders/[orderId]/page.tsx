import { FetchProvider } from '@/app/lib/context/FetchContext';
import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { OrderProvider } from '@/app/lib/context/OrderContext';
import OrderInfoContent from './content';

export default function OrderInfoPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <OrderProvider>
            <OrderInfoContent />
          </OrderProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
