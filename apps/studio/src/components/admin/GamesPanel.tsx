import {useEffect, useMemo, useRef, useState} from 'react';
import {Badge, Button, Input, Loading, Select, Table} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib';
import {TableActionConfirmDialog} from './TableActionConfirmDialog';
import {formatAdminSlug} from './utils/formatAdminSlug';

interface Game {
  id: string;
  title: string;
  cover_url: string | null;
  is_verified: boolean;
  is_claimable: boolean;
  primary_page_slug: string | null;
  primary_page_requested_slug: string | null;
  created_at: string;
  owner_studio: {
    id: string;
    name: string;
    slug: string;
    requested_slug: string | null;
  } | null;
}

interface GamesPanelProps {
  onUpdate: () => void;
}

interface ConfirmDialogState {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'destructive' | 'outline' | 'ghost';
  onConfirm: () => void;
}

const PAGE_SIZE = 20;
const VERIFICATION_FILTER_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Verified', value: 'verified'},
  {label: 'Unverified', value: 'unverified'},
] as const;

export function GamesPanel({onUpdate}: GamesPanelProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const isVerifiedFilter
    = verificationFilter === 'all'
      ? undefined
      : verificationFilter === 'verified';

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = trpc.admin.listGames.useInfiniteQuery(
    {
      limit: PAGE_SIZE,
      search: debouncedSearch || undefined,
      isVerified: isVerifiedFilter,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    },
  );

  const games = useMemo(
    () => data?.pages.flatMap((page) => page.items) || [],
    [data],
  );

  const setVerifiedMutation = trpc.admin.setGameVerified.useMutation({
    onSuccess: onUpdate,
  });
  const setClaimableMutation = trpc.admin.setGameClaimable.useMutation({
    onSuccess: onUpdate,
  });
  const isMutating = setVerifiedMutation.isPending || setClaimableMutation.isPending;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    }, {rootMargin: '320px'});

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const columns: TableColumn<Game>[] = [
    {
      title: 'Game',
      accessor: 'title',
      renderContent: ({d}) => (
        <div className="flex items-center gap-3">
          {d.cover_url ? (
            <img
              src={d.cover_url}
              alt={d.title}
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-(--bg-muted) flex items-center justify-center text-xs font-semibold">
              {d.title.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium">{d.title}</div>
            {formatAdminSlug(d.primary_page_requested_slug, d.primary_page_slug) && (
              <div className="text-xs text-(--fg-muted)">
                /{formatAdminSlug(d.primary_page_requested_slug, d.primary_page_slug)}
              </div>
            )}
            {d.owner_studio && (
              <div className="text-sm text-(--fg-subtle)">
                by @{formatAdminSlug(d.owner_studio.requested_slug, d.owner_studio.slug)}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Studio',
      accessor: 'owner_studio',
      renderContent: ({d}) => (
        <span className="text-sm">
          {d.owner_studio?.name ?? 'Unknown'}
        </span>
      ),
    },
    {
      title: 'Verified',
      accessor: 'is_verified',
      renderContent: ({d}) => (
        <Badge intent={d.is_verified ? 'success' : 'info'}>
          {d.is_verified ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      title: 'Claimable',
      accessor: 'is_claimable',
      renderContent: ({d}) => (
        <Badge intent={d.is_claimable ? 'success' : 'info'}>
          {d.is_claimable ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    {
      title: 'Created (newest)',
      accessor: 'created_at',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {new Date(d.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      accessor: 'actions',
      renderContent: ({d}) => (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={d.is_verified ? 'outline' : 'primary'}
            size="xs"
            onClick={() => {
              const nextVerified = !d.is_verified;
              setConfirmDialog({
                title: nextVerified ? 'Verify game' : 'Unverify game',
                description: nextVerified
                  ? `Are you sure you want to verify "${d.title}"?`
                  : `Are you sure you want to unverify "${d.title}"?`,
                confirmLabel: nextVerified ? 'Verify' : 'Unverify',
                confirmVariant: nextVerified ? 'primary' : 'outline',
                onConfirm: () =>
                  setVerifiedMutation.mutate({
                    gameId: d.id,
                    isVerified: nextVerified,
                  }),
              });
            }}
            disabled={isMutating}
          >
            {d.is_verified ? 'Unverify' : 'Verify'}
          </Button>
          <Button
            variant={d.is_claimable ? 'ghost' : 'outline'}
            size="xs"
            onClick={() => {
              const nextClaimable = !d.is_claimable;
              setConfirmDialog({
                title: nextClaimable ? 'Make claimable' : 'Remove claimable',
                description: nextClaimable
                  ? `Are you sure you want to mark "${d.title}" as claimable?`
                  : `Are you sure you want to remove "${d.title}" from claimable?`,
                confirmLabel: nextClaimable ? 'Make claimable' : 'Remove claimable',
                confirmVariant: nextClaimable ? 'primary' : 'destructive',
                onConfirm: () =>
                  setClaimableMutation.mutate({
                    gameId: d.id,
                    isClaimable: nextClaimable,
                  }),
              });
            }}
            disabled={isMutating}
          >
            {d.is_claimable ? 'Remove claim' : 'Make claimable'}
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2.5">
        <label className="flex flex-col gap-1 min-w-64 flex-1">
          <span className="text-xs text-(--fg-subtle)">Search</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by game title..."
          />
        </label>
        <label className="flex flex-col gap-1 min-w-48">
          <span className="text-xs text-(--fg-subtle)">Status</span>
          <Select
            options={[...VERIFICATION_FILTER_OPTIONS]}
            value={verificationFilter}
            onChange={(e) =>
              setVerificationFilter(
                (e.target as HTMLSelectElement).value as 'all' | 'verified' | 'unverified',
              )}
          />
        </label>
      </div>

      <Table
        columns={columns}
        data={games}
        propertyForKey="id"
        bleed={8}
        emptyMessage={
          debouncedSearch || verificationFilter !== 'all'
            ? 'No games match the current filters.'
            : 'No games found.'
        }
      />

      {(hasNextPage || isFetchingNextPage) && (
        <div ref={loadMoreRef} className="h-8 flex items-center justify-center">
          {isFetchingNextPage && <Loading />}
        </div>
      )}

      <TableActionConfirmDialog
        opened={Boolean(confirmDialog)}
        setOpened={(opened) => {
          if (!opened) setConfirmDialog(null);
        }}
        title={confirmDialog?.title || 'Confirm action'}
        description={confirmDialog?.description || ''}
        confirmLabel={confirmDialog?.confirmLabel || 'Confirm'}
        confirmVariant={confirmDialog?.confirmVariant}
        isPending={isMutating}
        onConfirm={() => {
          if (!confirmDialog) return;
          confirmDialog.onConfirm();
          setConfirmDialog(null);
        }}
      />
    </div>
  );
}
