import {ArrowLeftIcon} from 'lucide-react';
import {Link} from 'react-router';
import styled from 'styled-components';
import {Button, Loading} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

interface GameEditorProps {
  gameId: string;
}

export function GameEditor({gameId}: GameEditorProps) {
  const {activeOrganization} = useAppContext(ContextLevel.AuthenticatedWithOrg);

  const {data: game, isLoading} = trpc.game.get.useQuery({id: gameId});

  if (isLoading) {
    return (
      <LoadingContainer>
        <Loading size="lg" />
      </LoadingContainer>
    );
  }

  if (!game) {
    return (
      <Container>
        <p>Game not found</p>
        <Link to={`/${activeOrganization.slug}/games`}>
          <Button variant="ghost">Back to Games</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackLink to={`/${activeOrganization.slug}/games`}>
          <ArrowLeftIcon size={20} />
          Back to Games
        </BackLink>
        <Title>{game.title}</Title>
        <Slug>play.link/{game.slug}</Slug>
      </Header>

      <EditorContent>
        <Placeholder>
          <PlaceholderText>Game Editor</PlaceholderText>
          <PlaceholderSubtext>
            This is where you'll edit your game's details, links, and content.
          </PlaceholderSubtext>
        </Placeholder>
      </EditorContent>
    </Container>
  );
}

const Container = styled.div`
  padding: var(--spacing-8);
  max-width: 64rem;
  margin: 0 auto;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`;

const Header = styled.div`
  margin-bottom: var(--spacing-8);
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--fg-muted);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-4);
  transition: color 0.15s;

  &:hover {
    color: var(--fg);
  }
`;

const Title = styled.h1`
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--fg);
  margin: 0;
`;

const Slug = styled.p`
  font-size: var(--text-base);
  color: var(--fg-muted);
  margin: var(--spacing-1) 0 0;
`;

const EditorContent = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-xl);
  min-height: 24rem;
`;

const Placeholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 24rem;
  text-align: center;
`;

const PlaceholderText = styled.p`
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  margin: 0;
`;

const PlaceholderSubtext = styled.p`
  font-size: var(--text-base);
  color: var(--fg-subtle);
  margin: var(--spacing-2) 0 0;
`;
