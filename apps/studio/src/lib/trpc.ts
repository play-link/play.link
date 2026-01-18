import {QueryClient} from '@tanstack/react-query';
import {createTRPCReact, httpBatchLink} from '@trpc/react-query';
import type {AppRouter} from '@play/api/trpc';
import {getSupabaseClient} from '@play/supabase-client';

// =============================================================================
// tRPC React Client
// =============================================================================

export const trpc = createTRPCReact<AppRouter>();

// =============================================================================
// Query Client
// =============================================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
  },
});

// =============================================================================
// tRPC Client
// =============================================================================

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      async headers() {
        const supabase = getSupabaseClient();
        const {
          data: {session},
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          return {
            Authorization: `Bearer ${session.access_token}`,
          };
        }
        return {};
      },
    }),
  ],
});
