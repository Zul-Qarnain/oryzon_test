import { FetchProvider } from '@/app/lib/context/FetchContext';
import { UserProvider } from '@/app/lib/context/UserContext';
import { BusinessProvider } from '@/app/lib/context/BusinessContext';
import { ChatProvider } from '@/app/lib/context/ChatContext';
import ChatContent from './content';

export default function ChatPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <BusinessProvider>
          <ChatProvider>
            <ChatContent />
          </ChatProvider>
        </BusinessProvider>
      </UserProvider>
    </FetchProvider>
  );
}
