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
import styled from 'styled-components';
import {Button, Card, Input, useSnackbar} from '@play/pylon';
import {DomainStatus, DomainTargetType} from '@play/supabase-client';
import {trpc} from '@/lib/trpc';

interface DomainsSectionProps {
  studioId: string;
  studioSlug: string;
}

type DomainStatusType = (typeof DomainStatus)[keyof typeof DomainStatus];

export function DomainsSection({studioId, studioSlug}: DomainsSectionProps) {
  const {showSnackbar} = useSnackbar();
  const utils = trpc.useUtils();
  const [newHostname, setNewHostname] = useState('');
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);

  const {data: domains = [], isLoading} = trpc.customDomain.list.useQuery({
    studioId,
  });

  const addDomain = trpc.customDomain.add.useMutation({
    onSuccess: (domain) => {
      showSnackbar({message: 'Domain added', severity: 'success'});
      setNewHostname('');
      setExpandedDomain(domain.id);
      utils.customDomain.list.invalidate({studioId});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const verifyDomain = trpc.customDomain.verify.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Domain verified! Now complete Step 2 to activate it.', severity: 'success'});
      utils.customDomain.list.invalidate({studioId});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
      utils.customDomain.list.invalidate({studioId});
    },
  });

  const removeDomain = trpc.customDomain.remove.useMutation({
    onSuccess: () => {
      showSnackbar({message: 'Domain removed', severity: 'success'});
      utils.customDomain.list.invalidate({studioId});
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleAddDomain = () => {
    if (!newHostname.trim()) return;
    addDomain.mutate({
      studioId,
      hostname: newHostname.trim(),
      targetType: DomainTargetType.STUDIO,
      targetId: studioId,
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSnackbar({message: `${label} copied`, severity: 'success'});
  };

  const studioDomains = domains.filter(
    (d) => d.target_type === DomainTargetType.STUDIO,
  );

  return (
    <Container>
      <Header>
        <div>
          <Title>Custom Domains</Title>
          <Subtitle>
            Use your own domain for your studio profile (e.g., mystudio.com
            instead of play.link/@{studioSlug})
          </Subtitle>
        </div>
      </Header>

      <AddDomainForm>
        <Input
          label="Add Domain"
          placeholder="mystudio.com"
          value={newHostname}
          onChange={(e) => setNewHostname(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
        />
        <Button
          variant="primary"
          onClick={handleAddDomain}
          disabled={!newHostname.trim() || addDomain.isPending}
        >
          <Plus size={16} />
          Add Domain
        </Button>
      </AddDomainForm>

      {isLoading ? (
        <LoadingState>
          <Loader2 className="animate-spin" size={24} />
          Loading domains...
        </LoadingState>
      ) : studioDomains.length === 0 ? (
        <EmptyState>
          <Globe size={32} />
          <p>No custom domains configured yet</p>
        </EmptyState>
      ) : (
        <DomainsList>
          {studioDomains.map((domain) => (
            <DomainCard key={domain.id}>
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
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
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
                        <Loader2 className="animate-spin" size={14} />
                      ) : domain.status === DomainStatus.FAILED ? (
                        'Retry'
                      ) : (
                        'Verify DNS'
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDomain.mutate({domainId: domain.id})}
                    disabled={removeDomain.isPending}
                  >
                    <Trash2 size={14} />
                  </Button>
                </DomainActions>
              </DomainHeader>

              {expandedDomain === domain.id && (
                <DomainDetails>
                  {domain.error && (
                    <ErrorMessage>
                      <AlertCircle size={14} />
                      {domain.error}
                    </ErrorMessage>
                  )}

                  <StepsContainer>
                    <StepCard $completed={domain.status === DomainStatus.VERIFIED}>
                      <StepHeader>
                        <StepNumber $completed={domain.status === DomainStatus.VERIFIED}>1</StepNumber>
                        <StepTitle>Verify domain ownership</StepTitle>
                        {domain.status === DomainStatus.VERIFIED && <CheckCircle2 size={16} className="text-green-500" />}
                      </StepHeader>
                      <StepContent>
                        <p>Add this TXT record to your domain's DNS settings:</p>
                        <DnsRecord>
                          <RecordRow>
                            <RecordLabel>Type</RecordLabel>
                            <RecordValue>TXT</RecordValue>
                          </RecordRow>
                          <RecordRow>
                            <RecordLabel>Name / Host</RecordLabel>
                            <RecordValue>
                              <code>_playlink-verification</code>
                              <CopyButton
                                onClick={() => copyToClipboard('_playlink-verification', 'Name')}
                                title="Copy"
                              >
                                <Copy size={12} />
                              </CopyButton>
                            </RecordValue>
                          </RecordRow>
                          <RecordRow>
                            <RecordLabel>Value / Content</RecordLabel>
                            <RecordValue>
                              <code>{domain.verification_token}</code>
                              <CopyButton
                                onClick={() => copyToClipboard(domain.verification_token, 'Token')}
                                title="Copy"
                              >
                                <Copy size={12} />
                              </CopyButton>
                            </RecordValue>
                          </RecordRow>
                        </DnsRecord>
                        {domain.status !== DomainStatus.VERIFIED && (
                          <StepNote>
                            After adding the record, click "Verify DNS" above. DNS propagation can take up to 48 hours.
                          </StepNote>
                        )}
                      </StepContent>
                    </StepCard>

                    <StepCard $completed={false} $disabled={domain.status !== DomainStatus.VERIFIED}>
                      <StepHeader>
                        <StepNumber $completed={false}>2</StepNumber>
                        <StepTitle>Connect your domain via Cloudflare (free)</StepTitle>
                      </StepHeader>
                      <StepContent>
                        <RequirementBox>
                          <strong>Requirement:</strong> Your domain must be on Cloudflare (free tier works).
                          This is needed for automatic SSL certificates.
                        </RequirementBox>

                        <InstructionsList>
                          <li>
                            <strong>a)</strong> Add your domain to Cloudflare if you haven't already
                            <ExternalLinkButton href="https://dash.cloudflare.com/?to=/:account/add-site" target="_blank" rel="noopener">
                              Open Cloudflare <ExternalLink size={12} />
                            </ExternalLinkButton>
                          </li>
                          <li>
                            <strong>b)</strong> Go to DNS settings for your domain
                          </li>
                          <li>
                            <strong>c)</strong> Add a CNAME record:
                            <DnsRecord>
                              <RecordRow>
                                <RecordLabel>Type</RecordLabel>
                                <RecordValue>CNAME</RecordValue>
                              </RecordRow>
                              <RecordRow>
                                <RecordLabel>Name</RecordLabel>
                                <RecordValue>
                                  <code>@</code> (or <code>www</code> for www.{domain.hostname})
                                </RecordValue>
                              </RecordRow>
                              <RecordRow>
                                <RecordLabel>Target</RecordLabel>
                                <RecordValue>
                                  <code>play.link</code>
                                  <CopyButton
                                    onClick={() => copyToClipboard('play.link', 'Target')}
                                    title="Copy"
                                  >
                                    <Copy size={12} />
                                  </CopyButton>
                                </RecordValue>
                              </RecordRow>
                              <RecordRow>
                                <RecordLabel>Proxy status</RecordLabel>
                                <RecordValue>
                                  <ProxyBadge>Proxied (orange cloud ON)</ProxyBadge>
                                </RecordValue>
                              </RecordRow>
                            </DnsRecord>
                          </li>
                        </InstructionsList>

                        <StepNote>
                          <strong>Important:</strong> The orange cloud (Proxy) must be ON. This enables Cloudflare to provide free SSL for your domain.
                        </StepNote>
                        <AlternativeNote>
                          Using a different CDN? This also works with Fastly, AWS CloudFront, Vercel, or any CDN that provides SSL. Just point your domain to <code>play.link</code>.
                        </AlternativeNote>
                      </StepContent>
                    </StepCard>

                    {domain.status === DomainStatus.VERIFIED && (
                      <SuccessBox>
                        <CheckCircle2 size={20} />
                        <div>
                          <strong>Step 1 complete!</strong>
                          <p>Now complete Step 2 to activate your domain. Once the CNAME is set up with Cloudflare proxy enabled, visitors to <strong>{domain.hostname}</strong> will see your studio profile.</p>
                        </div>
                      </SuccessBox>
                    )}
                  </StepsContainer>
                </DomainDetails>
              )}
            </DomainCard>
          ))}
        </DomainsList>
      )}
    </Container>
  );
}

function StatusIcon({status}: {status: DomainStatusType}) {
  switch (status) {
    case DomainStatus.PENDING:
      return <Clock size={12} />;
    case DomainStatus.VERIFYING:
      return <Loader2 size={12} className="animate-spin" />;
    case DomainStatus.VERIFIED:
      return <CheckCircle2 size={12} />;
    case DomainStatus.FAILED:
      return <XCircle size={12} />;
    default:
      return null;
  }
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const Title = styled.h3`
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: var(--spacing-1) 0 0;
`;

const AddDomainForm = styled.div`
  display: flex;
  gap: var(--spacing-3);
  align-items: flex-end;

  > div:first-child {
    flex: 1;
    max-width: 400px;
  }
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--fg-muted);
  padding: var(--spacing-4);
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-8);
  color: var(--fg-muted);
  text-align: center;
`;

const DomainsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
`;

const DomainCard = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const DomainHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-4);
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--bg-muted);
  }
`;

const DomainInfo = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
`;

const ExpandIcon = styled.span`
  color: var(--fg-muted);
`;

const DomainName = styled.span`
  font-weight: var(--font-weight-medium);
  color: var(--fg);
`;

const StatusBadge = styled.span<{$status: DomainStatusType}>`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: 2px 8px;
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
  gap: var(--spacing-2);
`;

const DomainDetails = styled.div`
  padding: var(--spacing-5);
  border-top: 1px solid var(--border-muted);
  background: var(--bg-muted);
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3);
  background: var(--color-error-500);
  color: var(--white);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-4);
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const StepCard = styled.div<{$completed?: boolean; $disabled?: boolean}>`
  background: var(--bg-surface);
  border: 1px solid ${({$completed}) => $completed ? 'var(--color-success-500)' : 'var(--border-muted)'};
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  opacity: ${({$disabled}) => $disabled ? 0.6 : 1};
`;

const StepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-3);
`;

const StepNumber = styled.div<{$completed?: boolean}>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-bold);
  background: ${({$completed}) => $completed ? 'var(--color-success-500)' : 'var(--color-primary-500)'};
  color: var(--white);
`;

