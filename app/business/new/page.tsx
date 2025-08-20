import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import NewBusinessContent from './content';

export default function NewBusinessPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <NewBusinessContent />
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
