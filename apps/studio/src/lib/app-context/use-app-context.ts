import {use} from 'react';
import {AppContext} from './AppContext';
import type {AppContextType} from './AppContext';

export enum ContextLevel {
  Authenticated = 'authenticated',
  AuthenticatedWithOrg = 'authenticated-with-org',
}

type UseAppContextReturnType<T extends ContextLevel | undefined> =
  AppContextType & {
    me: T extends ContextLevel.Authenticated | ContextLevel.AuthenticatedWithOrg
      ? NonNullable<AppContextType['me']>
      : AppContextType['me'];
    activeOrganization: T extends ContextLevel.AuthenticatedWithOrg
      ? NonNullable<AppContextType['activeOrganization']>
      : AppContextType['activeOrganization'];
  };

/**
 * useAppContext Hook
 *
 * Consumes the global AppContext. Optionally enforces authentication requirements.
 *
 * @param requirement - Optional enforcement level:
 *   - `ContextLevel.Authenticated`: Throws if no user (me) is present
 *   - `ContextLevel.AuthenticatedWithOrg`: Throws if no user or no active organization
 *
 * @returns AppContext with typed fields based on the requirement level
 * @throws Error if the requirement is not met
 *
 * @example
 * // Basic usage - me and activeOrganization can be null
 * const { me, activeOrganization } = useAppContext();
 *
 * @example
 * // Require authenticated user - me is guaranteed non-null
 * const { me } = useAppContext(ContextLevel.Authenticated);
 *
 * @example
 * // Require user and organization - both guaranteed non-null
 * const { me, activeOrganization } = useAppContext(ContextLevel.AuthenticatedWithOrg);
 */
export function useAppContext<T extends ContextLevel | undefined>(
  requirement?: T,
): UseAppContextReturnType<T> {
  const context = use(AppContext);

  if (requirement === ContextLevel.Authenticated && !context.me) {
    throw new Error('useAppContext: User must be authenticated');
  }

  if (
    requirement === ContextLevel.AuthenticatedWithOrg &&
    (!context.me || !context.activeOrganization)
  ) {
    throw new Error(
      'useAppContext: User must be authenticated with an active organization',
    );
  }

  return context as UseAppContextReturnType<T>;
}
