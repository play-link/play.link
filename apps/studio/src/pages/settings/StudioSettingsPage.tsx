import {PageLayout, StudioSettingsForm} from '@/components';
import {ContextLevel, useAppContext} from '@/lib/app-context';

export function StudioSettingsPage() {
  const {activeStudio} = useAppContext(ContextLevel.AuthenticatedWithStudio);

  return (
    <PageLayout>
      <PageLayout.Header
        title="Studio"
        subtitle={`Configure ${activeStudio.name}`}
      />
      <PageLayout.Content>
        <StudioSettingsForm studio={activeStudio} />
      </PageLayout.Content>
    </PageLayout>
  );
}
