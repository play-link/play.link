import {useEffect} from 'react';
import type {ReactNode} from 'react';
import type {LucideIcon} from 'lucide-react';
import {useSearchParams} from 'react-router-dom';
import {
  ActivityIcon,
  AlertTriangleIcon,
  BuildingIcon,
  FileTextIcon,
  Gamepad2Icon,
  LayoutGridIcon,
  MailIcon,
  MessageSquareIcon,
  SearchCheckIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import {Badge, Button, Icon} from '@play/pylon';
import {
  ChangeRequestsTable,
  GamesPanel,
  OutreachEventsPanel,
  OutreachLeadsPanel,
  OutreachMessagesPanel,
  OwnershipClaimsPanel,
  ProtectedSlugsPanel,
  StudiosPanel,
  VerificationClaimsPanel,
} from '@/components';
import {trpc} from '@/lib';

type AdminSection =
  | 'home'
  | 'ownership-claims'
  | 'reports'
  | 'protected'
  | 'studios'
  | 'games'
  | 'requests'
  | 'outreach-leads'
  | 'outreach-messages'
  | 'outreach-events';

const ADMIN_SECTIONS: readonly AdminSection[] = [
  'home',
  'ownership-claims',
  'reports',
  'protected',
  'studios',
  'games',
  'requests',
  'outreach-leads',
  'outreach-messages',
  'outreach-events',
];

function isAdminSection(value: string | null): value is AdminSection {
  return value !== null && ADMIN_SECTIONS.includes(value as AdminSection);
}

interface AdminNavItem {
  id: AdminSection;
  group: 'overview' | 'moderation' | 'verification' | 'catalog' | 'outreach';
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({label, value}: StatCardProps) {
  return (
    <div className="rounded-(--radius-md) border border-(--border-muted) bg-(--bg-subtle) p-4">
      <div className="text-sm text-(--fg-muted) mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

interface SectionHelpProps {
  title: string;
  description: string;
}

function SectionHelp({title, description}: SectionHelpProps) {
  return (
    <div className="px-1">
      <h2 className="text-2xl font-semibold m-0">{title}</h2>
      <p className="text-sm text-(--fg-muted) mt-2 mb-0">{description}</p>
    </div>
  );
}

interface SectionPanelProps extends SectionHelpProps {
  children: ReactNode;
}

function SectionPanel({title, description, children}: SectionPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <SectionHelp title={title} description={description} />
      {children}
    </div>
  );
}

export function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const utils = trpc.useUtils();
  const sectionParam = searchParams.get('section');
  const activeSection: AdminSection = isAdminSection(sectionParam) ? sectionParam : 'home';
  const selectedOutreachMessageId = searchParams.get('message');
  const isOutreachMessagesSection = activeSection === 'outreach-messages';

  const setAdminLocation = (section: AdminSection, messageId?: string | null) => {
    const params = new URLSearchParams(searchParams);
    params.set('section', section);
    if (section === 'outreach-messages' && messageId) {
      params.set('message', messageId);
    } else {
      params.delete('message');
    }
    setSearchParams(params);
  };

  useEffect(() => {
    const shouldSetDefaultSection = !isAdminSection(sectionParam);
    const shouldClearMessage = activeSection !== 'outreach-messages' && Boolean(searchParams.get('message'));
    if (!shouldSetDefaultSection && !shouldClearMessage) return;

    const params = new URLSearchParams(searchParams);
    if (shouldSetDefaultSection) params.set('section', 'home');
    if (shouldClearMessage) params.delete('message');
    setSearchParams(params, {replace: true});
  }, [activeSection, sectionParam, searchParams, setSearchParams]);

  const {data: summary} = trpc.admin.getDashboardSummary.useQuery();
  const {data: changeRequests = []} = trpc.changeRequest.list.useQuery({});

  const invalidateAll = () => {
    utils.changeRequest.list.invalidate();
    utils.admin.listStudios.invalidate();
    utils.admin.listGames.invalidate();
    utils.admin.listOwnershipClaims.invalidate();
    utils.admin.listVerificationClaims.invalidate();
    utils.admin.listProtectedSlugs.invalidate();
    utils.admin.listOutreachLeads.invalidate();
    utils.admin.listOutreachMessages.invalidate();
    utils.admin.listOutreachThreadMessages.invalidate();
    utils.admin.listOutreachEvents.invalidate();
    utils.admin.getDashboardSummary.invalidate();
  };

  const navItems: AdminNavItem[] = [
    {
      id: 'home',
      group: 'overview',
      label: 'Home',
      icon: LayoutGridIcon,
    },
    {
      id: 'ownership-claims',
      group: 'moderation',
      label: 'Ownership Claims',
      icon: SearchCheckIcon,
      count: summary?.openOwnershipClaims ?? 0,
    },
    {
      id: 'reports',
      group: 'moderation',
      label: 'Reports',
      icon: AlertTriangleIcon,
      count: summary?.openReports ?? 0,
    },
    {
      id: 'requests',
      group: 'moderation',
      label: 'Change Requests',
      icon: FileTextIcon,
      count: summary?.pendingRequests ?? 0,
    },
    {
      id: 'outreach-leads',
      group: 'outreach',
      label: 'Outreach Leads',
      icon: MailIcon,
    },
    {
      id: 'outreach-messages',
      group: 'outreach',
      label: 'Outreach Messages',
      icon: MessageSquareIcon,
    },
    {
      id: 'outreach-events',
      group: 'outreach',
      label: 'Outreach Events',
      icon: ActivityIcon,
    },
    {
      id: 'protected',
      group: 'catalog',
      label: 'Protected Slugs',
      icon: ShieldCheckIcon,
    },
    {
      id: 'studios',
      group: 'verification',
      label: 'Studios',
      icon: BuildingIcon,
      count: summary?.unverifiedStudios ?? 0,
    },
    {
      id: 'games',
      group: 'verification',
      label: 'Games',
      icon: Gamepad2Icon,
      count: summary?.unverifiedGames ?? 0,
    },
  ];
  const navGroups: Array<{id: AdminNavItem['group']; label: string}> = [
    {id: 'overview', label: 'Overview'},
    {id: 'moderation', label: 'Moderation'},
    {id: 'outreach', label: 'Outreach'},
    {id: 'verification', label: 'Verification'},
    {id: 'catalog', label: 'Catalog'},
  ];

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-[16.5rem_minmax(0,1fr)] overflow-hidden">
      <aside className="hidden lg:block border-r border-(--border) bg-(--bg-subtle)">
        <div className="h-full px-3 py-4">
          <nav className="flex flex-col gap-2">
            {navGroups.map((group) => (
              <div key={group.id} className="flex flex-col gap-1">
                <p className="m-0 px-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-(--fg-muted)">
                  {group.label}
                </p>
                {navItems
                  .filter((item) => item.group === group.id)
                  .map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <Button
                        key={item.id}
                        variant="nav"
                        size="sm"
                        className={`w-full ${isActive ? 'active' : ''}`}
                        onClick={() => setAdminLocation(item.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <Icon icon={item.icon} size={16} />
                            <span className="font-medium">{item.label}</span>
                          </div>
                          {item.count !== undefined && item.count > 0 && (
                            <Badge intent="warning">{item.count}</Badge>
                          )}
                        </div>
                      </Button>
                    );
                  })}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <section className="min-w-0 h-full overflow-y-auto">
        <aside className="lg:hidden border-b border-(--border-muted) p-3">
          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <Button
                  key={item.id}
                  variant="nav"
                  size="sm"
                  className={`w-full ${isActive ? 'active' : ''}`}
                  onClick={() => setAdminLocation(item.id)}
                >
                  <Icon icon={item.icon} size={14} className="mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </aside>

        <div className={isOutreachMessagesSection ? 'h-full p-4' : 'flex flex-col gap-6 p-8 pb-10'}>
            {activeSection === 'home' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <StatCard label="Pending change requests" value={summary?.pendingRequests ?? 0} />
                  <StatCard label="Open ownership claims" value={summary?.openOwnershipClaims ?? 0} />
                  <StatCard label="Open reports" value={summary?.openReports ?? 0} />
                  <StatCard label="Unverified studios" value={summary?.unverifiedStudios ?? 0} />
                  <StatCard label="Unverified games" value={summary?.unverifiedGames ?? 0} />
                  <StatCard
                    label="Total open moderation items"
                    value={(summary?.openOwnershipClaims ?? 0) + (summary?.openReports ?? 0)}
                  />
                </div>
              </>
            )}

            {activeSection === 'ownership-claims' && (
              <SectionPanel
                title="Ownership Claims"
                description="Use this queue when a real developer wants to claim a preloaded game page. Approve with transfer to move ownership to the requesting studio."
              >
                <OwnershipClaimsPanel onUpdate={invalidateAll} />
              </SectionPanel>
            )}

            {activeSection === 'reports' && (
              <SectionPanel
                title="Reports"
                description="Reports are moderation signals (impersonation, abuse, fraud, etc.). Resolving a report and removing verification are separate actions from publish/unpublish."
              >
                <VerificationClaimsPanel onUpdate={invalidateAll} />
              </SectionPanel>
            )}

            {activeSection === 'protected' && (
              <SectionPanel
                title="Protected Slugs"
                description="These slugs require verification before they can be published. This does not control whether a link is claimable: that is managed with is_claimable."
              >
                <ProtectedSlugsPanel onUpdate={invalidateAll} />
              </SectionPanel>
            )}

            {activeSection === 'studios' && (
              <SectionPanel
                title="Studios"
                description="Studio verification is a trust signal. Only protected slugs require verification to publish."
              >
                <StudiosPanel onUpdate={invalidateAll} />
              </SectionPanel>
            )}

            {activeSection === 'games' && (
              <SectionPanel
                title="Games"
                description="Game verification is a trust signal. Only protected slugs require verification to publish."
              >
                <GamesPanel onUpdate={invalidateAll} />
              </SectionPanel>
            )}

            {activeSection === 'requests' && (
              <SectionPanel
                title="Change Requests"
                description="Pending manual/legacy edits for moderation. Approve only when the requested value is valid and safe."
              >
                <ChangeRequestsTable
                  changeRequests={changeRequests}
                  onUpdate={invalidateAll}
                />
              </SectionPanel>
            )}

            {activeSection === 'outreach-leads' && (
              <SectionPanel
                title="Outreach Leads"
                description="Queue of contacts discovered or imported for game/studio outreach. Use this to qualify leads, block bad contacts, and mark progress."
              >
                <OutreachLeadsPanel onUpdate={invalidateAll} />
              </SectionPanel>
            )}

            {activeSection === 'outreach-messages' && (
              <div className="h-full min-h-0">
                <OutreachMessagesPanel
                  onUpdate={invalidateAll}
                  selectedMessageId={selectedOutreachMessageId}
                  onSelectedMessageChange={(messageId) => setAdminLocation('outreach-messages', messageId)}
                />
              </div>
            )}

            {activeSection === 'outreach-events' && (
              <SectionPanel
                title="Outreach Events"
                description="Provider webhook stream (delivery, replies, bounces, failures) for debugging and operational monitoring."
              >
                <OutreachEventsPanel onUpdate={invalidateAll} />
              </SectionPanel>
            )}
        </div>
      </section>
    </div>
  );
}
