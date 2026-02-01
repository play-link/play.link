import {useCallback, useMemo, useState} from 'react';
import {useNavigate} from 'react-router';
import styled from 'styled-components';
import {Button, DialogOverlay, Input, Select, useSnackbar} from '@play/pylon';
import type {Tables} from '@play/supabase-client';
import {ContextLevel, useAppContext} from '@/lib/app-context';
import {trpc} from '@/lib/trpc';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

const DESTINATION_OPTIONS = [
  {label: 'Game page', value: 'game_page'},
  {label: 'Steam', value: 'steam'},
  {label: 'Epic', value: 'epic'},
  {label: 'Itch.io', value: 'itch'},
  {label: 'Custom URL', value: 'custom'},
];

interface CreateCampaignDialogProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
}

export function CreateCampaignDialog({opened, setOpened}: CreateCampaignDialogProps) {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);
  const navigate = useNavigate();
  const {showSnackbar} = useSnackbar();

  const {data: games = []} = trpc.game.list.useQuery({
    studioId: activeStudio.id,
  });

  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('');
  const [destination, setDestination] = useState('game_page');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');

  const gameOptions = useMemo(
    () => games.map((g: any) => ({label: g.title, value: g.id})),
    [games],
  );

  const selectedGame = games.find((g: any) => g.id === gameId) as any;
  const gameSlug =
    selectedGame?.pages?.[0]?.slug ||
    (selectedGame?.pages as Tables<'game_pages'>[] | undefined)?.find(
      (p: any) => p.is_primary,
    )?.slug ||
    'your-game';

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setName(val);
      if (!slugEdited) {
        setSlug(slugify(val));
      }
    },
    [slugEdited],
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlug(slugify(e.target.value));
      setSlugEdited(true);
    },
    [],
  );

  const previewUrl = `play.link/g/${gameSlug}?c=${slug || 'your-slug'}`;

  const resetForm = () => {
    setName('');
    setGameId('');
    setDestination('game_page');
    setDestinationUrl('');
    setSlug('');
    setSlugEdited(false);
    setUtmSource('');
    setUtmMedium('');
    setUtmCampaign('');
  };

  const createMutation = trpc.campaign.create.useMutation({
    onSuccess: (data) => {
      showSnackbar({message: 'Campaign created', severity: 'success'});
      setOpened(false);
      resetForm();
      navigate(`/${activeStudio.slug}/campaigns/${data.id}`);
    },
    onError: (error) => {
      showSnackbar({message: error.message, severity: 'error'});
    },
  });

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !gameId || !slug.trim()) return;

    createMutation.mutate({
      gameId,
      name: name.trim(),
      slug: slug.trim(),
      destination: destination as 'game_page' | 'steam' | 'epic' | 'itch' | 'custom',
      destinationUrl: destination === 'custom' ? destinationUrl : undefined,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
    });
  }, [name, gameId, slug, destination, destinationUrl, utmSource, utmMedium, utmCampaign, createMutation]);

  const canSubmit = name.trim() && gameId && slug.trim() && !createMutation.isPending;

  return (
    <DialogOverlay opened={opened} setOpened={setOpened} size="lg">
      <DialogOverlay.Header>Create Campaign</DialogOverlay.Header>
      <DialogOverlay.Content>
        <FormBody>
          <FormSection>
            <Label>Campaign name</Label>
            <Input
              placeholder="e.g. Twitter Launch, Steam Wishlist Push"
              value={name}
              onChange={handleNameChange}
              fullWidth
            />
          </FormSection>

          <FormSection>
            <Label>Game</Label>
            <Select
              options={gameOptions}
              value={gameId}
              onChange={(e) => setGameId((e.target as HTMLSelectElement).value)}
              placeholder="Select a game"
              fullWidth
            />
          </FormSection>

          <FormSection>
            <Label>Destination</Label>
            <Select
              options={DESTINATION_OPTIONS}
              value={destination}
              onChange={(e) => setDestination((e.target as HTMLSelectElement).value)}
              fullWidth
            />
            {destination === 'custom' && (
              <Input
                placeholder="https://store.steampowered.com/app/..."
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                style={{marginTop: 'var(--spacing-2)'}}
                fullWidth
              />
            )}
          </FormSection>

          <FormSection>
            <Label>Campaign slug</Label>
            <Input
              placeholder="twitter-launch"
              value={slug}
              onChange={handleSlugChange}
              fullWidth
            />
            <Hint>Used in the tracking URL as ?c={slug || '...'}</Hint>
          </FormSection>

          <Divider />

          <SectionHeading>UTM Parameters (optional)</SectionHeading>

          <FormRow>
            <FormSection>
              <Label>Source</Label>
              <Input
                placeholder="twitter"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                fullWidth
              />
            </FormSection>
            <FormSection>
              <Label>Medium</Label>
              <Input
                placeholder="social"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                fullWidth
              />
            </FormSection>
            <FormSection>
              <Label>Campaign</Label>
              <Input
                placeholder="launch-2026"
                value={utmCampaign}
                onChange={(e) => setUtmCampaign(e.target.value)}
                fullWidth
              />
            </FormSection>
          </FormRow>

          <Divider />

          <PreviewSection>
            <Label>Tracking URL preview</Label>
            <PreviewUrl>{previewUrl}</PreviewUrl>
          </PreviewSection>
        </FormBody>
      </DialogOverlay.Content>
      <DialogOverlay.Footer>
        <Button variant="ghost" onClick={() => setOpened(false)}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
        </Button>
      </DialogOverlay.Footer>
    </DialogOverlay>
  );
}

const FormBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-4);
`;

const Label = styled.label`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--fg);
`;

const Hint = styled.span`
  font-size: var(--text-xs);
  color: var(--fg-subtle);
`;

const SectionHeading = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg-muted);
  margin: 0;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border-muted);
  margin: 0;
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const PreviewUrl = styled.code`
  font-size: var(--text-sm);
  color: var(--fg-muted);
  background: var(--bg-muted);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-md);
  font-family: var(--font-mono, monospace);
  word-break: break-all;
`;
