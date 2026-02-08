import {createContext} from 'react';

export type MemberRole = 'OWNER' | 'MEMBER' | 'VIEWER';

export type Studio = {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  cover_url: string | null;
  background_color: string | null;
  accent_color: string | null;
  text_color: string | null;
  bio: string | null;
  social_links: Record<string, string> | null;
  role: MemberRole;
  is_verified: boolean;
};

export type Me = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  studios: Studio[];
};

export type AppContextType = {
  me: Me | null;
  isLoading: boolean;
  activeStudio: Studio | null;
  setActiveStudio: (studio: Studio | null) => void;
};

export const AppContext = createContext<AppContextType>({
  me: null,
  isLoading: true,
  activeStudio: null,
  setActiveStudio: () => {},
});
