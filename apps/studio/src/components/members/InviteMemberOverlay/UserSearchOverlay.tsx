import type {RefObject} from 'react';
import styled, {css} from 'styled-components';
import {Avatar, dropdownOverlayCss, Loading, Overlay} from '@play/pylon';

export interface SearchResult {
  user_id: string;
  email: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

interface UserSearchOverlayProps {
  opened: boolean;
  onClose: () => void;
  isLoading: boolean;
  results: SearchResult[];
  onSelectUser: (user: SearchResult) => void;
  emptyMessage?: string;
  positionTarget: RefObject<HTMLElement | null>;
}

export function UserSearchOverlay({
  opened,
  onClose,
  isLoading,
  results,
  onSelectUser,
  emptyMessage = 'No users found',
  positionTarget,
}: UserSearchOverlayProps) {
  return (
    <Overlay
      opened={opened}
      cancelOnOutsideClick
      setOpened={onClose}
      isModal={false}
      position={{
        positionTarget: positionTarget.current,
        verticalAlign: 'bottom',
        noVerticalOverlap: true,
        horizontalAlign: 'left',
      }}
      modalCss={css`
        ${dropdownOverlayCss}
        max-height: 12rem;
        overflow-y: auto;
      `}
    >
      {isLoading ? (
        <LoadingContainer>
          <Loading size="sm" />
        </LoadingContainer>
      ) : results.length === 0 ? (
        <EmptyMessage>{emptyMessage}</EmptyMessage>
      ) : (
        results.map((user) => (
          <SearchResultItem
            key={user.user_id}
            type="button"
            onClick={() => onSelectUser(user)}
          >
            <Avatar
              text={user.display_name || user.email}
              src={user.avatar_url ?? undefined}
              size="sm"
            />
            <UserDetails>
              <UserName>
                {user.display_name || user.username || 'Unknown'}
              </UserName>
              <UserEmail>{user.email}</UserEmail>
            </UserDetails>
          </SearchResultItem>
        ))
      )}
    </Overlay>
  );
}

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
`;

const EmptyMessage = styled.div`
  padding: var(--spacing-3);
  font-size: var(--text-sm);
  color: var(--fg-subtle);
`;

const SearchResultItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  text-align: left;
  transition: background-color 0.15s;

  &:hover {
    background: var(--bg-press);
  }
`;

const UserDetails = styled.div`
  min-width: 0;
`;

const UserName = styled.p`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--white);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const UserEmail = styled.p`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
