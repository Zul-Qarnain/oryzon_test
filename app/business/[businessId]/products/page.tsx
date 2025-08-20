import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ProductProvider } from '@/app/lib/context/ProductContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import BusinessProductsListContent from './content';

export default function BusinessProductsListPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <ProductProvider>
            <BusinessProductsListContent />
          </ProductProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
