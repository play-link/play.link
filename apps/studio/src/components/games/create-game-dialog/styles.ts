import styled, {css, keyframes} from 'styled-components';

export const Subtitle = styled.p`
  font-size: var(--text-base);
  color: var(--fg-muted);
  margin: 0 0 var(--spacing-6);
`;

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
`;

export const SlugPrefix = styled.span`
  align-items: center;
  background: var(--bg-subtle);
  border-bottom-left-radius: var(--radius-md);
  border-right: 1px solid var(--input-border-color);
  border-top-left-radius: var(--radius-md);
  color: var(--fg-muted);
  display: inline-flex;
  font-size: var(--text-base);
  height: calc(100% - 0.125rem);
  margin-left: 0.0625rem;
  padding: 0 var(--spacing-2-5);
`;

export const SlugStatus = styled.div`
  align-items: center;
  display: inline-flex;
  height: 100%;
  padding-right: var(--spacing-3);
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const StatusIcon = styled.span<{
  $status: 'loading' | 'available' | 'unavailable';
}>`
  display: flex;
  align-items: center;
  justify-content: center;

  ${(p) =>
    p.$status === 'loading' &&
    css`
      color: var(--fg-muted);
      animation: ${spin} 1s linear infinite;
    `}

  ${(p) =>
    p.$status === 'available' &&
    css`
      color: var(--fg-success);
    `}

  ${(p) =>
    p.$status === 'unavailable' &&
    css`
      color: var(--fg-error);
    `}
`;

export const AvailableText = styled.span`
  color: var(--fg-success);
`;

export const UnavailableText = styled.span`
  color: var(--fg-error);
`;

export const VerificationRequiredText = styled.span`
  color: var(--fg-warning);
`;

export const ErrorMessage = styled.p`
  color: var(--fg-error);
  font-size: var(--text-sm);
  background: color-mix(in srgb, var(--fg-error) 10%, transparent);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  margin: 0;
`;

export const FooterSpacer = styled.div`
  flex: 1;
`;

export const LinksBuilder = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  min-height: 12rem;
  padding: var(--spacing-3);
`;

export const LinksHeader = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  justify-content: space-between;
`;

export const LinksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

export const AddLinkWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
`;

export const LinkRow = styled.div`
  align-items: center;
  display: grid;
  gap: var(--spacing-2);
  grid-template-columns: minmax(8.5rem, 10.5rem) minmax(0, 1fr) auto;

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr) auto;
  }
`;

export const LinkItem = styled.div`
  background: var(--bg-subtle);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2);
`;

export const LinksHint = styled.p`
  color: var(--fg-muted);
  font-size: var(--text-sm);
  margin: 0;
`;

export const EmptyLinksState = styled.p`
  align-items: center;
  border: 1px dashed var(--border-muted);
  border-radius: var(--radius-lg);
  color: var(--fg-subtle);
  display: inline-flex;
  font-size: var(--text-sm);
  justify-content: center;
  margin: 0;
  min-height: 3.25rem;
`;

export const LinkSelectCell = styled.div`
  min-width: 0;

  @media (max-width: 640px) {
    grid-column: 1 / -1;
  }
`;

export const LinkUrlCell = styled.div`
  flex: 1;
  min-width: 0;

  .invalid {
    border-color: var(--fg-error);
  }
`;

export const LinkRowHint = styled.p<{$error?: boolean}>`
  color: ${(p) => (p.$error ? 'var(--fg-error)' : 'var(--fg-subtle)')};
  font-size: var(--text-xs);
  margin: 0;
`;

export const LinksFooterNote = styled.p`
  color: var(--fg-muted);
  font-size: var(--text-xs);
  margin: 0;
  margin-left: var(--spacing-2);
  text-align: left;
`;
