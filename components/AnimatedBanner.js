import React from 'react';
import styled, { keyframes } from 'styled-components';
import theme from '@/styles/theme';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const subtlePulse = keyframes`
  0% {
    opacity: 0.95;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.95;
  }
`;

const BannerContainer = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl * 2}px;
`;

const MainTitle = styled.h1`
  font-size: 3.5rem;
  color: ${theme.colors.text.primary};
  font-weight: 600;
  letter-spacing: -0.02em;
  margin-bottom: ${theme.spacing.md}px;
  opacity: 0;
  animation: ${fadeIn} 0.8s ease-out forwards;
  background: linear-gradient(
    135deg,
    ${theme.colors.text.primary} 0%,
    rgba(255, 255, 255, 0.85) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  color: ${theme.colors.text.secondary};
  font-weight: 400;
  letter-spacing: -0.01em;
  opacity: 0;
  animation: ${fadeIn} 0.8s ease-out forwards 0.3s,
             ${subtlePulse} 4s ease-in-out infinite 2s;
`;

const AnimatedBanner = () => {
  return (
    <BannerContainer>
      <MainTitle>Welcome to NeuroMail</MainTitle>
      <Subtitle>The Ultimate Email Companion</Subtitle>
    </BannerContainer>
  );
};

export default AnimatedBanner;
