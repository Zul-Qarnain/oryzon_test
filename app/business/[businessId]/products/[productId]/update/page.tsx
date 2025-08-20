import { FetchProvider } from '@/app/lib/context/FetchContext';
import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ProductProvider } from '@/app/lib/context/ProductContext';
import ProductUpdateContent from './content';

export default function ProductUpdatePage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <ProductProvider>
            <ProductUpdateContent />
          </ProductProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
