import React from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import Image from 'next/image';
import IMAGES from '../constants/images';
import theme from '../styles/theme';
import { 
  FaBriefcase, 
  FaUser, 
  FaBell, 
  FaNewspaper,
  FaTag,
  FaPen,
  FaInbox
} from 'react-icons/fa';

const NavContainer = styled.nav`
  width: 280px;
  height: 100vh;
  background: ${theme.colors.background.paper};
  border-right: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg}px;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md}px;
  margin-bottom: ${theme.spacing.xl}px;
`;

const LogoImage = styled.div`
  width: 32px;
  height: 32px;
  position: relative;
`;

const AppTitle = styled.h1`
  color: ${theme.colors.primary.main};
  font-size: 24px;
  font-weight: 600;
  background: linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.primary.light});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.5px;
`;

const ComposeButton = styled.button`
  width: 100%;
  padding: ${theme.spacing.md}px;
  background: ${theme.colors.primary.main};
  color: white;
  border-radius: ${theme.borderRadius.medium};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm}px;
  margin-bottom: ${theme.spacing.xl}px;
  transition: ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.primary.dark};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const NavSection = styled.div`
  margin-bottom: ${theme.spacing.xl}px;

  h3 {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.caption.fontSize};
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  }
`;

const NavItem = styled.a`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md}px;
  padding: ${theme.spacing.md}px;
  color: ${props => props.active ? theme.colors.text.primary : theme.colors.text.secondary};
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
  border-radius: ${theme.borderRadius.medium};
  cursor: pointer;
  transition: ${theme.transitions.default};
  font-weight: ${props => props.active ? 500 : 400};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${theme.colors.text.primary};
  }

  .count {
    margin-left: auto;
    background: ${props => props.active ? theme.colors.primary.main : 'rgba(255, 255, 255, 0.1)'};
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
  }
`;

const navItems = {
  main: [
    { icon: <FaInbox size={18} />, label: 'All Mail', count: 45 },
    { icon: <FaBriefcase size={18} />, label: 'Work', count: 12 },
    { icon: <FaUser size={18} />, label: 'Personal', count: 5 },
    { icon: <FaBell size={18} />, label: 'Notifications', count: 3 },
  ],
  categories: [
    { icon: <FaNewspaper size={18} />, label: 'Newsletters', count: 8 },
    { icon: <FaTag size={18} />, label: 'Promotions', count: 24 },
  ],
};

const Navbar = () => {
  const router = useRouter();
  const [activeItem, setActiveItem] = React.useState('All Mail');

  const handleNavClick = (label) => {
    setActiveItem(label);
    // Here you would typically navigate or filter emails based on the selected category
  };

  return (
    <NavContainer>
      <Logo>
        <LogoImage>
          <Image
            src={IMAGES.logos.smartmail}
            alt="NeuroMail"
            layout="fill"
            objectFit="contain"
          />
        </LogoImage>
        <AppTitle>NeuroMail</AppTitle>
      </Logo>

      <ComposeButton>
        <FaPen size={18} />
        Compose
      </ComposeButton>

      <NavSection>
        {navItems.main.map(({ icon, label, count }) => (
          <NavItem
            key={label}
            active={activeItem === label}
            onClick={() => handleNavClick(label)}
          >
            {icon}
            {label}
            {count && <span className="count">{count}</span>}
          </NavItem>
        ))}
      </NavSection>

      <NavSection>
        <h3>Categories</h3>
        {navItems.categories.map(({ icon, label, count }) => (
          <NavItem
            key={label}
            active={activeItem === label}
            onClick={() => handleNavClick(label)}
          >
            {icon}
            {label}
            {count && <span className="count">{count}</span>}
          </NavItem>
        ))}
      </NavSection>
    </NavContainer>
  );
};

export default Navbar;