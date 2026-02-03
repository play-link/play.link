import type {EditableLink, EditableMedia, GameLink, GameMedia} from './types';

const NEW_ITEM_PREFIX = 'new-';

export function hashValue(value: unknown): string {
  return JSON.stringify(value);
}

export function toEditableLinks(links: GameLink[]): EditableLink[] {
  return links.map((link) => {
    const rawLink = link as Record<string, unknown>;
    return {
      id: link.id,
      type: link.type,
      category: link.category,
      label: link.label,
      url: link.url ?? '',
      position: link.position,
      comingSoon: rawLink.coming_soon as boolean | undefined,
    };
  });
}

export function toEditableMedia(items: GameMedia[]): EditableMedia[] {
  return items.map((item) => ({
    id: item.id,
    type: item.type as 'image' | 'video',
    url: item.url,
    thumbnailUrl: item.thumbnail_url || item.url,
    position: item.position,
  }));
}

interface DiffResult<T> {
  created: T[];
  updated: T[];
  deleted: T[];
}

export function diffEditableItems<T extends {id: string}>(
  initial: T[],
  current: T[],
): DiffResult<T> {
  const initialMap = new Map(initial.map((item) => [item.id, item]));
  const currentMap = new Map(current.map((item) => [item.id, item]));

  const deleted = initial.filter((item) => !currentMap.has(item.id));
  const created = current.filter((item) => item.id.startsWith(NEW_ITEM_PREFIX));
  const updated = current.filter((item) => {
    if (item.id.startsWith(NEW_ITEM_PREFIX)) return false;

    const previous = initialMap.get(item.id);
    if (!previous) return false;

    return hashValue(previous) !== hashValue(item);
  });

  return {created, updated, deleted};
}
