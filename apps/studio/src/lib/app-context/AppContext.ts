import {createContext} from 'react';

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: MemberRole;
};

export type Me = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  organizations: Organization[];
};

export type AppContextType = {
  me: Me | null;
  isLoading: boolean;
  activeOrganization: Organization | null;
  setActiveOrganization: (org: Organization | null) => void;
};

export const AppContext = createContext<AppContextType>({
  me: null,
  isLoading: true,
  activeOrganization: null,
  setActiveOrganization: () => {},
});
