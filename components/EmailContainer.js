import React, { useState, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { FaSearch, FaArchive, FaTrash, FaEnvelope, FaEnvelopeOpen } from 'react-icons/fa';
import theme from '../styles/theme';
import { useQueryClient, useInfiniteQuery, useMutation } from 'react-query';
import { format } from 'date-fns';

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

const Actions = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: ${theme.spacing.md}px;
`;

const ActionButton = styled.button`
  padding: ${theme.spacing.sm}px;
  color: ${theme.colors.text.secondary};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: ${theme.transitions.default};

  &:hover {
    color: ${theme.colors.primary.main};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  padding: ${theme.spacing.lg}px;
  color: ${theme.colors.text.secondary};
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md}px;
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.background.paper};
`;

const PaginationButton = styled.button`
  padding: ${theme.spacing.sm}px ${theme.spacing.md}px;
  background: ${theme.colors.primary.main};
  color: white;
  border: none;
  border-radius: ${theme.borderRadius.small};
  cursor: pointer;
  transition: ${theme.transitions.default};
  opacity: ${props => props.disabled ? 0.5 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};

  &:hover {
    background: ${theme.colors.primary.dark};
  }
`;

const EmailContainer = ({ category = 'Work' }) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const parentRef = useRef();

  // Fetch emails with pagination
  const { data, fetchNextPage, isFetchingNextPage, status } = useInfiniteQuery(
    ['emails', category],
    async ({ pageParam = null }) => {
      const response = await fetch(`/api/emails/fetch?pageToken=${pageParam || ''}`);
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        throw new Error('Network response was not ok');
      }
      return response.json();
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextPageToken,
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Cache for 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      retry: 3
    }
  );

  // Get current page of emails
  const allEmails = data?.pages.flatMap((page) => page.emails) ?? [];
  const currentEmails = allEmails.slice(currentPage * 50, (currentPage + 1) * 50);
  const hasNextPage = data?.pages[data.pages.length - 1]?.nextPageToken;
  const hasPrevPage = currentPage > 0;

  const handleNextPage = useCallback(() => {
    if (((currentPage + 1) * 50) >= allEmails.length && hasNextPage) {
      fetchNextPage().then(() => setCurrentPage(prev => prev + 1));
    } else if (((currentPage + 1) * 50) < allEmails.length) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, allEmails.length, hasNextPage, fetchNextPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Mutations for email actions
  const archiveMutation = useMutation(
    async (emailId) => {
      const response = await fetch(`/api/emails/${emailId}/archive`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to archive');
      return emailId;
    },
    {
      onSuccess: () => queryClient.invalidateQueries(['emails', category]),
    }
  );

  const deleteMutation = useMutation(
    async (emailId) => {
      const response = await fetch(`/api/emails/${emailId}/delete`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to delete');
      return emailId;
    },
    {
      onSuccess: () => queryClient.invalidateQueries(['emails', category]),
    }
  );

  const toggleReadMutation = useMutation(
    async ({ emailId, isRead }) => {
      const response = await fetch(`/api/emails/${emailId}/read`, {
        method: 'POST',
        body: JSON.stringify({ isRead }),
      });
      if (!response.ok) throw new Error('Failed to update read status');
      return { emailId, isRead };
    },
    {
      onSuccess: () => queryClient.invalidateQueries(['emails', category]),
    }
  );

  return (
    <Container>
      <Header>
        <Title>{category} Emails</Title>
      </Header>

      <SearchBar>
        <FaSearch />
        <input
          type="text"
          placeholder="Search emails..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </SearchBar>

      <EmailList ref={parentRef}>
        {status === 'loading' ? (
          <LoadingSpinner>Loading emails...</LoadingSpinner>
        ) : status === 'error' ? (
          <div>Error fetching emails</div>
        ) : (
          <>
            {currentEmails.map((email) => (
              <EmailItem key={email.id} unread={!email.is_read}>
                <Sender unread={!email.is_read}>
                  <div className="name">{email.raw_data.from}</div>
                  <div className="email">{format(new Date(email.date_received), 'MMM d, yyyy')}</div>
                </Sender>
                <Content>
                  <div className="subject">{email.subject}</div>
                  <div className="preview">{email.snippet}</div>
                </Content>
                <Actions>
                  <ActionButton onClick={() => archiveMutation.mutate(email.id)}>
                    <FaArchive />
                  </ActionButton>
                  <ActionButton onClick={() => deleteMutation.mutate(email.id)}>
                    <FaTrash />
                  </ActionButton>
                  <ActionButton
                    onClick={() =>
                      toggleReadMutation.mutate({ emailId: email.id, isRead: !email.is_read })
                    }
                  >
                    {email.is_read ? <FaEnvelopeOpen /> : <FaEnvelope />}
                  </ActionButton>
                </Actions>
              </EmailItem>
            ))}
            <PaginationControls>
              <PaginationButton 
                onClick={handlePrevPage} 
                disabled={!hasPrevPage}
              >
                Previous
              </PaginationButton>
              <div>Page {currentPage + 1}</div>
              <PaginationButton 
                onClick={handleNextPage} 
                disabled={!hasNextPage && ((currentPage + 1) * 50) >= allEmails.length}
              >
                Next
              </PaginationButton>
            </PaginationControls>
          </>
        )}
      </EmailList>
    </Container>
  );
};

export default EmailContainer;
