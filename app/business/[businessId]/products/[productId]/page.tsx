import { UserProvider } from '@/app/lib/context/UserContext';
import { ProductProvider } from '@/app/lib/context/ProductContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import ProductInfoContent from './content';

export default function ProductInfoPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <ProductProvider>
          <ProductInfoContent />
        </ProductProvider>
      </UserProvider>
    </FetchProvider>
  );
}
