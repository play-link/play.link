import {useMemo, useState} from 'react';
import {Badge, Button, Input, Loading, Select, Table} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib';
import {TableActionConfirmDialog} from './TableActionConfirmDialog';
import {formatAdminSlug} from './utils/formatAdminSlug';

type LeadStatus
  = 'new'
  | 'queued'
  | 'contacted'
  | 'replied'
  | 'interested'
  | 'not_interested'
  | 'bounced'
  | 'blocked'
  | 'claimed';

type LeadChannel = 'email' | 'discord' | 'twitter';

interface OutreachLead {
  id: string;
  target_type: 'game' | 'studio';
  target_slug: string | null;
  target_real_slug?: string | null;
  target_requested_slug?: string | null;
  target_name: string;
  channel: LeadChannel;
  contact_identifier: string;
  contact_display_name: string | null;
  source: 'steam_scan' | 'manual' | 'import';
  confidence_score: number;
  status: LeadStatus;
  is_blocked: boolean;
  owner_admin_user_id: string | null;
  notes: string | null;
  last_contacted_at: string | null;
  next_action_at: string | null;
  created_at: string;
  owner_admin:
    | {
      user_id: string;
      email: string;
      username: string;
      display_name: string | null;
    }
    | null
    | Array<{
      user_id: string;
      email: string;
      username: string;
      display_name: string | null;
    }>;
}

interface OutreachLeadsPanelProps {
  onUpdate: () => void;
}

interface LeadActionConfirmState {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'primary' | 'destructive' | 'outline' | 'ghost';
  payload: {
    leadId: string;
    status?: LeadStatus;
    isBlocked?: boolean;
    lastContactedAt?: string | null;
  };
}

const STATUS_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'New', value: 'new'},
  {label: 'Queued', value: 'queued'},
  {label: 'Contacted', value: 'contacted'},
  {label: 'Replied', value: 'replied'},
  {label: 'Interested', value: 'interested'},
  {label: 'Not interested', value: 'not_interested'},
  {label: 'Bounced', value: 'bounced'},
  {label: 'Blocked', value: 'blocked'},
  {label: 'Claimed', value: 'claimed'},
] as const;

const CHANNEL_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Email', value: 'email'},
  {label: 'Discord', value: 'discord'},
  {label: 'X', value: 'twitter'},
] as const;

function toChannelLabel(channel: LeadChannel): string {
  if (channel === 'twitter') return 'X';
  if (channel === 'email') return 'Email';
  return 'Discord';
}

const BLOCK_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Blocked', value: 'blocked'},
  {label: 'Not blocked', value: 'not_blocked'},
] as const;

function toBadgeIntent(status: LeadStatus): 'info' | 'warning' | 'success' | 'error' {
  if (status === 'new' || status === 'queued') return 'info';
  if (status === 'contacted' || status === 'replied') return 'warning';
  if (status === 'interested' || status === 'claimed') return 'success';
  return 'error';
}

function toStatusLabel(status: LeadStatus): string {
  if (status === 'new') return 'New';
  if (status === 'queued') return 'Queued';
  if (status === 'contacted') return 'Contacted';
  if (status === 'replied') return 'Replied';
  if (status === 'interested') return 'Interested';
  if (status === 'not_interested') return 'Not interested';
  if (status === 'bounced') return 'Bounced';
  if (status === 'blocked') return 'Blocked';
  return 'Claimed';
}

function getOwnerDisplay(lead: OutreachLead): string {
  const owner = Array.isArray(lead.owner_admin) ? lead.owner_admin[0] : lead.owner_admin;
  if (!owner) return '—';
  return owner.display_name || owner.username || owner.email;
}

