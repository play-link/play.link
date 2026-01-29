import {OrganizationSettingsForm, PageLayout} from '@/components';
import {ContextLevel, useAppContext} from '@/lib/app-context';

export function StudioSettingsPage() {
  const {activeOrganization} = useAppContext(ContextLevel.AuthenticatedWithOrg);

  return (
    <PageLayout>
      <PageLayout.Header
        title="Studio"
        subtitle={`Configure ${activeOrganization.name}`}
      />
      <PageLayout.Content>
        <OrganizationSettingsForm organization={activeOrganization} />
      </PageLayout.Content>
    </PageLayout>
  );
}
