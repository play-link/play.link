import {ExternalLinkIcon} from 'lucide-react';
import {Link} from 'react-router';
import styled from 'styled-components';
import {Button} from '@play/pylon';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {Section, SectionTitle} from './shared';

export function OwnershipSection() {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);

  return (
    <Section>
      <SectionTitle>Ownership & Access</SectionTitle>

      <InfoRow>
        <InfoLabel>Owner studio</InfoLabel>
        <InfoValue>{activeStudio.name}</InfoValue>
      </InfoRow>

      <Link to={`/${activeStudio.slug}/settings/team`}>
        <Button variant="ghost" size="sm">
          <ExternalLinkIcon size={14} />
          Manage studio members
        </Button>
      </Link>
    </Section>
  );
}

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const InfoLabel = styled.span`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;

const InfoValue = styled.span`
  font-size: var(--text-sm);
  color: var(--fg);
  font-weight: var(--font-weight-medium);
`;
