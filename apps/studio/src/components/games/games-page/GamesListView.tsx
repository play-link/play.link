import {GamepadIcon} from 'lucide-react'
import styled, {css} from 'styled-components'
import {Badge, Icon, Table} from '@play/pylon'
import type {TableColumn} from '@play/pylon'
import type {GameRow} from './types'

interface GamesListViewProps {
  rows: GameRow[]
  onGameClick: (gameId: string) => void
}

const gameColumns: TableColumn<GameRow>[] = [
  {
    title: 'Game',
    accessor: 'title',
    renderContent: ({d}) => (
      <div className="flex items-center gap-3">
        <Thumbnail>
          {d.coverUrl ? (
            <ThumbnailImage src={d.coverUrl} alt={d.title} />
          ) : (
            <ThumbnailPlaceholder>
              <Icon icon={GamepadIcon} size={18} />
            </ThumbnailPlaceholder>
          )}
        </Thumbnail>
        <div>
          <div className="font-semibold">{d.title}</div>
          <div className="text-sm" style={{color: 'var(--fg-muted)'}}>
            play.link/{d.slug}
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Status',
    accessor: 'published',
    width: 120,
    renderContent: ({d}) => (
      <Badge>{d.published ? 'Published' : 'Draft'}</Badge>
    ),
  },
  {
    title: 'Last updated',
    accessor: 'updatedAt',
    type: 'date',
    width: 150,
    renderContent: ({d}) => {
      const date = d.updatedAt || d.createdAt
      return (
        <span style={{color: 'var(--fg-muted)'}}>
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
  },
]

export function GamesListView({rows, onGameClick}: GamesListViewProps) {
  return (
    <Table
      data={rows}
      columns={gameColumns}
      pagination={false}
      sortBy="-updatedAt"
      onClickRow={(row) => onGameClick(row.id)}
      headCss={css`
        th {
          border-top: 0;
        }
      `}
      tableCss={css`
        tr {
          cursor: pointer;
        }
      `}
    />
  )
}

const Thumbnail = styled.div`
  width: 5rem;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-muted);
  flex-shrink: 0;
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const ThumbnailPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-subtle);
`
