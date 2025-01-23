import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import Navbar from '../components/Navbar';
import EmailContainer from '../components/EmailContainer';
import styled from 'styled-components';

const LogoutButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 8px 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #d32f2f;
  }
`;

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  if (status === 'loading') {
    return null; // Or a loading spinner
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      <Navbar />
      <EmailContainer />
    </div>
  );
}