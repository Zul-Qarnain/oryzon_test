import ChannelDetailContent from '@/app/business/[businessId]/channels/[channelId]/content';
import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ChannelProvider } from '@/app/lib/context/ChannelContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import BusinessChannelsListContent from './content';

export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ businessId: string; channelId: string }>;
}) {
  const { businessId, channelId } = await params;
  
  return (
  <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <ChannelProvider>
<ChannelDetailContent businessId={businessId} channelId={channelId} />
          </ChannelProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  ) 
}
