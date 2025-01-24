import React from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import IMAGES from '@/constants/images';
import theme from '@/styles/theme';

const GlassContainer = styled.div`
  background: rgba(34, 35, 39, 0.7);
  backdrop-filter: blur(20px);
  border-radius: ${theme.borderRadius.large};
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: ${theme.spacing.xl}px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.lg}px;
`;

const Logo = styled.div`
  margin-bottom: ${theme.spacing.lg}px;
  width: 120px;
  height: 120px;
  position: relative;
`;

const Title = styled.h1`
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.h1.fontSize};
  font-weight: ${theme.typography.h1.fontWeight};
  margin-bottom: ${theme.spacing.md}px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: ${theme.colors.text.secondary};
  font-size: ${theme.typography.body1.fontSize};
  text-align: center;
  margin-bottom: ${theme.spacing.xl}px;
`;

const AuthButton = styled.button`
  width: 100%;
  padding: ${theme.spacing.md}px;
  border-radius: ${theme.borderRadius.medium};
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.md}px;
  cursor: pointer;
  transition: ${theme.transitions.default};
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.body1.fontSize};
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.5s ease;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);

    &:before {
      transform: translateX(100%);
    }
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ButtonIcon = styled.div`
  width: 24px;
  height: 24px;
  position: relative;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: ${theme.spacing.lg}px 0;
`;

const AuthBox = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignIn = async (provider) => {
    try {
      setIsLoading(true);
      console.log(`Starting authentication with ${provider}...`);
      
      // Call signIn with redirect: true to handle the flow properly
      await signIn(provider, { 
        callbackUrl: '/',
        redirect: true
      });
      
      // Note: The code below won't execute because redirect: true will handle the navigation
      console.log('Authentication initiated');
    } catch (error) {
      console.error('Authentication error:', error);
      setIsLoading(false);
    }
  };

  return (
    <GlassContainer>
      <Logo>
        <Image
          src={IMAGES.logos.smartmail}
          alt="SmartMail"
          layout="fill"
          objectFit="contain"
        />
      </Logo>
      
      <Title>Welcome to SmartMail</Title>
      <Subtitle>
        Sign in to experience intelligent email management
      </Subtitle>

      <AuthButton 
        onClick={() => handleSignIn('google')}
        disabled={isLoading}
      >
        <ButtonIcon>
          <Image
            src={IMAGES.logos.gmail}
            alt="Gmail"
            layout="fill"
            objectFit="contain"
          />
        </ButtonIcon>
        {isLoading ? 'Connecting...' : 'Continue with Gmail'}
      </AuthButton>

      <Divider />

      <AuthButton 
        onClick={() => handleSignIn('azure-ad')}
        disabled={isLoading}
      >
        <ButtonIcon>
          <Image
            src={IMAGES.logos.outlook}
            alt="Outlook"
            layout="fill"
            objectFit="contain"
          />
        </ButtonIcon>
        {isLoading ? 'Connecting...' : 'Continue with Outlook'}
      </AuthButton>
    </GlassContainer>
  );
};

export default AuthBox;
