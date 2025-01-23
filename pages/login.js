import React from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import AuthBox from '@/components/AuthBox';
import AnimatedBanner from '@/components/AnimatedBanner';
import theme from '@/styles/theme';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.xl}px;
  background: linear-gradient(
    135deg,
    ${theme.colors.background.default} 0%,
    ${theme.colors.background.paper} 100%
  );
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      ${theme.colors.primary.main}15 0%,
      transparent 70%
    );
    pointer-events: none;
  }
`;

const LoginPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  React.useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  if (status === 'loading') {
    return null;
  }

  return (
    <LoginContainer>
      <AnimatedBanner />
      <AuthBox />
    </LoginContainer>
  );
};

export default LoginPage;
