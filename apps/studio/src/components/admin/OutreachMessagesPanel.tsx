import {useMemo, useState} from 'react';
import type {LucideIcon} from 'lucide-react';
import {AtSignIcon, CheckCheckIcon, CheckIcon, MailIcon, MessageCircleIcon, Trash2Icon} from 'lucide-react';
import {Badge, Button, DialogOverlay, Icon, IconButton, Input, Loading, Select, Table, Textarea, Tooltip} from '@play/pylon';
import type {TableColumn} from '@play/pylon';
import {Panel, Group as PanelGroup, Separator as PanelResizeHandle} from 'react-resizable-panels';
import {css} from 'styled-components';
import {trpc} from '@/lib';
import {TableActionConfirmDialog} from './TableActionConfirmDialog';
import {formatAdminSlug} from './utils/formatAdminSlug';

type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'failed';
type MessageStatus = DeliveryStatus | null;
type MessageDirection = 'outbound' | 'inbound';
type MessageChannel = 'email' | 'discord' | 'twitter';

interface OutreachMessage {
  id: string;
  thread_id: string;
  lead_id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  provider: string;
  provider_message_id: string | null;
  template_id: string | null;
  subject: string | null;
  body: string | null;
  status: MessageStatus;
  error_code: string | null;
  error_message: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string | null;
  thread:
    | {
      id: string;
      external_thread_id: string | null;
      status: string;
    }
    | null
    | Array<{
      id: string;
      external_thread_id: string | null;
      status: string;
    }>;
  lead:
    | {
      id: string;
      target_type: 'game' | 'studio';
      target_name: string;
      target_slug: string | null;
      contact_identifier: string;
    }
    | null
    | Array<{
      id: string;
      target_type: 'game' | 'studio';
      target_name: string;
      target_slug: string | null;
      contact_identifier: string;
    }>;
}

interface OutreachThreadMessage {
  id: string;
  thread_id: string;
  lead_id: string;
  channel: MessageChannel;
  direction: MessageDirection;
  provider: string;
  provider_message_id: string | null;
  template_id: string | null;
  subject: string | null;
  body: string | null;
  status: MessageStatus;
  error_code: string | null;
  error_message: string | null;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string | null;
  lead:
    | {
      id: string;
      target_name: string;
      target_slug: string | null;
      contact_identifier: string;
    }
    | null
    | Array<{
      id: string;
      target_name: string;
      target_slug: string | null;
      contact_identifier: string;
    }>;
}

interface OutreachMessagesPanelProps {
  onUpdate: () => void;
  selectedMessageId: string | null;
  onSelectedMessageChange: (messageId: string | null) => void;
}

interface RetryConfirmState {
  messageId: string;
  title: string;
  description: string;
}

interface DeleteConfirmState {
  messageId: string;
  title: string;
  description: string;
}

const STATUS_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Queued', value: 'queued'},
  {label: 'Sent', value: 'sent'},
  {label: 'Delivered', value: 'delivered'},
  {label: 'Failed', value: 'failed'},
] as const;

const DIRECTION_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Outbound', value: 'outbound'},
  {label: 'Inbound', value: 'inbound'},
] as const;

const CHANNEL_OPTIONS = [
  {label: 'All', value: 'all'},
  {label: 'Email', value: 'email'},
  {label: 'Discord', value: 'discord'},
  {label: 'X', value: 'twitter'},
] as const;
const DB_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NIL_UUID = '00000000-0000-0000-0000-000000000000';
const PLAY_LINK_BASE = import.meta.env.VITE_PLAY_LINK_URL || 'https://play.link';

function renderDeliveryState(status: MessageStatus, isReadByReply: boolean) {
  if (status === null) {
    return <span className="text-xs text-(--fg-subtle)">—</span>;
  }
  if (status === 'queued') {
    return <span className="text-xs text-(--fg-subtle)">Queued</span>;
  }
  if (status === 'failed') {
    return <span className="text-xs text-(--fg-danger)">Failed</span>;
  }
  if (isReadByReply) {
    return (
      <span className="inline-flex items-center text-(--fg-subtle)" aria-label="Received">
        <Icon icon={CheckCheckIcon} size={14} />
      </span>
    );
  }
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center text-(--fg-subtle)" aria-label="Sent">
        <Icon icon={CheckIcon} size={14} />
      </span>
    );
  }
  if (status === 'delivered') {
    return (
      <span className="inline-flex items-center text-(--fg-subtle)" aria-label="Delivered">
        <Icon icon={CheckCheckIcon} size={14} />
      </span>
    );
  }
  return <span className="text-xs text-(--fg-subtle)">{status}</span>;
}

