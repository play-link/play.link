import {trpc} from '@/lib';
import {ChangeRequestsTable, PageLayout} from '@/components';

export function AdminPage() {
  const utils = trpc.useUtils();
  const {data: changeRequests = []} = trpc.changeRequest.list.useQuery({});

  return (
    <PageLayout>
      <PageLayout.Header title="Admin" subtitle="Manage change requests" />
      <PageLayout.Content>
        <ChangeRequestsTable
          changeRequests={changeRequests}
          onUpdate={() => utils.changeRequest.list.invalidate()}
        />
      </PageLayout.Content>
    </PageLayout>
  );
}
