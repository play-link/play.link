import {PageLayout} from '@/components/layout';
import {DomainsSection} from '@/components/settings/DomainsSection';
import {ContextLevel, useAppContext} from '@/lib/app-context';

export function DomainsSettingsPage() {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);

  return (
    <PageLayout>
      <PageLayout.Header
        title="Domains"
        subtitle={`Configure custom domains for ${activeStudio.name}`}
      />
      <PageLayout.Content>
        <DomainsSection studioId={activeStudio.id} studioSlug={activeStudio.slug} />
      </PageLayout.Content>
    </PageLayout>
  );
}
