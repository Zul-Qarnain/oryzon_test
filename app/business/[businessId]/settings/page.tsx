import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ChannelProvider } from '@/app/lib/context/ChannelContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import BusinessSettingsContent from './content';

export default function BusinessSettingsPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <ChannelProvider>
            <BusinessSettingsContent />
          </ChannelProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
