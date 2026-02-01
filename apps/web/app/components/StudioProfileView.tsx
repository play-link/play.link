import {
  BadgeCheckIcon,
  Gamepad2Icon,
  GithubIcon,
  GlobeIcon,
  InstagramIcon,
  MessageCircleIcon,
  MusicIcon,
  VideoIcon,
  XIcon,
} from 'lucide-react';
import type {LucideIcon} from 'lucide-react';
import type {StudioProfile} from '../lib/studio.server';

const SOCIAL_ICON_MAP: Record<string, LucideIcon> = {
  website: GlobeIcon,
  twitter: XIcon,
  discord: MessageCircleIcon,
  youtube: VideoIcon,
  tiktok: MusicIcon,
  instagram: InstagramIcon,
  github: GithubIcon,
};

export function StudioProfileView({profile}: {profile: StudioProfile}) {
  const {backgroundColor, textColor, accentColor} = profile.theme;

  return (
    <div className="min-h-screen" style={{backgroundColor, color: textColor}}>
      {/* Cover image */}
      {profile.coverImage && (
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden">
          <img
            src={profile.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{background: `linear-gradient(to bottom, transparent 50%, ${backgroundColor})`}}
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Avatar + Info */}
        <div className={profile.coverImage ? '-mt-16 relative z-10' : 'pt-12'}>
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:text-left gap-4">
            {profile.avatarImage ? (
              <img
                src={profile.avatarImage}
                alt={profile.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 object-cover"
                style={{borderColor: backgroundColor}}
              />
            ) : (
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 flex items-center justify-center text-3xl font-bold"
                style={{borderColor: backgroundColor, backgroundColor: accentColor}}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="pb-2">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{profile.name}</h1>
                {profile.isVerified && (
                  <BadgeCheckIcon className="w-6 h-6" style={{color: accentColor}} />
                )}
              </div>
              <p className="opacity-60">@{profile.handle}</p>
              {profile.bio && <p className="mt-2 max-w-lg">{profile.bio}</p>}
            </div>
          </div>
        </div>

        {/* Social Links */}
        {Object.keys(profile.socialLinks).length > 0 && (
          <div className="flex flex-wrap gap-3 mt-6 justify-center sm:justify-start">
            {Object.entries(profile.socialLinks).map(([platform, url]) => {
              if (!url) return null;
              const Icon = SOCIAL_ICON_MAP[platform] || GlobeIcon;
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
                  style={{backgroundColor: `${accentColor}20`, color: accentColor}}
                >
                  <Icon className="w-4 h-4" />
                  <span className="capitalize">{platform === 'twitter' ? 'X' : platform}</span>
                </a>
              );
            })}
          </div>
        )}

        {/* Games */}
        {profile.games.length > 0 && (
          <div className="mt-12 pb-16">
            <h2 className="text-xl font-semibold mb-6">Games</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.games.map((game) => (
                <a
                  key={game.id}
                  href={`/${game.pageSlug}`}
                  className="group block rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
                  style={{backgroundColor: `${textColor}10`}}
                >
                  {game.coverUrl ? (
                    <img
                      src={game.coverUrl}
                      alt={game.title}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div
                      className="w-full aspect-video flex items-center justify-center"
                      style={{backgroundColor: `${accentColor}30`}}
                    >
                      <Gamepad2Icon className="w-12 h-12 opacity-40" />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold group-hover:underline">{game.title}</h3>
                    {game.summary && (
                      <p className="text-sm mt-1 opacity-70 line-clamp-2">{game.summary}</p>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {profile.games.length === 0 && (
          <div className="mt-12 pb-16 text-center opacity-50">
            <p>No published games yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
