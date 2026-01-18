import type {UseMutationOptions, UseQueryOptions} from '@tanstack/react-query';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type {
  ApiBody,
  ApiEndpoint,
  ApiResponse,
  EndpointsWith,
} from '@play/api-types';
import {apiFetch} from './api';

/**
 * useApiQuery - Typed wrapper around react-query for REST API
 *
 * Types are automatically inferred from @play/api-types.
 *
 * Usage:
 * const { data, isLoading, error } = useApiQuery('/organizations');
 * // data is typed as Organization[]
 */
export function useApiQuery<E extends EndpointsWith<'GET'>>(
  endpoint: E,
  options?: Omit<
    UseQueryOptions<
      ApiResponse<E, 'GET'>,
      Error,
      ApiResponse<E, 'GET'>,
      string[]
    >,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<
    ApiResponse<E, 'GET'>,
    Error,
    ApiResponse<E, 'GET'>,
    string[]
  >({
    queryKey: [endpoint],
    queryFn: () => apiFetch<ApiResponse<E, 'GET'>>(endpoint),
    ...options,
  });
}

/**
 * useApiMutation - Typed wrapper around react-query for REST mutations
 *
 * Types are automatically inferred from @play/api-types.
 *
 * Usage:
 * const createOrg = useApiMutation('POST', '/organizations');
 * createOrg.mutate({ slug: 'my-org', name: 'My Org' });
 * // Input and output are fully typed
 *
 * For dynamic endpoints (e.g., delete with ID):
 * const deleteOrg = useApiMutation<{id: string}, void>('DELETE', ({id}) => `/organizations/${id}`);
 * deleteOrg.mutate({ id: 'some-id' });
 */

// Overload 1: Static endpoint - types inferred from ApiEndpoint
export function useApiMutation<
  E extends ApiEndpoint,
  M extends 'POST' | 'PATCH' | 'DELETE',
>(
  method: M,
  endpoint: E,
  options?: Omit<
    UseMutationOptions<ApiResponse<E, M>, Error, ApiBody<E, M>>,
    'mutationFn'
  > & {
    invalidateQueries?: ApiEndpoint[];
  },
): ReturnType<typeof useMutation<ApiResponse<E, M>, Error, ApiBody<E, M>>>;

// Overload 2: Dynamic endpoint function - explicit types required
export function useApiMutation<TBody, TResponse = void>(
  method: 'POST' | 'PATCH' | 'DELETE',
  endpoint: (variables: TBody) => string,
  options?: Omit<UseMutationOptions<TResponse, Error, TBody>, 'mutationFn'> & {
    invalidateQueries?: ApiEndpoint[];
  },
): ReturnType<typeof useMutation<TResponse, Error, TBody>>;

// Implementation
export function useApiMutation<
  E extends ApiEndpoint,
  M extends 'POST' | 'PATCH' | 'DELETE',
>(
  method: M,
  endpoint: E | ((variables: ApiBody<E, M>) => string),
  options?: Omit<
    UseMutationOptions<ApiResponse<E, M>, Error, ApiBody<E, M>>,
    'mutationFn'
  > & {
    invalidateQueries?: ApiEndpoint[];
  },
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<E, M>, Error, ApiBody<E, M>>({
    mutationFn: async (variables) => {
      const url =
        typeof endpoint === 'function' ? endpoint(variables) : endpoint;

      return apiFetch<ApiResponse<E, M>>(url, {
        method,
        body: method !== 'DELETE' ? JSON.stringify(variables) : undefined,
      });
    },
    onSuccess: (...args) => {
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((key) => {
          queryClient.invalidateQueries({queryKey: [key]});
        });
      }
      options?.onSuccess?.(...args);
    },
    ...options,
  });
}
