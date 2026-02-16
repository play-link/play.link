import {useMemo, useState} from 'react';
import {Input, Loading, Table} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {trpc} from '@/lib';
import {formatAdminSlug} from './utils/formatAdminSlug';

interface OutreachEvent {
  id: string;
  message_id: string | null;
  thread_id: string | null;
  lead_id: string | null;
  provider: string;
  provider_event_id: string | null;
  event_type: string;
  occurred_at: string;
  payload_json: Record<string, unknown> | null;
  created_at: string;
  message:
    | {
      id: string;
      status: string;
      direction: string;
      channel: string;
    }
    | null
    | Array<{
      id: string;
      status: string;
      direction: string;
      channel: string;
    }>;
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
    }>;
}

interface OutreachEventsPanelProps {
  onUpdate: () => void;
}

function getLead(event: OutreachEvent) {
  return Array.isArray(event.lead) ? event.lead[0] : event.lead;
}

function getMessage(event: OutreachEvent) {
  return Array.isArray(event.message) ? event.message[0] : event.message;
}

function toChannelLabel(channel: string): string {
  if (channel === 'twitter') return 'X';
  if (channel === 'email') return 'Email';
  if (channel === 'discord') return 'Discord';
  return channel;
}

export function OutreachEventsPanel({onUpdate: _onUpdate}: OutreachEventsPanelProps) {
  const [providerFilter, setProviderFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const {data: events = [], isLoading} = trpc.admin.listOutreachEvents.useQuery({
    limit: 200,
    offset: 0,
    provider: providerFilter.trim() || undefined,
    eventType: eventTypeFilter.trim() || undefined,
    search: search.trim() || undefined,
  });

  const columns: TableColumn<OutreachEvent>[] = useMemo(() => [
    {
      title: 'Provider',
      accessor: 'provider',
      renderContent: ({d}) => <span className="font-medium">{d.provider}</span>,
    },
    {
      title: 'Event',
      accessor: 'event_type',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{d.event_type}</span>
          <span className="text-xs text-(--fg-subtle)">{d.provider_event_id || 'No provider event id'}</span>
        </div>
      ),
    },
    {
      title: 'Lead',
      accessor: 'lead_id',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-0.5">
          <span>{getLead(d)?.target_name || 'Unknown lead'}</span>
          <span className="text-xs text-(--fg-subtle)">{getLead(d)?.contact_identifier || '—'}</span>
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
      title: 'Message',
      accessor: 'message_id',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {getMessage(d)?.channel ? `${toChannelLabel(getMessage(d)?.channel || '')} / ${getMessage(d)?.status || '—'}` : '—'}
        </span>
      ),
    },
    {
      title: 'Occurred',
      accessor: 'occurred_at',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {new Date(d.occurred_at).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Payload',
      accessor: 'payload_json',
      renderContent: ({d}) => (
        <span className="text-xs text-(--fg-subtle) max-w-[360px] inline-block truncate">
          {d.payload_json ? JSON.stringify(d.payload_json) : '{}'}
        </span>
      ),
    },
  ], []);

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
        <label className="flex flex-col gap-1 min-w-52">
          <span className="text-xs text-(--fg-subtle)">Provider</span>
          <Input
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            placeholder="resend, x_api..."
          />
        </label>
        <label className="flex flex-col gap-1 min-w-52">
          <span className="text-xs text-(--fg-subtle)">Event type</span>
          <Input
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            placeholder="delivered, reply_received..."
          />
        </label>
        <label className="flex flex-col gap-1 min-w-64 flex-1">
          <span className="text-xs text-(--fg-subtle)">Search provider event id</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="evt_xxx..."
          />
        </label>
      </div>

      <Table
        columns={columns}
        data={events as OutreachEvent[]}
        propertyForKey="id"
        bleed={8}
        emptyMessage="No outreach events found."
      />
    </div>
  );
}
