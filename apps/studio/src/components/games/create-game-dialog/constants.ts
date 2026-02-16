import type {SelectOptionGroup} from '@play/pylon';

export const LINK_OPTIONS: SelectOptionGroup[] = [
  {
    title: 'Platforms',
    options: [
      {value: 'steam', label: 'Steam'},
      {value: 'itch', label: 'itch.io'},
      {value: 'epic', label: 'Epic Games'},
      {value: 'nintendo-switch', label: 'Nintendo Switch'},
      {value: 'playstation', label: 'PlayStation'},
      {value: 'xbox', label: 'Xbox'},
      {value: 'app-store', label: 'App Store'},
      {value: 'google-play', label: 'Google Play'},
    ],
  },
  {
    title: 'Social',
    options: [
      {value: 'discord', label: 'Discord'},
      {value: 'youtube', label: 'YouTube'},
      {value: 'website', label: 'Website'},
      {value: 'demo', label: 'Demo'},
    ],
  },
];

export const TYPE_TO_CATEGORY: Record<string, string> = {
  steam: 'store',
  itch: 'store',
  epic: 'store',
  'nintendo-switch': 'platform',
  playstation: 'platform',
  xbox: 'platform',
  'app-store': 'platform',
  'google-play': 'platform',
  discord: 'community',
  youtube: 'media',
  website: 'other',
  demo: 'other',
};

export const TYPE_TO_LABEL: Record<string, string> = {
  steam: 'Steam',
  itch: 'itch.io',
  epic: 'Epic Games',
  'nintendo-switch': 'Nintendo Switch',
  playstation: 'PlayStation',
  xbox: 'Xbox',
  'app-store': 'App Store',
  'google-play': 'Google Play',
  discord: 'Discord',
  youtube: 'YouTube',
  website: 'Website',
  demo: 'Demo',
};

export const DOMAIN_TO_TYPE: [RegExp, string][] = [
  [/store\.steampowered\.com|steampowered\.com/, 'steam'],
  [/itch\.io/, 'itch'],
  [/epicgames\.com/, 'epic'],
  [/nintendo\.com/, 'nintendo-switch'],
  [/playstation\.com|sony\.com/, 'playstation'],
  [/xbox\.com/, 'xbox'],
  [/apps\.apple\.com/, 'app-store'],
  [/play\.google\.com/, 'google-play'],
  [/discord\.(gg|com)|discordapp\.com/, 'discord'],
  [/youtube\.com|youtu\.be/, 'youtube'],
];
