import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { TryChatProvider } from '@/app/lib/context/TryChatContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import TryChatContent from './content';

export default function TryChatPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <TryChatProvider>
            <TryChatContent />
          </TryChatProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