function getChannelIcon(channel: MessageChannel): LucideIcon {
  if (channel === 'email') return MailIcon;
  if (channel === 'discord') return MessageCircleIcon;
  return AtSignIcon;
}

function getChannelLabel(channel: MessageChannel): string {
  if (channel === 'twitter') return 'X';
  if (channel === 'email') return 'Email';
  return 'Discord';
}

function getThreadListStatus(message: OutreachMessage): string {
  if (message.direction === 'inbound') return 'received';
  return message.status ?? '—';
}

function getLead(message: OutreachMessage) {
  return Array.isArray(message.lead) ? message.lead[0] : message.lead;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function toYesNo(value: boolean | null | undefined) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return '—';
}

interface TargetTooltipLinkProps {
  label: string;
  leadId: string;
  targetSlug: string | null;
  targetKind: 'game' | 'studio';
}

function TargetTooltipLink({label, leadId, targetSlug, targetKind}: TargetTooltipLinkProps) {
  const [hovered, setHovered] = useState(false);
  const {data, isLoading} = trpc.admin.getOutreachLeadTargetInfo.useQuery(
    {leadId: leadId || NIL_UUID},
    {
      enabled: hovered && Boolean(leadId),
      staleTime: 1000 * 60 * 5,
    },
  );

  const href = useMemo(() => {
    const studioRealSlug = data?.studio?.slug || null;
    const gamePublicSlug = data?.game?.requested_slug || data?.game?.slug || null;

    if (targetKind === 'game') {
      if (data?.game?.id && studioRealSlug) {
        return `/${studioRealSlug}/games/${data.game.id}`;
      }
      if (gamePublicSlug) {
        return `${PLAY_LINK_BASE}/${gamePublicSlug}`;
      }
      return targetSlug ? `${PLAY_LINK_BASE}/${targetSlug}` : undefined;
    }

    if (studioRealSlug) {
      return `/${studioRealSlug}/games`;
    }
    if (!targetSlug) return undefined;
    const normalizedSlug = targetSlug.replace(/^@/, '');
    return `${PLAY_LINK_BASE}/@${normalizedSlug}`;
  }, [data, targetKind, targetSlug]);

  const tooltipContent = useMemo(() => {
    if (isLoading) {
      return <span>Loading...</span>;
    }

    if (targetKind === 'game') {
      return (
        <div className="flex flex-col gap-1">
          <span><strong>Created:</strong> {formatDate(data?.game?.created_at)}</span>
          <span><strong>Verified:</strong> {toYesNo(data?.game?.is_verified)}</span>
          <span><strong>Claimable:</strong> {toYesNo(data?.game?.is_claimable)}</span>
          <span>
            <strong>Slug:</strong>{' '}
            {formatAdminSlug(data?.game?.requested_slug, data?.game?.slug) || '—'}
          </span>
          <span><strong>Studio:</strong> {data?.studio?.name || '—'}</span>
          <span>
            <strong>Studio slug:</strong>{' '}
            {formatAdminSlug(data?.studio?.requested_slug, data?.studio?.slug)
              ? `@${formatAdminSlug(data?.studio?.requested_slug, data?.studio?.slug)}`
              : '—'}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <span><strong>Created:</strong> {formatDate(data?.studio?.created_at)}</span>
        <span><strong>Verified:</strong> {toYesNo(data?.studio?.is_verified)}</span>
        <span><strong>Claimable:</strong> {toYesNo(data?.studio?.is_claimable)}</span>
        <span>
          <strong>Slug:</strong>{' '}
          {formatAdminSlug(data?.studio?.requested_slug, data?.studio?.slug)
            ? `@${formatAdminSlug(data?.studio?.requested_slug, data?.studio?.slug)}`
            : '—'}
        </span>
      </div>
    );
  }, [data, isLoading, targetKind]);

  return (
    <Tooltip
      title={targetKind === 'game' ? 'Game info' : 'Studio info'}
      text={tooltipContent}
      active
    >
      <span
        className="inline-flex"
        onMouseEnter={() => setHovered(true)}
      >
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium hover:underline"
          >
            {label}
          </a>
        ) : (
          <span className="font-medium">{label}</span>
        )}
      </span>
    </Tooltip>
  );
}

