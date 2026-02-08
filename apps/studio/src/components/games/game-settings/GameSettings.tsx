import {useOutletContext} from 'react-router';
import styled from 'styled-components';
import type {GameOutletContext} from '@/pages/GamePage';
import {DangerZoneSection} from './DangerZoneSection';
import {DomainsSection} from './DomainsSection';
import {RedirectSection} from './RedirectSection';

export function GameSettings() {
  const game = useOutletContext<GameOutletContext>();

  return (
    <Container>
      <Sections>
        {/* Custom Domain */}
        <Card>
          <DomainsSection />
        </Card>

        {/* Redirect */}
        <Card>
          <RedirectSection />
        </Card>

        {/* Delete */}
        <DangerZoneSection gameId={game.id} gameTitle={game.title} />
      </Sections>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  width: 100%;
  max-width: var(--container-2xl);
`;

const Card = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;
