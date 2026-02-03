import {useCallback, useEffect, useRef, useState} from 'react';

interface UseEditableCollectionParams<TServerItem, TEditableItem> {
  scopeKey: string;
  source: TServerItem[];
  isFetched: boolean;
  toEditable: (items: TServerItem[]) => TEditableItem[];
}

export function useEditableCollection<TServerItem, TEditableItem>({
  scopeKey,
  source,
  isFetched,
  toEditable,
}: UseEditableCollectionParams<TServerItem, TEditableItem>) {
  const [items, setItems] = useState<TEditableItem[]>([]);
  const initialRef = useRef<TEditableItem[]>([]);
  const initializedScopeRef = useRef<string | null>(null);

  useEffect(() => {
    initializedScopeRef.current = null;
    initialRef.current = [];
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setItems([]);
  }, [scopeKey]);

  useEffect(() => {
    if (!isFetched) return;
    if (initializedScopeRef.current === scopeKey) return;

    const editable = toEditable(source);
    initialRef.current = editable;
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setItems(editable);
    initializedScopeRef.current = scopeKey;
  }, [isFetched, scopeKey, source, toEditable]);

  const setInitial = useCallback((nextItems: TEditableItem[]) => {
    initialRef.current = nextItems;
  }, []);

  return {
    items,
    setItems,
    initialRef,
    setInitial,
  };
}
