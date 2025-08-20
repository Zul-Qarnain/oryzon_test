import { UserProvider } from '@/app/lib/context/UserContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import SignInContent from './content';

export default function SignInPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <SignInContent />
      </UserProvider>
    </FetchProvider>
  );
}
