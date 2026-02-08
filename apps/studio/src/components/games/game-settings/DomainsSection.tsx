import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import {useState} from 'react';
import {useOutletContext} from 'react-router';
import styled from 'styled-components';
import {Button, Input, useSnackbar} from '@play/pylon';
import {DomainStatus, DomainTargetType} from '@play/supabase-client';
import type {GameOutletContext} from '@/pages/GamePage';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';
import {Section, SectionTitle} from './shared';

type DomainStatusType = (typeof DomainStatus)[keyof typeof DomainStatus];

export function DomainsSection() {
  const game = useOutletContext<GameOutletContext>();
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();
  const [newHostname, setNewHostname] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const {data: domains = [], isLoading} = trpc.customDomain.listByGame.useQuery({
    gameId: game.id,
  });

  const addDomain = trpc.customDomain.add.useMutation({
    onSuccess: (domain) => {
      showSnackbar({message: 'Domain added', severity: 'success'});
      setNewHostname('');
      setExpandedDomain(domain.id);
      utils.customDomain.listByGame.invalidate({gameId: game.id});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const verifyDomain = trpc.customDomain.verify.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Domain verified! Now complete Step 2.', severity: 'success'});
      utils.customDomain.listByGame.invalidate({gameId: game.id});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
      utils.customDomain.listByGame.invalidate({gameId: game.id});
    },
  });

  const removeDomain = trpc.customDomain.remove.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Domain removed', severity: 'success'});
      utils.customDomain.listByGame.invalidate({gameId: game.id});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleAddDomain = () => {
    if (!newHostname.trim()) return;
    addDomain.mutate({
      studioId: activeStudio.id,
      hostname: newHostname.trim(),
      targetType: DomainTargetType.GAME,
      targetId: game.id,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar({message: `${label} copied`, severity: 'success'});
  };

  return (
    <Section>
      <SectionTitle>Custom Domain</SectionTitle>
      <Description>
        Use your own domain for this game (e.g., yourgame.com)
      </Description>

      <AddDomainForm>
        <Input
          placeholder="yourgame.com"
          value={newHostname}
          onChange={(e) => setNewHostname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleAddDomain}
          disabled={!newHostname.trim() || addDomain.isPending}
        >
          <Plus size={14} />
          Add
        </Button>
      </AddDomainForm>

      {isLoading ? (
        <LoadingState>
          <Loader2 className="animate-spin" size={16} />
          Loading...
        </LoadingState>
      ) : domains.length === 0 ? (
        <EmptyState>
          <Globe size={20} />
          <span>No custom domains</span>
        </EmptyState>
      ) : (
        <DomainsList>
          {domains.map((domain) => (
            <DomainItem key={domain.id}>
              <DomainHeader
                onClick={() =>
                  setExpandedDomain(
                    expandedDomain === domain.id ? null : domain.id,
                  )
                }
              >
                <DomainInfo>
                  <ExpandIcon>
                    {expandedDomain === domain.id ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </ExpandIcon>
                  <DomainName>{domain.hostname}</DomainName>
                  <StatusBadge $status={domain.status as DomainStatusType}>
                    <StatusIcon status={domain.status as DomainStatusType} />
                    {domain.status}
                  </StatusBadge>
                </DomainInfo>
                <DomainActions onClick={(e) => e.stopPropagation()}>
                  {(domain.status === DomainStatus.PENDING || domain.status === DomainStatus.FAILED) && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => verifyDomain.mutate({domainId: domain.id})}
                      disabled={verifyDomain.isPending}
                    >
                      {verifyDomain.isPending &&
                      verifyDomain.variables?.domainId === domain.id ? (
                        <Loader2 className="animate-spin" size={12} />
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDomain.mutate({domainId: domain.id})}
                    disabled={removeDomain.isPending}
                  >
                    <Trash2 size={12} />
                  </Button>
                </DomainActions>
              </DomainHeader>

              {expandedDomain === domain.id && (
                <DomainDetails>
                  {domain.error && (
                    <ErrorMessage>
                      <AlertCircle size={12} />
                      {domain.error}
                    </ErrorMessage>
                  )}

                  <StepsContainer>
                    {/* Step 1: Verify ownership */}
                    <StepCard $completed={domain.status === DomainStatus.VERIFIED}>
                      <StepHeader>
                        <StepNumber $completed={domain.status === DomainStatus.VERIFIED}>1</StepNumber>
                        <StepTitle>Verify ownership</StepTitle>
                        {domain.status === DomainStatus.VERIFIED && <CheckCircle2 size={14} />}
                      </StepHeader>
                      <StepContent>
                        <p>Add this TXT record to your DNS:</p>
                        <DnsRecord>
                          <RecordRow>
                            <RecordLabel>Name</RecordLabel>
                            <RecordValue>
                              <code>_playlink-verification</code>
                              <CopyButton onClick={() => copyToClipboard('_playlink-verification', 'Name')}>
                                <Copy size={10} />
                              </CopyButton>
                            </RecordValue>
                          </RecordRow>
                          <RecordRow>
                            <RecordLabel>Value</RecordLabel>
                            <RecordValue>
                              <code>{domain.verification_token}</code>
                              <CopyButton onClick={() => copyToClipboard(domain.verification_token, 'Token')}>
                                <Copy size={10} />
                              </CopyButton>
                            </RecordValue>
                          </RecordRow>
                        </DnsRecord>
                      </StepContent>
                    </StepCard>

                    {/* Step 2: Connect via Cloudflare */}
                    <StepCard $completed={false} $disabled={domain.status !== DomainStatus.VERIFIED}>
                      <StepHeader>
                        <StepNumber $completed={false}>2</StepNumber>
                        <StepTitle>Connect via Cloudflare (free)</StepTitle>
                      </StepHeader>
                      <StepContent>
                        <RequirementNote>
                          Your domain must be on Cloudflare for free SSL.
                          <ExternalLinkButton href="https://dash.cloudflare.com/?to=/:account/add-site" target="_blank" rel="noopener">
                            Open Cloudflare <ExternalLink size={10} />
                          </ExternalLinkButton>
                        </RequirementNote>
                        <p>Add a CNAME record:</p>
                        <DnsRecord>
                          <RecordRow>
                            <RecordLabel>Name</RecordLabel>
                            <RecordValue><code>@</code></RecordValue>
                          </RecordRow>
                          <RecordRow>
                            <RecordLabel>Target</RecordLabel>
                            <RecordValue>
                              <code>play.link</code>
                              <CopyButton onClick={() => copyToClipboard('play.link', 'Target')}>
                                <Copy size={10} />
                              </CopyButton>
                            </RecordValue>
                          </RecordRow>
                          <RecordRow>
                            <RecordLabel>Proxy</RecordLabel>
                            <RecordValue>
                              <ProxyBadge>ON (orange cloud)</ProxyBadge>
                            </RecordValue>
                          </RecordRow>
                        </DnsRecord>
                        <AlternativeNote>
                          Other CDNs (Fastly, CloudFront, etc.) also work.
                        </AlternativeNote>
                      </StepContent>
                    </StepCard>

                    {domain.status === DomainStatus.VERIFIED && (
                      <SuccessNote>
                        <CheckCircle2 size={14} />
                        Step 1 done! Complete Step 2 to activate.
                      </SuccessNote>
                    )}
                  </StepsContainer>
                </DomainDetails>
              )}
            </DomainItem>
          ))}
        </DomainsList>
      )}
    </Section>
  );
}

function StatusIcon({status}: {status: DomainStatusType}) {
  switch (status) {
    case DomainStatus.PENDING:
      return <Clock size={10} />;
    case DomainStatus.VERIFYING:
      return <Loader2 size={10} className="animate-spin" />;
    case DomainStatus.VERIFIED:
      return <CheckCircle2 size={10} />;
    case DomainStatus.FAILED:
      return <XCircle size={10} />;
    default:
      return null;
  }
}

const Description = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
`;

const AddDomainForm = styled.div`
  display: flex;
  gap: var(--spacing-2);
  align-items: center;

  > div:first-child {
    flex: 1;
    max-width: 280px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--fg-muted);
  font-size: var(--text-sm);
`;

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--fg-muted);
  font-size: var(--text-sm);
`;

const DomainsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const DomainItem = styled.div`
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  overflow: hidden;
`;

const DomainHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--bg-muted);
  }
`;

const DomainInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
`;

const ExpandIcon = styled.span`
  color: var(--fg-muted);
`;

const DomainName = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg);
`;

const StatusBadge = styled.span<{$status: DomainStatusType}>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  text-transform: capitalize;

  ${({$status}) => {
    switch ($status) {
      case DomainStatus.PENDING:
        return `background: var(--color-warning-500); color: var(--white);`;
      case DomainStatus.VERIFYING:
        return `background: var(--color-primary-500); color: var(--white);`;
      case DomainStatus.VERIFIED:
        return `background: var(--color-success-500); color: var(--white);`;
      case DomainStatus.FAILED:
        return `background: var(--color-error-500); color: var(--white);`;
      default:
        return '';
    }
  }}
`;

const DomainActions = styled.div`
  display: flex;
  gap: var(--spacing-1);
`;

const DomainDetails = styled.div`
  padding: var(--spacing-4);
  border-top: 1px solid var(--border-muted);
  background: var(--bg-muted);
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  background: var(--color-error-500);
  color: var(--white);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  margin-bottom: var(--spacing-3);
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
`;

const StepCard = styled.div<{$completed?: boolean; $disabled?: boolean}>`
  background: var(--bg-surface);
  border: 1px solid ${({$completed}) => $completed ? 'var(--color-success-500)' : 'var(--border-muted)'};
  border-radius: var(--radius-md);
  padding: var(--spacing-3);
  opacity: ${({$disabled}) => $disabled ? 0.6 : 1};
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-2);
  color: var(--color-success-500);
`;

const StepNumber = styled.div<{$completed?: boolean}>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-bold);
  background: ${({$completed}) => $completed ? 'var(--color-success-500)' : 'var(--color-primary-500)'};
  color: var(--white);