export function OutreachLeadsPanel({onUpdate}: OutreachLeadsPanelProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | LeadChannel>('all');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'blocked' | 'not_blocked'>('all');
  const [confirmAction, setConfirmAction] = useState<LeadActionConfirmState | null>(null);

  const {data: leads = [], isLoading} = trpc.admin.listOutreachLeads.useQuery({
    limit: 200,
    offset: 0,
    search: search.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    channel: channelFilter === 'all' ? undefined : channelFilter,
    isBlocked:
      blockedFilter === 'all'
        ? undefined
        : blockedFilter === 'blocked',
  });

  const updateLeadMutation = trpc.admin.updateOutreachLead.useMutation({
    onSuccess: onUpdate,
  });
  const isMutating = updateLeadMutation.isPending;

  const columns: TableColumn<OutreachLead>[] = useMemo(() => [
    {
      title: 'Target',
      accessor: 'target_name',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{d.target_name}</span>
          <span className="text-xs text-(--fg-subtle)">
            {formatAdminSlug(d.target_requested_slug, d.target_real_slug) || d.target_slug
              ? `/${formatAdminSlug(d.target_requested_slug, d.target_real_slug) || d.target_slug}`
              : 'No slug'}
          </span>
          <span className="text-xs text-(--fg-muted)">
            {d.target_type === 'game' ? 'Game' : 'Studio'}
          </span>
        </div>
      ),
    },
    {
      title: 'Contact',
      accessor: 'contact_identifier',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{d.contact_display_name || 'Unknown contact'}</span>
          <span className="text-sm text-(--fg-subtle)">{d.contact_identifier}</span>
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
      renderContent: ({d}) => <Badge intent={toBadgeIntent(d.status)}>{toStatusLabel(d.status)}</Badge>,
    },
    {
      title: 'Owner',
      accessor: 'owner_admin_user_id',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">{getOwnerDisplay(d)}</span>
      ),
    },
    {
      title: 'Next action',
      accessor: 'next_action_at',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {d.next_action_at ? new Date(d.next_action_at).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      title: 'Actions',
      accessor: 'actions',
      renderContent: ({d}) => {
        const getPrimaryAction = () => {
          if (d.status === 'new' || d.status === 'queued') {
            return {
              title: 'Mark as contacted',
              description: `Mark ${d.target_name} as contacted?`,
              confirmLabel: 'Mark contacted',
              payload: {
                leadId: d.id,
                status: 'contacted' as LeadStatus,
                lastContactedAt: new Date().toISOString(),
              },
            };
          }
          if (d.status === 'contacted' || d.status === 'replied') {
            return {
              title: 'Mark as interested',
              description: `Mark ${d.target_name} as interested?`,
              confirmLabel: 'Mark interested',
              payload: {
                leadId: d.id,
                status: 'interested' as LeadStatus,
              },
            };
          }
          if (d.status === 'interested') {
            return {
              title: 'Mark as claimed',
              description: `Mark ${d.target_name} as claimed?`,
              confirmLabel: 'Mark claimed',
              payload: {
                leadId: d.id,
                status: 'claimed' as LeadStatus,
              },
            };
          }
          return null;
        };

        const primaryAction = getPrimaryAction();
        return (
          <div className="flex flex-wrap gap-2">
            {primaryAction && (
              <Button
                size="xs"
                variant="primary"
                disabled={isMutating}
                onClick={() =>
                  setConfirmAction({
                    title: primaryAction.title,
                    description: primaryAction.description,
                    confirmLabel: primaryAction.confirmLabel,
                    confirmVariant: 'primary',
                    payload: primaryAction.payload,
                  })}
              >
                {primaryAction.confirmLabel}
              </Button>
            )}
            <Button
              size="xs"
              variant={d.is_blocked ? 'ghost' : 'outline'}
              disabled={isMutating}
              onClick={() =>
                setConfirmAction({
                  title: d.is_blocked ? 'Unblock lead' : 'Block lead',
                  description: d.is_blocked
                    ? `Unblock ${d.target_name} for future outreach?`
                    : `Block ${d.target_name} from future outreach?`,
                  confirmLabel: d.is_blocked ? 'Unblock' : 'Block',
                  confirmVariant: d.is_blocked ? 'primary' : 'destructive',
                  payload: {
                    leadId: d.id,
                    isBlocked: !d.is_blocked,
                    status: !d.is_blocked ? 'blocked' : undefined,
                  },
                })}
            >
              {d.is_blocked ? 'Unblock' : 'Block'}
            </Button>
          </div>
        );
      },
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
            placeholder="Search by target, slug, or contact..."
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
        <label className="flex flex-col gap-1 min-w-40">
          <span className="text-xs text-(--fg-subtle)">Blocked</span>
          <Select
            options={[...BLOCK_OPTIONS]}
            value={blockedFilter}
            onChange={(e) => setBlockedFilter((e.target as HTMLSelectElement).value as typeof blockedFilter)}
          />
        </label>
      </div>

      <Table
        columns={columns}
        data={leads as OutreachLead[]}
        propertyForKey="id"
        bleed={8}
        emptyMessage="No outreach leads found."
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
          updateLeadMutation.mutate(confirmAction.payload);
          setConfirmAction(null);
        }}
      />
    </div>
  );
}
