import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Navbar from '../components/Navbar';
import EmailContainer from '../components/EmailContainer';

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return null; // Or a loading spinner
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <Navbar />
      <EmailContainer />
    </div>
  );
}