`;

const StepTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg);
  flex: 1;
`;

const StepContent = styled.div`
  font-size: var(--text-xs);
  color: var(--fg-muted);

  > p {
    margin: 0 0 var(--spacing-2);
  }
`;

const DnsRecord = styled.div`
  background: var(--bg-muted);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin: var(--spacing-2) 0;
`;

const RecordRow = styled.div`
  display: flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-2);
  border-bottom: 1px solid var(--border-muted);
  font-size: var(--text-xs);

  &:last-child {
    border-bottom: none;
  }
`;

const RecordLabel = styled.span`
  width: 60px;
  color: var(--fg-muted);
`;

const RecordValue = styled.span`
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  color: var(--fg);

  code {
    font-family: var(--font-mono);
    font-size: 10px;
    background: var(--bg-surface);
    padding: 1px 4px;
    border-radius: var(--radius-sm);
  }
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: transparent;
  border: none;
  color: var(--fg-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);

  &:hover {
    color: var(--fg);
    background: var(--bg-surface);
  }
`;

const RequirementNote = styled.p`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  color: var(--fg);
  margin-bottom: var(--spacing-2);
`;

const ExternalLinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: var(--color-primary-500);
  color: var(--white);
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  text-decoration: none;

  &:hover {
    background: var(--color-primary-600);
  }
`;

const ProxyBadge = styled.span`
  background: #f48120;
  color: var(--white);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
`;

const SuccessNote = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-success-500);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
`;

const AlternativeNote = styled.p`
  font-size: 10px;
  color: var(--fg-subtle);
  margin: var(--spacing-2) 0 0;
  font-style: italic;
`;
