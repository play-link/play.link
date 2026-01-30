import styled from 'styled-components';

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

export const SectionTitle = styled.h3`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border-muted);
  margin: 0;
`;
