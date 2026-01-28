import {QueryClientProvider} from '@tanstack/react-query';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {RouterProvider} from 'react-router';
import {SnackbarProvider} from '@play/pylon';
import './index.css';
import {AppProvider} from './lib/app-context';
import {queryClient, trpc, trpcClient} from './lib/trpc';
import {router} from './routes';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider position="bottom-right">
          <AppProvider>
            <RouterProvider router={router} />
          </AppProvider>
        </SnackbarProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
