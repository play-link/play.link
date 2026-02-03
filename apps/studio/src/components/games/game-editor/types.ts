import type {Tables} from '@play/supabase-client';

export type GameLink = Tables<'game_links'>;
export type GameMedia = Tables<'game_media'>;

export type ButtonStyle = 'glass' | 'solid' | 'outline';
export type ButtonRadius = 'sm' | 'md' | 'lg' | 'full';

export interface PageConfig {
  theme?: {
    bgColor?: string;
    textColor?: string;
    linkColor?: string;
    buttonStyle?: ButtonStyle;
    buttonRadius?: ButtonRadius;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

export interface EditableLink {
  id: string;
  type: string;
  category: string;
  label: string;
  url: string;
  position: number;
  comingSoon?: boolean;
}

export interface EditableMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  position: number;
}

export interface GameMetadata {
  title: string;
  coverUrl: string;
  headerUrl: string;
  trailerUrl: string;
}

export interface EditorSnapshot {
  pageConfig: PageConfig;
  description: string;
  gameMetadata: GameMetadata;
  editLinks: EditableLink[];
  editMedia: EditableMedia[];
}
