export interface CreateGameDialogProps {
  opened: boolean;
  setOpened: (opened: boolean) => void;
}

export type CreateGameStep = 'create' | 'import' | 'links';

export interface FormValues {
  title: string;
  slug: string;
  steamUrl: string;
  links: {type: string; url: string}[];
}

export interface SteamGamePreview {
  appId: string;
  type: 'game' | 'dlc' | 'demo' | 'video' | 'mod' | 'music' | 'unknown';
  isFree: boolean;
  controllerSupport: string | null;
  coverImage: string | null;
  capsuleImage: string | null;
  aboutTheGame: string | null;
  developers: string[];
  genres: string[];
  headerImage: string | null;
  supportedLanguages: {raw: string | null; languages: string[]};
  pcRequirements: unknown;
  macRequirements: unknown;
  linuxRequirements: unknown;
  platforms: string[];
  publishers: string[];
  releaseDate: string | null;
  shortDescription: string | null;
  suggestedLinks: {label: string; type: string; url: string}[];
  steamUrl: string;
  title: string | null;
}
