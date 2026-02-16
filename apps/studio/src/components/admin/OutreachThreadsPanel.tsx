import {useMemo, useState} from 'react';
import {Badge, Button, Input, Loading, Select, Table} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib';
import {TableActionConfirmDialog} from './TableActionConfirmDialog';
import {formatAdminSlug} from './utils/formatAdminSlug';

type ThreadStatus = 'open' | 'awaiting_reply' | 'replied' | 'closed';
type ThreadChannel = 'email' | 'discord' | 'twitter';

interface OutreachThread {
  id: string;
  lead_id: string;
  channel: ThreadChannel;
  status: ThreadStatus;
  external_thread_id: string | null;
  last_outbound_at: string | null;
  last_inbound_at: string | null;
  assigned_admin_user_id: string | null;
  created_at: string;
  updated_at: string | null;
  closed_at: string | null;
  lead:
    | {
      id: string;
      target_type: 'game' | 'studio';
      target_game_id: string | null;
      target_studio_id: string | null;
      target_name: string;
      target_slug: string | null;
      target_real_slug?: string | null;
      target_requested_slug?: string | null;
      contact_identifier: string;
      status: string;
      is_blocked: boolean;
    }
    | null
    | Array<{
      id: string;
      target_type: 'game' | 'studio';
      target_game_id: string | null;
      target_studio_id: string | null;
      target_name: string;
      target_slug: string | null;
      target_real_slug?: string | null;
      target_requested_slug?: string | null;
      contact_identifier: string;
      status: string;
      is_blocked: boolean;
    }>;
}

interface OutreachThreadsPanelProps {
  onUpdate: () => void;
}

interface ThreadActionConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'destructive' | 'outline' | 'ghost';
  payload: {
    threadId: string;
    status?: ThreadStatus;
  };
}

const STATUS_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Open', value: 'open'},
  {label: 'Awaiting reply', value: 'awaiting_reply'},
  {label: 'Replied', value: 'replied'},
  {label: 'Closed', value: 'closed'},
] as const;

const CHANNEL_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Email', value: 'email'},
  {label: 'Discord', value: 'discord'},
  {label: 'X', value: 'twitter'},
] as const;

function toChannelLabel(channel: ThreadChannel): string {
  if (channel === 'twitter') return 'X';
  if (channel === 'email') return 'Email';
  return 'Discord';
}

function toBadgeIntent(status: ThreadStatus): 'info' | 'warning' | 'success' | 'error' {
  if (status === 'open') return 'info';
  if (status === 'awaiting_reply') return 'warning';
  if (status === 'replied') return 'success';
  return 'error';
}

function toStatusLabel(status: ThreadStatus): string {
  if (status === 'open') return 'Open';
  if (status === 'awaiting_reply') return 'Awaiting reply';
  if (status === 'replied') return 'Replied';
  return 'Closed';
}

function getLead(thread: OutreachThread) {
  return Array.isArray(thread.lead) ? thread.lead[0] : thread.lead;
}

