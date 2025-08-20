import { UserProvider } from '@/app/lib/context/UserContext';
import { FetchProvider } from '@/app/lib/context/FetchContext';
import NewProjectContent from './content';

export default function NewProjectPage() {
  return (
    <FetchProvider>
      <UserProvider>
        <NewProjectContent />
      </UserProvider>
    </FetchProvider>
  );
}
