import {useState} from 'react';
import {Card, TabNav, TabNavItem} from '@play/pylon';
import {ChangeRequestsTable, GamesPanel, PageLayout, StudiosPanel} from '@/components';
import {trpc} from '@/lib';

type TabValue = 'requests' | 'studios' | 'games';

export function AdminPage() {
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<TabValue>('requests');

  const {data: summary} = trpc.admin.getDashboardSummary.useQuery();
  const {data: changeRequests = []} = trpc.changeRequest.list.useQuery({});

  const invalidateAll = () => {
    utils.changeRequest.list.invalidate();
    utils.admin.listStudios.invalidate();
    utils.admin.listGames.invalidate();
    utils.admin.getDashboardSummary.invalidate();
  };

  return (
    <PageLayout>
      <PageLayout.Header title="Admin" subtitle="Manage verifications and change requests" />
      <PageLayout.Content>
        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-sm text-(--fg-subtle) mb-1">Pending Requests</div>
            <div className="text-2xl font-semibold">{summary?.pendingRequests ?? 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-(--fg-subtle) mb-1">Unverified Studios</div>
            <div className="text-2xl font-semibold">{summary?.unverifiedStudios ?? 0}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-(--fg-subtle) mb-1">Unverified Games</div>
            <div className="text-2xl font-semibold">{summary?.unverifiedGames ?? 0}</div>
          </Card>
        </div>

        {/* Tabs */}
        <TabNav>
          <TabNavItem
            active={activeTab === 'requests'}
            onClick={() => setActiveTab('requests')}
          >
            Change Requests
          </TabNavItem>
          <TabNavItem
            active={activeTab === 'studios'}
            onClick={() => setActiveTab('studios')}
          >
            Studios
          </TabNavItem>
          <TabNavItem
            active={activeTab === 'games'}
            onClick={() => setActiveTab('games')}
          >
            Games
          </TabNavItem>
        </TabNav>

        <div className="mt-4">
          {activeTab === 'requests' && (
            <ChangeRequestsTable
              changeRequests={changeRequests}
              onUpdate={invalidateAll}
            />
          )}
          {activeTab === 'studios' && <StudiosPanel onUpdate={invalidateAll} />}
          {activeTab === 'games' && <GamesPanel onUpdate={invalidateAll} />}
        </div>
      </PageLayout.Content>
    </PageLayout>
  );
}
