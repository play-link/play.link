import {use} from 'react';
import {AppContext} from './AppContext';
import type {AppContextType} from './AppContext';

export enum ContextLevel {
  Authenticated = 'authenticated',
  AuthenticatedWithStudio = 'authenticated-with-studio',
}

type UseAppContextReturnType<T extends ContextLevel | undefined> =
  AppContextType & {
    me: T extends ContextLevel.Authenticated | ContextLevel.AuthenticatedWithStudio
      ? NonNullable<AppContextType['me']>
      : AppContextType['me'];
    activeStudio: T extends ContextLevel.AuthenticatedWithStudio
      ? NonNullable<AppContextType['activeStudio']>
      : AppContextType['activeStudio'];
  };

/**
 * useAppContext Hook
 *
 * Consumes the global AppContext. Optionally enforces authentication requirements.
 *
 * @param requirement - Optional enforcement level:
 *   - `ContextLevel.Authenticated`: Throws if no user (me) is present
 *   - `ContextLevel.AuthenticatedWithStudio`: Throws if no user or no active studio
 *
 * @returns AppContext with typed fields based on the requirement level
 * @throws Error if the requirement is not met
 *
 * @example
 * // Basic usage - me and activeStudio can be null
 * const { me, activeStudio } = useAppContext();
 *
 * @example
 * // Require authenticated user - me is guaranteed non-null
 * const { me } = useAppContext(ContextLevel.Authenticated);
 *
 * @example
 * // Require user and studio - both guaranteed non-null
 * const { me, activeStudio } = useAppContext(ContextLevel.AuthenticatedWithStudio);
 */
export function useAppContext<T extends ContextLevel | undefined>(
  requirement?: T,
): UseAppContextReturnType<T> {
  const context = use(AppContext);

  if (requirement === ContextLevel.Authenticated && !context.me) {
    throw new Error('useAppContext: User must be authenticated');
  }

  if (
    requirement === ContextLevel.AuthenticatedWithStudio &&
    (!context.me || !context.activeStudio)
  ) {
    throw new Error(
      'useAppContext: User must be authenticated with an active studio',
    );
  }

  return context as UseAppContextReturnType<T>;
}
