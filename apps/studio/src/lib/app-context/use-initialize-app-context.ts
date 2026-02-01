import {useEffect, useState} from 'react';
import {useAuth} from '@/lib/auth';
import {trpc} from '@/lib/trpc';
import type {AppContextType, Studio} from './AppContext';

/**
 * Initializes the AppContext with user data from the API.
 * This hook should only be called once at the top level of your app.
 *
 * It combines Supabase auth state with enriched user data from the me.get endpoint.
 */
export function useInitializeAppContext(): AppContextType {
  const {user, loading: authLoading} = useAuth();
  const [activeStudio, setActiveStudio] =
    useState<Studio | null>(null);

  const {data, isLoading: meLoading} = trpc.me.get.useQuery(undefined, {
    enabled: !!user,
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (error.data?.code === 'UNAUTHORIZED') {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Auto-select first studio if none is active
  useEffect(() => {
    if (
      data?.studios &&
      data.studios.length > 0 &&
      !activeStudio
    ) {
      setActiveStudio(data.studios[0] as Studio);
    }
  }, [data?.studios, activeStudio]);

  // Clear active studio when user logs out
  useEffect(() => {
    if (!user) {
      setActiveStudio(null);
    }
  }, [user]);

  const isLoading = authLoading || (!!user && meLoading);

  return {
    me: data
      ? {
          id: user?.id ?? '',
          email: user?.email ?? '',
          displayName: data.profile?.display_name ?? null,
          avatarUrl: data.profile?.avatar_url ?? null,
          studios: (data.studios ?? []) as Studio[],
        }
      : null,
    isLoading,
    activeStudio,
    setActiveStudio,
  };
}
