import styled from 'styled-components';

export function GameAnalytics() {
  return (
    <Placeholder>
      <PlaceholderText>Analytics</PlaceholderText>
      <PlaceholderSubtext>
        View your game's performance and metrics.
      </PlaceholderSubtext>
    </Placeholder>
  );
}

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
