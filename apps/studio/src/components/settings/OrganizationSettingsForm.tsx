import {useForm} from 'react-hook-form';
import {Button, Card, Fieldset, Input} from '@play/pylon';
import {trpc} from '@/lib';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

interface OrganizationSettingsFormProps {
  organization: Organization;
}

export function OrganizationSettingsForm({
  organization,
}: OrganizationSettingsFormProps) {
  const {register, handleSubmit} = useForm({
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
    },
  });

  const createChangeRequest = trpc.changeRequest.create.useMutation();

  const onSubmit = (data: {name?: string; slug?: string}) => {
    if (data.name && data.name !== organization.name) {
      createChangeRequest.mutate({
        entityType: 'organization',
        entityId: organization.id,
        fieldName: 'name',
        requestedValue: data.name,
      });
    }

    if (data.slug && data.slug !== organization.slug) {
      createChangeRequest.mutate({
        entityType: 'organization',
        entityId: organization.id,
        fieldName: 'slug',
        requestedValue: data.slug,
      });
    }
  };

  return (
    <Card>
      <h2>Organization Settings</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Fieldset>
          <label>Organization Name</label>
          <Input {...register('name')} className="mb-4" />
          <label>Organization Slug</label>
          <Input {...register('slug')} className="mb-4" />
          <Button
            type="submit"
            variant="primary"
            disabled={createChangeRequest.isPending}
          >
            Request Change
          </Button>
        </Fieldset>
      </form>
    </Card>
  );
}
