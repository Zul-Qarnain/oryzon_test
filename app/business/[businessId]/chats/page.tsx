import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ChatProvider } from '@/app/lib/context/ChatContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import ChatsContent from './content';

export default function ChatsPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <ChatProvider>
            <ChatsContent />
          </ChatProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
