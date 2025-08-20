import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ChannelProvider } from '@/app/lib/context/ChannelContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import BusinessChannelsListContent from './content';

export default function BusinessChannelsListPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <ChannelProvider>
            <BusinessChannelsListContent />
          </ChannelProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
