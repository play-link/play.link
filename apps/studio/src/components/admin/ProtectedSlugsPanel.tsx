import {useState} from 'react'
import {Badge, Button, Input, Loading, Select, Table} from '@play/pylon'
import type {TableColumn} from '@play/pylon'
import {trpc} from '@/lib'
import {TableActionConfirmDialog} from './TableActionConfirmDialog'

interface ProtectedSlugRow {
  id: string;
  entity_type: 'studio' | 'game_page';
  slug: string;
  reason: string | null;
  created_at: string;
}

interface ProtectedSlugsPanelProps {
  onUpdate: () => void;
}

const ENTITY_OPTIONS = [
  {label: 'Studio', value: 'studio'},
  {label: 'Game page', value: 'game_page'},
] as const

export function ProtectedSlugsPanel({onUpdate}: ProtectedSlugsPanelProps) {
  const [entityType, setEntityType] = useState<'studio' | 'game_page'>('studio')
  const [slug, setSlug] = useState('')
  const [reason, setReason] = useState('')
  const [slugPendingDelete, setSlugPendingDelete] = useState<ProtectedSlugRow | null>(null)

  const {data: protectedSlugs = [], isLoading} = trpc.admin.listProtectedSlugs.useQuery({})

  const addMutation = trpc.admin.addProtectedSlug.useMutation({
    onSuccess: () => {
      setSlug('')
      setReason('')
      onUpdate()
    },
  })

  const removeMutation = trpc.admin.removeProtectedSlug.useMutation({
    onSuccess: onUpdate,
  })

  const canSubmit = slug.trim().length >= 3 && !addMutation.isPending

  const columns: TableColumn<ProtectedSlugRow>[] = [
    {
      title: 'Slug',
      accessor: 'slug',
      renderContent: ({d}) => <span className="font-medium">{d.slug}</span>,
    },
    {
      title: 'Entity',
      accessor: 'entity_type',
      renderContent: ({d}) => (
        <Badge intent={d.entity_type === 'studio' ? 'info' : 'warning'}>
          {d.entity_type === 'studio' ? 'Studio' : 'Game page'}
        </Badge>
      ),
    },
    {
      title: 'Reason',
      accessor: 'reason',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">{d.reason || '—'}</span>
      ),
    },
    {
      title: 'Created',
      accessor: 'created_at',
      renderContent: ({d}) => (
        <span className="text-sm text-(--fg-subtle)">
          {new Date(d.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: 'Actions',
      accessor: 'actions',
      renderContent: ({d}) => (
        <Button
          variant="ghost"
          size="xs"
          disabled={removeMutation.isPending}
          onClick={() => setSlugPendingDelete(d)}
        >
          Eliminar
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2.5">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-(--fg-subtle)">Entity</span>
          <Select
            options={[...ENTITY_OPTIONS]}
            value={entityType}

            onChange={(e) => setEntityType((e.target as HTMLSelectElement).value as 'studio' | 'game_page')}
          />
        </label>

        <label className="flex flex-col gap-1 min-w-48">
          <span className="text-xs text-(--fg-subtle)">Slug</span>
          <Input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="popular-slug"
          />
        </label>

        <label className="flex flex-col gap-1 min-w-56">
          <span className="text-xs text-(--fg-subtle)">Reason</span>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional"
          />
        </label>

        <Button
          variant="primary"

          disabled={!canSubmit}
          onClick={() =>
            addMutation.mutate({
              entityType,
              slug: slug.trim().toLowerCase(),
              reason: reason.trim() || null,
            })
          }
        >
          Add protected slug
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loading />
        </div>
      ) : (
        <Table
          columns={columns}
          data={protectedSlugs as ProtectedSlugRow[]}
          propertyForKey="id"
          bleed={8}
          emptyMessage="No protected slugs."
        />
      )}

      <TableActionConfirmDialog
        opened={Boolean(slugPendingDelete)}
        setOpened={(opened) => {
          if (!opened) setSlugPendingDelete(null)
        }}
        title="Delete protected slug"
        description={
          slugPendingDelete
            ? `Are you sure you want to delete the protected slug "${slugPendingDelete.slug}"?`
            : ''
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        isPending={removeMutation.isPending}
        onConfirm={() => {
          if (!slugPendingDelete) return
          removeMutation.mutate({id: slugPendingDelete.id})
          setSlugPendingDelete(null)
        }}
      />
    </div>
  )
}
