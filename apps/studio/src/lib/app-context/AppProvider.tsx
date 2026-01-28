import type {ReactNode} from 'react';
import {AppContext} from './AppContext';
import {useInitializeAppContext} from './use-initialize-app-context';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppProvider component that initializes and provides the AppContext.
 * This should wrap your app's router, but be inside the tRPC provider.
 */
export function AppProvider({children}: AppProviderProps) {
  const contextValue = useInitializeAppContext();

  return <AppContext value={contextValue}>{children}</AppContext>;
}
