import {useCallback, useEffect, useState} from 'react';
import type {TableProps} from './types';

interface UseContextMenuProps<T extends Record<string, any>> {
  contextMenuContent?: TableProps<T>['contextMenuContent'];
  onContextMenuRow?: TableProps<T>['onContextMenuRow'];
  propertyForKey: string;
  currentPageData: T[];
}

export function useContextMenu<T extends {[key: string]: any}>({
  contextMenuContent,
  onContextMenuRow,
  propertyForKey,
  currentPageData,
}: UseContextMenuProps<T>) {
  const [contextMenuOpened, setContextMenuOpened] = useState(false);
  const [contextMenuRowKey, setContextMenuRowKey] = useState<string | number | undefined>();
  const [contextMenuEvent, setContextMenuEvent] = useState<React.MouseEvent | null>(null);

  const handleContextMenu = useCallback(
    (row: T, event: React.MouseEvent) => {
      if (contextMenuContent) {
        event.preventDefault();
        const rowKey = row[propertyForKey];
        setContextMenuRowKey(rowKey);
        setContextMenuEvent(event);
        setContextMenuOpened(true);
      } else if (onContextMenuRow) {
        onContextMenuRow(row, event);
      }
    },
    [contextMenuContent, onContextMenuRow, propertyForKey],
  );

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuOpened(false);
    setContextMenuRowKey(undefined);
    setContextMenuEvent(null);
  }, []);

  const contextMenuRowData =
    contextMenuRowKey !== undefined
      ? currentPageData.find((d) => d[propertyForKey] === contextMenuRowKey)
      : undefined;

  useEffect(() => {
    if (!contextMenuOpened && contextMenuRowKey !== undefined) {
      const timer = setTimeout(() => {
        handleCloseContextMenu();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [contextMenuOpened, contextMenuRowKey, handleCloseContextMenu]);

  return {
    contextMenuOpened,
    setContextMenuOpened,
    contextMenuRowKey,
    contextMenuEvent,
    handleContextMenu,
    handleCloseContextMenu,
    contextMenuRowData,
  };
}
