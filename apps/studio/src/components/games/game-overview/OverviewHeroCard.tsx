import {
  GamepadIcon,
  ShareIcon,
} from 'lucide-react';
import type {Tables} from '@play/supabase-client';
import {Badge, Button, Card, IconButton} from '@play/pylon';
import type {GameOutletContext} from '@/pages/GamePage';
import {
  CoverImage,
  CoverPlaceholder,
  CoverThumb,
  HeroActions,
  HeroHelperText,
  HeroInfo,
  HeroLeft,
  HeroTopRow,
  SlugRow,
  SlugTitle,
} from './styles';

interface OverviewHeroCardProps {
  game: GameOutletContext;
  primaryPage?: Tables<'game_pages'>;
  publishState: 'draft' | 'verifying' | 'live';
  canPublish: boolean;
  publishDisabledReason: 'not_verified' | 'verifying' | null;
  isPublishing: boolean;
  onShareClick: () => void;
  onPublish: () => void;
  onVerifyNow: () => void;
  onRequestUnpublish: () => void;
}

export function OverviewHeroCard({
  game,
  primaryPage,
  publishState,
  canPublish,
  publishDisabledReason,
  isPublishing,
  onShareClick,
  onPublish,
  onVerifyNow,
  onRequestUnpublish,
}: OverviewHeroCardProps) {
  const isLive = publishState === 'live';
  const showVerifyNow =
    publishState === 'draft' && publishDisabledReason === 'not_verified';
  const helperText =
    publishDisabledReason === 'verifying'
      ? 'We’re verifying your game… you’ll be able to publish once approved.'
      : publishDisabledReason === 'not_verified'
        ? 'Verify ownership to publish this page.'
        : null;

  const badgeIntent = publishState === 'live' ? 'success' : 'info';
  const badgeLabel = publishState === 'live' ? 'Published' : 'Draft';

  return (
    <Card className="flex items-start justify-gap-6">
      <HeroLeft>
        <CoverThumb>
          {game.cover_url ? (
            <CoverImage src={game.cover_url} alt={game.title} />
          ) : (
            <CoverPlaceholder>
              <GamepadIcon size={32} />
            </CoverPlaceholder>
          )}
        </CoverThumb>
        <HeroInfo>
          <HeroTopRow>
            <SlugRow>
              {primaryPage ? (
                <SlugTitle>play.link/{primaryPage.slug}</SlugTitle>
              ) : (
                <SlugTitle>{game.title}</SlugTitle>
              )}
              <Badge intent={badgeIntent} size="sm">
                {badgeLabel}
              </Badge>
            </SlugRow>
            <IconButton
              icon={ShareIcon}
              variant="default"
              size="lg"
              onClick={onShareClick}
              aria-label="Share"
            />
          </HeroTopRow>

          <HeroActions>
            {!isLive ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onPublish}
                disabled={!canPublish || isPublishing}
              >
                Publish
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={onRequestUnpublish}>
                Unpublish
              </Button>
            )}

            {showVerifyNow && (
              <Button variant="outline" size="sm" onClick={onVerifyNow}>
                Verify now
              </Button>
            )}
          </HeroActions>

          {!!helperText && <HeroHelperText>{helperText}</HeroHelperText>}
        </HeroInfo>
      </HeroLeft>
    </Card>
  );
}