const StepTitle = styled.h4`
  font-size: var(--text-base);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
  flex: 1;
`;

const StepContent = styled.div`
  font-size: var(--text-sm);
  color: var(--fg-muted);

  > p {
    margin: 0 0 var(--spacing-3);
  }
`;

const DnsRecord = styled.div`
  background: var(--bg-muted);
  border: 1px solid var(--border-muted);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin: var(--spacing-3) 0;
`;

const RecordRow = styled.div`
  display: flex;
  align-items: center;
  padding: var(--spacing-2) var(--spacing-3);
  border-bottom: 1px solid var(--border-muted);

  &:last-child {
    border-bottom: none;
  }
`;

const RecordLabel = styled.span`
  width: 120px;
  font-weight: var(--font-weight-medium);
  color: var(--fg-muted);
  font-size: var(--text-xs);
  text-transform: uppercase;
`;

const RecordValue = styled.span`
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--fg);

  code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: var(--bg-surface);
    padding: 2px 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border-muted);
  }
`;

const CopyButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--fg-muted);
  cursor: pointer;
  border-radius: var(--radius-sm);

  &:hover {
    color: var(--fg);
    background: var(--bg-muted);
  }
`;

const StepNote = styled.p`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  margin: var(--spacing-3) 0 0;
  font-style: italic;
