import {CheckIcon, Loader2Icon, XIcon} from 'lucide-react';
import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router';
import styled, {css, keyframes} from 'styled-components';
import {Button, Input} from '@play/pylon';
import {trpc} from '@/lib/trpc';

interface CreateOrgDialogProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
}

export function CreateOrgDialog({opened, setOpened}: CreateOrgDialogProps) {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [debouncedSlug, setDebouncedSlug] = useState('');

  // Debounce slug for API check
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSlug(slug);
    }, 300);
    return () => clearTimeout(timer);
  }, [slug]);

  // Check slug availability
  const {data: slugCheck, isFetching: isCheckingSlug} =
    trpc.organization.checkSlug.useQuery(
      {slug: debouncedSlug},
      {
        enabled: debouncedSlug.length >= 3,
        staleTime: 5000,
      },
    );

  const createOrg = trpc.organization.create.useMutation({
    onSuccess: (org) => {
      setOpened(false);
      navigate(`/${org.slug}`);
    },
  });

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 50),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      createOrg.mutate({
        name,
        slug,
      });
    }
  };

  const handleClose = () => {
    setOpened(false);
    // Reset form
    setName('');
    setSlug('');
    setSlugTouched(false);
  };

  const isSlugValid =
    slug.length >= 3 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const isSlugAvailable = slugCheck?.available === true;
  const canSubmit =
    name.length > 0 && isSlugValid && isSlugAvailable && !createOrg.isPending;

  if (!opened) return null;

  return (
    <Backdrop>
      <Dialog>
        <CloseButton onClick={handleClose} type="button">
          <XIcon size={24} />
        </CloseButton>

        <Content>
          <Header>
            <Title>Create a new organization</Title>
            <Subtitle>
              Set up your team's workspace on Play.link Studio
            </Subtitle>
          </Header>

          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Studio"
                size="lg"
                autoFocus
              />
              <HelpText>The display name for your organization.</HelpText>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="org-slug">URL Slug</Label>
              <SlugInputWrapper>
                <SlugPrefix>studio.play.link/</SlugPrefix>
                <SlugInput
                  id="org-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-studio"
                  $hasStatus={slug.length >= 3}
                />
                {slug.length >= 3 && (
                  <SlugStatus>
                    {isCheckingSlug ? (
                      <StatusIcon $status="loading">
                        <Loader2Icon size={18} />
                      </StatusIcon>
                    ) : isSlugAvailable ? (
                      <StatusIcon $status="available">
                        <CheckIcon size={18} />
                      </StatusIcon>
                    ) : (
                      <StatusIcon $status="unavailable">
                        <XIcon size={18} />
                      </StatusIcon>
                    )}
                  </SlugStatus>
                )}
              </SlugInputWrapper>
              <HelpText>
                {slug.length < 3 ? (
                  'At least 3 characters. Lowercase letters, numbers, and hyphens only.'
                ) : isCheckingSlug ? (
                  'Checking availability...'
                ) : isSlugAvailable ? (
                  <AvailableText>This slug is available!</AvailableText>
                ) : (
                  <UnavailableText>This slug is already taken.</UnavailableText>
                )}
              </HelpText>
            </FormGroup>

            {createOrg.error && (
              <ErrorMessage>{createOrg.error.message}</ErrorMessage>
            )}

            <Actions>
              <Button type="button" variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={!canSubmit}>
                {createOrg.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
            </Actions>
          </Form>
        </Content>
      </Dialog>
    </Backdrop>
  );
}

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Dialog = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: var(--spacing-6);
  right: var(--spacing-6);
  padding: var(--spacing-2);
  border-radius: var(--radius-lg);
  color: var(--fg-muted);
  transition:
    color 0.15s,
    background-color 0.15s;

  &:hover {
    color: var(--fg);
    background: var(--bg-hover);
  }
`;

const Content = styled.div`
  width: 100%;
  max-width: 28rem;
  padding: var(--spacing-6);
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: var(--spacing-8);
`;

const Title = styled.h1`
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--fg);
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: var(--text-base);
  color: var(--fg-muted);
  margin: var(--spacing-2) 0 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-6);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const Label = styled.label`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg);
`;

const HelpText = styled.p`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  margin: 0;
`;

const SlugInputWrapper = styled.div`
  display: flex;
  align-items: center;
  background: transparent;
  border: 1px solid var(--input-border-color);
  border-radius: var(--control-radius-lg);
  height: var(--control-height-lg);
  overflow: hidden;

  &:focus-within {
    border-color: var(--input-outline-color);
    outline: 1px solid var(--input-outline-color);
  }
`;

const SlugPrefix = styled.span`
  padding: 0 var(--spacing-3);
  color: var(--fg-muted);
  font-size: var(--text-base);
  background: var(--bg-muted);
  height: 100%;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--input-border-color);
`;

const SlugInput = styled.input<{$hasStatus: boolean}>`
  flex: 1;
  height: 100%;
  padding: 0 var(--spacing-3);
  background: transparent;
  border: none;
  outline: none;
  color: var(--fg);
  font-size: var(--text-base);

  &::placeholder {
    color: var(--fg-placeholder);
  }

  ${(p) =>
    p.$hasStatus &&
    css`
      padding-right: var(--spacing-10);
    `}
`;

const SlugStatus = styled.div`
  position: absolute;
  right: var(--spacing-3);
  display: flex;
  align-items: center;
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const StatusIcon = styled.span<{
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

const AvailableText = styled.span`
  color: var(--fg-success);
`;

const UnavailableText = styled.span`
  color: var(--fg-error);
`;

const ErrorMessage = styled.p`
  color: var(--fg-error);
  font-size: var(--text-sm);
  background: color-mix(in srgb, var(--fg-error) 10%, transparent);
  padding: var(--spacing-3);
  border-radius: var(--radius-lg);
  margin: 0;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-4);
`;
