import type {GameStatusType} from '@play/supabase-client';

export interface GameSettingsFormValues {
  title: string;
  summary: string;
  aboutTheGame: string;
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