`;

const RequirementBox = styled.div`
  background: var(--color-primary-500);
  color: var(--white);
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-4);

  strong {
    display: block;
    margin-bottom: var(--spacing-1);
  }
`;

const InstructionsList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);

  > li {
    color: var(--fg);

    strong {
      color: var(--fg);
    }
  }
`;

const ExternalLinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1);
  margin-left: var(--spacing-2);
  padding: 4px 8px;
  background: var(--color-primary-500);
  color: var(--white);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  text-decoration: none;

  &:hover {
    background: var(--color-primary-600);
  }
`;

const ProxyBadge = styled.span`
  background: #f48120;
  color: var(--white);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
`;

const SuccessBox = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--color-success-500);
  color: var(--white);
  border-radius: var(--radius-lg);

  strong {
    display: block;
    margin-bottom: var(--spacing-1);
  }

  p {
    margin: 0;
    opacity: 0.9;
    font-size: var(--text-sm);
  }
`;

const AlternativeNote = styled.p`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
  margin: var(--spacing-3) 0 0;
  padding: var(--spacing-2);
  background: var(--bg-muted);
  border-radius: var(--radius-sm);
  border: 1px dashed var(--border-muted);

  code {
    font-family: var(--font-mono);
    background: var(--bg-surface);
    padding: 1px 4px;
    border-radius: var(--radius-sm);
  }
`;
