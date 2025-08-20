import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { OrderProvider } from '@/app/lib/context/OrderContext';
import { ProductProvider } from '@/app/lib/context/ProductContext';
import { CustomerProvider } from '@/app/lib/context/CustomerContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import NewOrderContent from './content';

export default function NewOrderPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <OrderProvider>
            <ProductProvider>
              <CustomerProvider>
                <NewOrderContent />
              </CustomerProvider>
            </ProductProvider>
          </OrderProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