export function OutreachThreadsPanel({onUpdate}: OutreachThreadsPanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ThreadStatus>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | ThreadChannel>('all');
  const [confirmAction, setConfirmAction] = useState<ThreadActionConfirmState | null>(null);

  const {data: threads = [], isLoading} = trpc.admin.listOutreachThreads.useQuery({
    limit: 200,
    offset: 0,
    search: search.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    channel: channelFilter === 'all' ? undefined : channelFilter,
  });

  const updateThreadMutation = trpc.admin.updateOutreachThread.useMutation({
    onSuccess: onUpdate,
  });
  const isMutating = updateThreadMutation.isPending;

  const columns: TableColumn<OutreachThread>[] = useMemo(() => [
    {
      title: 'Thread',
      accessor: 'external_thread_id',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{d.external_thread_id || d.id}</span>
          <span className="text-xs text-(--fg-subtle)">
            {getLead(d)?.target_name || 'Unknown lead'}
          </span>
          <span className="text-xs text-(--fg-muted)">
            {(() => {
              const lead = getLead(d);
              const displaySlug = formatAdminSlug(lead?.target_requested_slug, lead?.target_real_slug) || lead?.target_slug;
              return displaySlug ? `/${displaySlug}` : 'No slug';
            })()}
          </span>
        </div>
      ),
    },
    {
      title: 'Channel',
      accessor: 'channel',
      renderContent: ({d}) => <Badge>{toChannelLabel(d.channel)}</Badge>,
    },
    {
      title: 'Status',
      accessor: 'status',
      renderContent: ({d}) => (
        <Badge intent={toBadgeIntent(d.status)}>{toStatusLabel(d.status)}</Badge>
      ),
    },
    {
      title: 'Last activity',
      accessor: 'last_outbound_at',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-0.5 text-sm text-(--fg-subtle)">
          <span>Out: {d.last_outbound_at ? new Date(d.last_outbound_at).toLocaleDateString() : '—'}</span>
          <span>In: {d.last_inbound_at ? new Date(d.last_inbound_at).toLocaleDateString() : '—'}</span>
        </div>
      ),
    },
    {
      title: 'Created',
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
          {d.status !== 'replied' && d.status !== 'closed' && (
            <Button
              size="xs"
              variant="primary"
              disabled={isMutating}
              onClick={() =>
                setConfirmAction({
                  title: 'Mark as replied',
                  description: 'Mark this outreach thread as replied?',
                  confirmLabel: 'Mark replied',
                  confirmVariant: 'primary',
                  payload: {
                    threadId: d.id,
                    status: 'replied',
                  },
                })}
            >
              Mark replied
            </Button>
          )}
          {d.status !== 'awaiting_reply' && d.status !== 'closed' && (
            <Button
              size="xs"
              variant="outline"
              disabled={isMutating}
              onClick={() =>
                setConfirmAction({
                  title: 'Mark awaiting reply',
                  description: 'Mark this outreach thread as awaiting reply?',
                  confirmLabel: 'Mark awaiting',
                  confirmVariant: 'primary',
                  payload: {
                    threadId: d.id,
                    status: 'awaiting_reply',
                  },
                })}
            >
              Awaiting reply
            </Button>
          )}
          {d.status !== 'closed' ? (
            <Button
              size="xs"
              variant="ghost"
              disabled={isMutating}
              onClick={() =>
                setConfirmAction({
                  title: 'Close thread',
                  description: 'Close this outreach thread?',
                  confirmLabel: 'Close',
                  confirmVariant: 'destructive',
                  payload: {
                    threadId: d.id,
                    status: 'closed',
                  },
                })}
            >
              Close
            </Button>
          ) : (
            <Button
              size="xs"
              variant="ghost"
              disabled={isMutating}
              onClick={() =>
                setConfirmAction({
                  title: 'Re-open thread',
                  description: 'Re-open this outreach thread?',
                  confirmLabel: 'Re-open',
                  confirmVariant: 'primary',
                  payload: {
                    threadId: d.id,
                    status: 'open',
                  },
                })}
            >
              Re-open
            </Button>
          )}
        </div>
      ),
    },
  ], [isMutating]);

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
            placeholder="Search by thread id or lead..."
          />
        </label>
        <label className="flex flex-col gap-1 min-w-40">
          <span className="text-xs text-(--fg-subtle)">Status</span>
          <Select
            options={[...STATUS_OPTIONS]}
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value as typeof statusFilter)}
          />
        </label>
        <label className="flex flex-col gap-1 min-w-40">
          <span className="text-xs text-(--fg-subtle)">Channel</span>
          <Select
            options={[...CHANNEL_OPTIONS]}
            value={channelFilter}
            onChange={(e) => setChannelFilter((e.target as HTMLSelectElement).value as typeof channelFilter)}
          />
        </label>
      </div>

      <Table
        columns={columns}
        data={threads as OutreachThread[]}
        propertyForKey="id"
        bleed={8}
        emptyMessage="No outreach threads found."
      />

      <TableActionConfirmDialog
        opened={Boolean(confirmAction)}
        setOpened={(opened) => {
          if (!opened) setConfirmAction(null);
        }}
        title={confirmAction?.title || 'Confirm action'}
        description={confirmAction?.description || ''}
        confirmLabel={confirmAction?.confirmLabel || 'Confirm'}
        confirmVariant={confirmAction?.confirmVariant}
        isPending={isMutating}
        onConfirm={() => {
          if (!confirmAction) return;
          updateThreadMutation.mutate(confirmAction.payload);
          setConfirmAction(null);
        }}
      />
    </div>
  );
}
