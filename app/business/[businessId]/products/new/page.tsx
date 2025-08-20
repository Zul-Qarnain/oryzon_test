import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ProductProvider } from '@/app/lib/context/ProductContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import NewProductContent from './content';

export default function NewProductPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <ProductProvider>
            <NewProductContent />
          </ProductProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
