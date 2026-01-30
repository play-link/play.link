import type {GameStatusType} from '@play/supabase-client';

export interface GameSettingsFormValues {
  title: string;
  slug: string;
  summary: string;
  description: string;
  status: GameStatusType;
  releaseDate: string;
  genres: string[];
  platforms: string[];
  coverUrl: string;
  headerUrl: string;
  trailerUrl: string;
}

export interface SectionProps {
  disabled?: boolean;
}