export function OutreachMessagesPanel({
  onUpdate,
  selectedMessageId,
  onSelectedMessageChange,
}: OutreachMessagesPanelProps) {
  const [queueDialogOpen, setQueueDialogOpen] = useState(false);
  const [replyOverlayOpen, setReplyOverlayOpen] = useState(false);
  const [composeGameName, setComposeGameName] = useState('');
  const [composeStudioName, setComposeStudioName] = useState('');
  const [composeContactEmail, setComposeContactEmail] = useState('');
  const [composeContactName, setComposeContactName] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryStatus>('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | MessageDirection>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | MessageChannel>('all');
  const [retryConfirm, setRetryConfirm] = useState<RetryConfirmState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const {data: messages = [], isLoading} = trpc.admin.listOutreachMessages.useQuery({
    limit: 200,
    offset: 0,
    search: search.trim() || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    direction: directionFilter === 'all' ? undefined : directionFilter,
    channel: channelFilter === 'all' ? undefined : channelFilter,
  });
  const selectedMessage = useMemo(
    () => (messages as OutreachMessage[]).find((message) => message.id === selectedMessageId) || null,
    [messages, selectedMessageId],
  );
  const selectedThreadId = selectedMessage?.thread_id ?? null;
  const hasValidSelectedThreadId = selectedThreadId ? DB_UUID_REGEX.test(selectedThreadId) : false;
  const {
    data: threadMessages = [],
    isLoading: isThreadLoading,
  } = trpc.admin.listOutreachThreadMessages.useQuery(
    {
      threadId: selectedThreadId || '00000000-0000-0000-0000-000000000000',
      limit: 500,
      offset: 0,
    },
    {
      enabled: hasValidSelectedThreadId,
    },
  );

  const retryMutation = trpc.admin.retryOutreachMessage.useMutation({
    onSuccess: onUpdate,
  });
  const deleteQueuedMutation = trpc.admin.deleteOutreachQueuedMessage.useMutation();
  const queueMessageMutation = trpc.admin.createOutreachMessage.useMutation({
    onSuccess: () => {
      setComposeGameName('');
      setComposeStudioName('');
      setComposeContactEmail('');
      setComposeContactName('');
      setComposeSubject('');
      setComposeBody('');
      setQueueDialogOpen(false);
      onSelectedMessageChange(null);
      onUpdate();
    },
  });
  const replyMessageMutation = trpc.admin.createOutreachMessage.useMutation({
    onSuccess: ({messageId}) => {
      setReplyBody('');
      setReplyOverlayOpen(false);
      onUpdate();
      onSelectedMessageChange(messageId);
    },
  });
  const isMutating = retryMutation.isPending
    || deleteQueuedMutation.isPending
    || queueMessageMutation.isPending
    || replyMessageMutation.isPending;
  const conversationMessages = useMemo(() => {
    if ((threadMessages as OutreachThreadMessage[]).length > 0) {
      return [...(threadMessages as OutreachThreadMessage[])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }
    if (selectedMessage) {
      return [{
        id: selectedMessage.id,
        thread_id: selectedMessage.thread_id,
        lead_id: selectedMessage.lead_id,
        channel: selectedMessage.channel,
        direction: selectedMessage.direction,
        provider: selectedMessage.provider,
        provider_message_id: selectedMessage.provider_message_id,
        template_id: selectedMessage.template_id,
        subject: selectedMessage.subject,
        body: selectedMessage.body,
        status: selectedMessage.status,
        error_code: selectedMessage.error_code,
        error_message: selectedMessage.error_message,
        scheduled_at: selectedMessage.scheduled_at,
        sent_at: selectedMessage.sent_at,
        created_at: selectedMessage.created_at,
        updated_at: selectedMessage.updated_at,
        lead: selectedMessage.lead,
      }];
    }
    return [];
  }, [threadMessages, selectedMessage]);
  const selectedLead = selectedMessage ? getLead(selectedMessage) : null;
  const selectedLeadId = selectedMessage?.lead_id ?? null;
  const selectedGameName = selectedLead?.target_type === 'game' ? selectedLead.target_name : '—';
  const selectedStudioName = selectedLead?.target_type === 'studio' ? selectedLead.target_name : '—';
  const selectedContact = selectedLead?.contact_identifier || '—';
  const selectedChannel = selectedMessage?.channel ?? null;
  const canReplyInThread = selectedChannel === 'email' || selectedChannel === 'twitter';
  const replyProvider = selectedChannel === 'twitter' ? 'twitter_api' : 'resend';
  const inferredReplySubject = useMemo(() => {
    const firstOutboundWithSubject = conversationMessages.find(
      (message) => message.direction === 'outbound' && Boolean(message.subject?.trim()),
    );
    const baseSubject = (firstOutboundWithSubject?.subject || selectedMessage?.subject || 'Message from Playlink').trim();
    return baseSubject.toLowerCase().startsWith('re:') ? baseSubject : `Re: ${baseSubject}`;
  }, [conversationMessages, selectedMessage]);

  const canQueueMessage = (composeGameName.trim().length > 0 || composeStudioName.trim().length > 0)
    && composeContactEmail.trim().length > 0
    && composeSubject.trim().length > 0
    && composeBody.trim().length > 0
    && !queueMessageMutation.isPending;
  const canSendReply = Boolean(
    selectedThreadId
    && selectedLeadId
    && canReplyInThread
    && replyBody.trim().length > 0
    && !replyMessageMutation.isPending,
  );
  const threadRows = useMemo(() => {
    const latestMessageByThread = new Map<string, OutreachMessage>();
    for (const item of messages as OutreachMessage[]) {
      if (!latestMessageByThread.has(item.thread_id)) {
        latestMessageByThread.set(item.thread_id, item);
      }
    }

    return Array.from(latestMessageByThread.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }, [messages]);

  const columns: TableColumn<OutreachMessage>[] = useMemo(() => [
    {
      title: 'Game',
      accessor: 'lead',
      renderContent: ({d}) => {
        const lead = getLead(d);
        return lead?.target_type === 'game'
          ? (
            <div className="flex flex-col gap-0.5">
              <TargetTooltipLink
                label={lead.target_name}
                leadId={lead.id}
                targetSlug={lead.target_slug}
                targetKind="game"
              />
              <span className="text-xs text-(--fg-subtle)">
                {lead.target_slug ? `/${lead.target_slug}` : '—'}
              </span>
            </div>
            )
          : <span className="text-sm text-(--fg-subtle)">—</span>;
      },
    },
    {
      title: 'Studio',
      accessor: 'contact_identifier',
      renderContent: ({d}) => {
        const lead = getLead(d);
        return lead?.target_type === 'studio'
          ? (
            <div className="flex flex-col gap-0.5">
              <TargetTooltipLink
                label={lead.target_name}
                leadId={lead.id}
                targetSlug={lead.target_slug}
                targetKind="studio"
              />
              <span className="text-xs text-(--fg-subtle)">
                {lead.target_slug ? `/${lead.target_slug}` : '—'}
              </span>
            </div>
            )
          : <span className="text-sm text-(--fg-subtle)">—</span>;
      },
    },
    {
      title: 'Contact',
      accessor: 'lead_id',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {getLead(d)?.contact_identifier || '—'}
        </span>
      ),
    },
    {
      title: 'Channel',
      accessor: 'channel',
      renderContent: ({d}) => (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <Icon icon={getChannelIcon(d.channel)} size={14} />
          <span>{getChannelLabel(d.channel)}</span>
        </span>
      ),
    },
    {
      title: 'Message',
      accessor: 'subject',
      renderContent: ({d}) => (
        <div className="flex flex-col gap-0.5 max-w-[320px]">
          <span className="font-medium truncate">{d.subject || '(No subject)'}</span>
          <span className="text-xs text-(--fg-subtle) truncate">{d.body || '—'}</span>
          {d.error_message && <span className="text-xs text-(--fg-muted) truncate">Error: {d.error_message}</span>}
        </div>
      ),
    },
    {
      title: 'Direction',
      accessor: 'direction',
      renderContent: ({d}) => (
        <Badge intent={d.direction === 'outbound' ? 'info' : 'warning'}>
          {d.direction}
        </Badge>
      ),
    },
    {
      title: 'Status',
      accessor: 'status',
      renderContent: ({d}) => {
        const status = getThreadListStatus(d);
        if (status === '—') {
          return <span className="text-sm text-(--fg-subtle)">—</span>;
        }
        return (
          <Badge intent={status === 'failed' ? 'error' : 'info'}>
            {status}
          </Badge>
        );
      },
    },
    {
      title: 'Last update',
      accessor: 'created_at',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {new Date(d.created_at).toLocaleString()}
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
    <div className="h-full min-h-0 flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2.5">
        <label className="flex flex-col gap-1 min-w-64 flex-1">
          <span className="text-xs text-(--fg-subtle)">Search</span>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject/body/provider id..."
          />
        </label>
        <label className="flex flex-col gap-1 min-w-36">
          <span className="text-xs text-(--fg-subtle)">Status</span>
          <Select
            options={[...STATUS_OPTIONS]}
            value={statusFilter}
            onChange={(e) => setStatusFilter((e.target as HTMLSelectElement).value as typeof statusFilter)}
          />
        </label>
        <label className="flex flex-col gap-1 min-w-36">
          <span className="text-xs text-(--fg-subtle)">Direction</span>
          <Select
            options={[...DIRECTION_OPTIONS]}
            value={directionFilter}
            onChange={(e) => setDirectionFilter((e.target as HTMLSelectElement).value as typeof directionFilter)}
          />
        </label>
        <label className="flex flex-col gap-1 min-w-36">
          <span className="text-xs text-(--fg-subtle)">Channel</span>
          <Select
            options={[...CHANNEL_OPTIONS]}
            value={channelFilter}
            onChange={(e) => setChannelFilter((e.target as HTMLSelectElement).value as typeof channelFilter)}
          />
        </label>
        <div className="ml-auto">
          <Button
            size="sm"
            variant="primary"
            onClick={() => setQueueDialogOpen(true)}
          >
            Queue email
          </Button>
        </div>
      </div>

      <PanelGroup orientation="vertical" className="min-h-0 flex-1 rounded-(--radius-md) border border-(--border-muted) overflow-hidden">
        <Panel defaultSize="62%" minSize="35%">
          <div className="h-full overflow-auto bg-(--bg-default)">
            <Table
              columns={columns}
              data={threadRows}
              propertyForKey="id"
              pagination={false}
              onClickRow={(row) => {
                const message = row as OutreachMessage;
                onSelectedMessageChange(message.id);
                setReplyOverlayOpen(false);
                setReplyBody('');
              }}
              rowCssFn={({d}) => (
                (d as OutreachMessage).thread_id === selectedThreadId
                  ? css`
                    background: var(--bg-subtle);
                    td:first-child {
                      background: var(--bg-subtle);
                    }
                  `
                  : null
              )}
              emptyMessage="No outreach threads found."
            />
          </div>
        </Panel>
        <PanelResizeHandle className="h-2 flex-none bg-(--bg-subtle) border-y border-(--border-muted) hover:bg-(--bg-muted) transition-colors cursor-row-resize" />
        <Panel defaultSize="38%" minSize="20%">
          <div className="h-full bg-(--bg-default) text-lg flex flex-col">
            {selectedThreadId && (
              <div className="shrink-0 border-b border-(--border-muted) px-3 py-2">
                <div className="flex items-start gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 flex-1 min-w-0">
                    <div className="min-w-0">
                      <p className="m-0 text-xs text-(--fg-subtle)">Game</p>
                      <p className="m-0 text-sm font-medium truncate">{selectedGameName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-xs text-(--fg-subtle)">Studio</p>
                      <p className="m-0 text-sm font-medium truncate">{selectedStudioName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-xs text-(--fg-subtle)">Contact</p>
                      <p className="m-0 text-sm font-medium truncate">{selectedContact}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="m-0 text-xs text-(--fg-subtle)">Channel</p>
                      {selectedChannel ? (
                        <p className="m-0 inline-flex items-center gap-1.5 text-sm font-medium truncate">
                          <Icon icon={getChannelIcon(selectedChannel)} size={14} />
                          <span>{getChannelLabel(selectedChannel)}</span>
                        </p>
                      ) : (
                        <p className="m-0 text-sm font-medium truncate">—</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <Button
                      variant={replyOverlayOpen ? 'outline' : 'primary'}
                      size="sm"
                      disabled={!canReplyInThread}
                      onClick={() => setReplyOverlayOpen((prev) => !prev)}
                    >
                      {replyOverlayOpen ? 'Close' : 'Reply'}
                    </Button>
                  </div>
                </div>
                {!canReplyInThread && (
                  <p className="m-0 mt-2 text-xs text-(--fg-subtle)">
                    Reply is available for Email and X threads only.
                  </p>
                )}
              </div>
            )}

            {selectedThreadId && canReplyInThread && replyOverlayOpen ? (
              <PanelGroup orientation="horizontal" className="min-h-0 flex-1">
                <Panel defaultSize="65%" minSize="35%">
                  <div className="min-h-0 h-full overflow-auto p-3 bg-[#f6efe2]">
                    {selectedThreadId && isThreadLoading && (
                      <div className="h-full flex items-center justify-center">
                        <Loading />
                      </div>
                    )}

                    {selectedThreadId && !isThreadLoading && conversationMessages.length === 0 && (
                      <div className="h-full flex items-center justify-center text-base text-(--fg-subtle)">
                        No messages found for this thread.
                      </div>
                    )}

                    {selectedThreadId && !isThreadLoading && conversationMessages.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {conversationMessages.map((message) => {
                          const lead = Array.isArray(message.lead) ? message.lead[0] : message.lead;
                          const isOutbound = message.direction === 'outbound';
                          const messageTime = new Date(message.created_at).getTime();
                          const isReadByReply = isOutbound && conversationMessages.some(
                            (item) => item.direction === 'inbound'
                              && new Date(item.created_at).getTime() > messageTime,
                          );

                          return (
                            <div
                              key={message.id}
                              className={`flex flex-col gap-1 ${isOutbound ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`w-full max-w-[60%] rounded-[16px] border p-3 ${
                                  isOutbound
                                    ? 'border-[#cfe8b9] bg-[#dcf8c6]'
                                    : 'border-[#e3e3e3] bg-white'
                                }`}
                              >
                                {!isOutbound && (
                                  <div className="text-sm font-semibold mb-1">
                                    {lead?.contact_identifier || 'Contact'}
                                  </div>
                                )}
                                {message.subject && (
                                  <div className="text-base font-medium mb-1">{message.subject}</div>
                                )}
                                <div className="text-base whitespace-pre-wrap break-words">
                                  {message.body || '—'}
                                </div>
                                {isOutbound && message.status === 'failed' && (
                                  <div className="mt-2 flex justify-end">
                                    <Button
                                      size="sm"
                                      variant="primary"
                                      disabled={isMutating}
                                      onClick={() =>
                                        setRetryConfirm({
                                          messageId: message.id,
                                          title: 'Retry message',
                                          description: 'Queue this failed outbound message for retry?',
                                        })}
                                    >
                                      Retry
                                    </Button>
                                  </div>
                                )}
                                <div className="mt-2 flex items-center justify-between gap-2">
                                  <span className="text-xs text-(--fg-subtle)">
                                    {new Date(message.created_at).toLocaleString()}
                                  </span>
                                  {isOutbound
                                    ? (
                                        <span className="inline-flex items-center gap-1">
                                          {message.status === 'queued' && (
                                            <IconButton
                                              size="sm"
                                              variant="ghost"
                                              icon={Trash2Icon}
                                              aria-label="Delete queued message"
                                              className="text-(--fg-danger)"
                                              disabled={isMutating}
                                              onClick={() =>
                                                setDeleteConfirm({
                                                  messageId: message.id,
                                                  title: 'Delete queued message',
                                                  description: 'Delete this queued message? This action cannot be undone.',
                                                })}
                                            />
                                          )}
                                          {renderDeliveryState(message.status, isReadByReply)}
                                        </span>
                                      )
                                    : <span />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Panel>
                <PanelResizeHandle className="w-2 flex-none bg-(--bg-subtle) border-x border-(--border-muted) hover:bg-(--bg-muted) transition-colors cursor-col-resize" />
                <Panel defaultSize="35%" minSize="25%">
                  <div className="min-h-0 h-full bg-(--bg) flex flex-col">
                    <div className="min-h-0 flex-1 p-3">
                      <Textarea
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                        placeholder="Write your reply..."
                        rows={10}
                        className="h-full w-full resize-none"
                      />
                    </div>
                    <div className="shrink-0 p-3 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={!canSendReply}
                        onClick={() => {
                          if (!selectedLeadId || !canSendReply) return;
                          replyMessageMutation.mutate({
                            leadId: selectedLeadId,
                            subject: selectedChannel === 'twitter' ? 'X DM reply' : inferredReplySubject,
                            body: replyBody.trim(),
                            provider: replyProvider,
                          });
                        }}
                      >
                        Send reply
                      </Button>
                    </div>
                  </div>
                </Panel>
              </PanelGroup>
            ) : (
              <div className="min-h-0 flex-1 overflow-auto p-3 bg-[#f6efe2]">
                {!selectedThreadId && (
                  <div className="h-full flex items-center justify-center text-base text-(--fg-subtle)">
                    Click a message to open its conversation thread.
                  </div>
                )}

                {selectedThreadId && isThreadLoading && (
                  <div className="h-full flex items-center justify-center">
                    <Loading />
                  </div>
                )}

                {selectedThreadId && !isThreadLoading && conversationMessages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-base text-(--fg-subtle)">
                    No messages found for this thread.
                  </div>
                )}

                {selectedThreadId && !isThreadLoading && conversationMessages.length > 0 && (
                  <div className="flex flex-col gap-3">
                    {conversationMessages.map((message) => {
                      const lead = Array.isArray(message.lead) ? message.lead[0] : message.lead;
                      const isOutbound = message.direction === 'outbound';
                      const messageTime = new Date(message.created_at).getTime();
                      const isReadByReply = isOutbound && conversationMessages.some(
                        (item) => item.direction === 'inbound'
                          && new Date(item.created_at).getTime() > messageTime,
                      );

                      return (
                        <div
                          key={message.id}
                          className={`flex flex-col gap-1 ${isOutbound ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`w-full max-w-[60%] rounded-[16px] border p-3 ${
                              isOutbound
                                ? 'border-[#cfe8b9] bg-[#dcf8c6]'
                                : 'border-[#e3e3e3] bg-white'
                            }`}
                          >
                            {!isOutbound && (
                              <div className="text-sm font-semibold mb-1">
                                {lead?.contact_identifier || 'Contact'}
                              </div>
                            )}
                            {message.subject && (
                              <div className="text-base font-medium mb-1">{message.subject}</div>
                            )}
                            <div className="text-base whitespace-pre-wrap break-words">
                              {message.body || '—'}
                            </div>
                            {isOutbound && message.status === 'failed' && (
                              <div className="mt-2 flex justify-end">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  disabled={isMutating}
                                  onClick={() =>
                                    setRetryConfirm({
                                      messageId: message.id,
                                      title: 'Retry message',
                                      description: 'Queue this failed outbound message for retry?',
                                    })}
                                >
                                  Retry
                                </Button>
                              </div>
                            )}
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-xs text-(--fg-subtle)">
                                {new Date(message.created_at).toLocaleString()}
                              </span>
                              {isOutbound
                                ? (
                                    <span className="inline-flex items-center gap-1">
                                      {message.status === 'queued' && (
                                        <IconButton
                                          size="sm"
                                          variant="ghost"
                                          icon={Trash2Icon}
                                          aria-label="Delete queued message"
                                          className="text-(--fg-danger)"
                                          disabled={isMutating}
                                          onClick={() =>
                                            setDeleteConfirm({
                                              messageId: message.id,
                                              title: 'Delete queued message',
                                              description: 'Delete this queued message? This action cannot be undone.',
                                            })}
                                        />
                                      )}
                                      {renderDeliveryState(message.status, isReadByReply)}
                                    </span>
                                  )
                                : <span />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </PanelGroup>

      <DialogOverlay opened={queueDialogOpen} setOpened={setQueueDialogOpen}>
        <DialogOverlay.Header showCloseButton>Queue email</DialogOverlay.Header>
        <DialogOverlay.Content className="flex flex-col gap-2.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-(--fg-subtle)">Game</span>
              <Input
                value={composeGameName}
                onChange={(e) => setComposeGameName(e.target.value)}
                placeholder="Celeste"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-(--fg-subtle)">Studio</span>
              <Input
                value={composeStudioName}
                onChange={(e) => setComposeStudioName(e.target.value)}
                placeholder="Extremely OK Games"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-(--fg-subtle)">Contact email</span>
              <Input
                type="email"
                value={composeContactEmail}
                onChange={(e) => setComposeContactEmail(e.target.value)}
                placeholder="hello@studio.com"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-(--fg-subtle)">Contact name (optional)</span>
              <Input
                value={composeContactName}
                onChange={(e) => setComposeContactName(e.target.value)}
                placeholder="Jane Doe"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-(--fg-subtle)">Subject</span>
            <Input
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="We created your play.link page"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-(--fg-subtle)">Body</span>
            <Textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              placeholder="Hi! We created a play.link page for your game..."
              rows={5}
            />
          </label>
        </DialogOverlay.Content>
        <DialogOverlay.Footer>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setQueueDialogOpen(false)}
            disabled={queueMessageMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!canQueueMessage}
            onClick={() =>
              queueMessageMutation.mutate({
                gameName: composeGameName.trim() || null,
                studioName: composeStudioName.trim() || null,
                contactEmail: composeContactEmail.trim(),
                contactDisplayName: composeContactName.trim() || null,
                subject: composeSubject.trim(),
                body: composeBody.trim(),
                provider: 'resend',
              })}
          >
            Queue email
          </Button>
        </DialogOverlay.Footer>
      </DialogOverlay>

      <TableActionConfirmDialog
        opened={Boolean(retryConfirm)}
        setOpened={(opened) => {
          if (!opened) setRetryConfirm(null);
        }}
        title={retryConfirm?.title || 'Confirm action'}
        description={retryConfirm?.description || ''}
        confirmLabel="Retry"
        confirmVariant="primary"
        isPending={isMutating}
        onConfirm={() => {
          if (!retryConfirm) return;
          retryMutation.mutate({messageId: retryConfirm.messageId});
          setRetryConfirm(null);
        }}
      />

      <TableActionConfirmDialog
        opened={Boolean(deleteConfirm)}
        setOpened={(opened) => {
          if (!opened) setDeleteConfirm(null);
        }}
        title={deleteConfirm?.title || 'Confirm action'}
        description={deleteConfirm?.description || ''}
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={isMutating}
        onConfirm={() => {
          if (!deleteConfirm) return;
          const fallbackMessage = conversationMessages.find((message) => message.id !== deleteConfirm.messageId);
          const deletingSelectedMessage = selectedMessageId === deleteConfirm.messageId;
          deleteQueuedMutation.mutate(
            {messageId: deleteConfirm.messageId},
            {
              onSuccess: () => {
                if (deletingSelectedMessage) {
                  onSelectedMessageChange(fallbackMessage?.id || null);
                }
                onUpdate();
              },
            },
          );
          setDeleteConfirm(null);
        }}
      />
    </div>
  );
}
