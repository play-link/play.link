import {PackageIcon} from 'lucide-react';
import styled from 'styled-components';

export function GamePressKit() {
  return (
    <Container>
      <EmptyState>
        <PackageIcon size={32} strokeWidth={1.5} />
        <Title>Press kit</Title>
        <Description>Coming soon. You'll be able to manage and share your press kit from here.</Description>
      </EmptyState>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-12);
  color: var(--fg-subtle);
  text-align: center;
`;

const Title = styled.h2`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const Description = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
  max-width: 320px;
`;
