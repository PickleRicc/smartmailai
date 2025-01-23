import React from 'react';
import styled from 'styled-components';
import { FaSearch } from 'react-icons/fa';
import theme from '../styles/theme';

const Container = styled.div`
  margin-left: 280px; // Match Navbar width
  min-height: 100vh;
  background: ${theme.colors.background.default};
  padding: ${theme.spacing.lg}px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.xl}px;
  padding-bottom: ${theme.spacing.md}px;
  border-bottom: 1px solid ${theme.colors.border};
`;

const Title = styled.h1`
  color: ${theme.colors.text.primary};
  font-size: ${theme.typography.h2.fontSize};
  font-weight: 600;
`;

const SearchBar = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  margin: ${theme.spacing.lg}px 0;

  input {
    width: 100%;
    padding: ${theme.spacing.md}px ${theme.spacing.md}px ${theme.spacing.md}px 40px;
    background: ${theme.colors.background.paper};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.medium};
    color: ${theme.colors.text.primary};
    font-size: ${theme.typography.body1.fontSize};
    transition: ${theme.transitions.default};

    &:focus {
      outline: none;
      border-color: ${theme.colors.primary.main};
      box-shadow: 0 0 0 2px ${theme.colors.primary.main}20;
    }

    &::placeholder {
      color: ${theme.colors.text.disabled};
    }
  }

  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: ${theme.colors.text.secondary};
  }
`;

const EmailList = styled.div`
  background: ${theme.colors.background.paper};
  border-radius: ${theme.borderRadius.large};
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const EmailItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.lg}px;
  border-bottom: 1px solid ${theme.colors.border};
  cursor: pointer;
  transition: ${theme.transitions.default};
  background: ${props => props.unread ? 'rgba(255, 255, 255, 0.02)' : 'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Sender = styled.div`
  flex: 0 0 200px;
  padding-right: ${theme.spacing.md}px;

  .name {
    color: ${theme.colors.text.primary};
    font-weight: ${props => props.unread ? 600 : 400};
    margin-bottom: 4px;
  }

  .email {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.caption.fontSize};
  }
`;

const Content = styled.div`
  flex: 1;
  padding-right: ${theme.spacing.md}px;
  overflow: hidden;

  .subject {
    color: ${theme.colors.text.primary};
    font-weight: ${props => props.unread ? 600 : 400};
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.body2.fontSize};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const Metadata = styled.div`
  flex: 0 0 100px;
  text-align: right;

  .time {
    color: ${theme.colors.text.secondary};
    font-size: ${theme.typography.caption.fontSize};
    margin-bottom: 4px;
  }

  .category {
    display: inline-block;
    padding: 2px 8px;
    background: ${props => props.categoryColor || theme.colors.primary.main}20;
    color: ${props => props.categoryColor || theme.colors.primary.main};
    border-radius: 12px;
    font-size: ${theme.typography.caption.fontSize};
  }
`;

const EmailContainer = ({ category = 'Work' }) => {
  // This would be replaced with real email data
  const mockEmails = [
    {
      id: 1,
      sender: { name: 'John Doe', email: 'john@example.com' },
      subject: 'Project Update - Q1 2025',
      preview: 'Here are the latest updates on our ongoing projects...',
      time: '10:30 AM',
      category: 'Work',
      unread: true,
    },
    {
      id: 2,
      sender: { name: 'Alice Smith', email: 'alice@example.com' },
      subject: 'Team Meeting Notes',
      preview: 'Summary of our discussion points from today\'s meeting...',
      time: '9:15 AM',
      category: 'Work',
      unread: false,
    },
    // Add more mock emails as needed
  ];

  return (
    <Container>
      <Header>
        <Title>{category}</Title>
      </Header>

      <SearchBar>
        <FaSearch size={16} />
        <input type="text" placeholder="Search emails..." />
      </SearchBar>

      <EmailList>
        {mockEmails.map((email) => (
          <EmailItem key={email.id} unread={email.unread}>
            <Sender unread={email.unread}>
              <div className="name">{email.sender.name}</div>
              <div className="email">{email.sender.email}</div>
            </Sender>
            <Content unread={email.unread}>
              <div className="subject">{email.subject}</div>
              <div className="preview">{email.preview}</div>
            </Content>
            <Metadata categoryColor={theme.colors.primary.main}>
              <div className="time">{email.time}</div>
              <div className="category">{email.category}</div>
            </Metadata>
          </EmailItem>
        ))}
      </EmailList>
    </Container>
  );
};

export default EmailContainer;
