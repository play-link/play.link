import {useCallback, useState} from 'react';

export function useListNavigation(optionsLength: number) {
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);

  const handleArrowNavigation = useCallback(
    (evt: React.KeyboardEvent) => {
      if (evt.key === 'Tab') {
        evt.preventDefault();
        evt.stopPropagation();
        setFocusedIdx(0);
      } else if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
        evt.preventDefault();
        evt.stopPropagation();
        const maxIndex = optionsLength - 1;
        let nextIdx: number;
        if (focusedIdx === null) {
          nextIdx = 0;
        } else if (evt.key === 'ArrowDown') {
          nextIdx = Math.min(focusedIdx + 1, maxIndex);
        } else {
          nextIdx = Math.max(focusedIdx - 1, 0);
        }
        setFocusedIdx(nextIdx);
      }
    },
    [focusedIdx, optionsLength],
  );

  return {focusedIdx, setFocusedIdx, handleArrowNavigation};
}
