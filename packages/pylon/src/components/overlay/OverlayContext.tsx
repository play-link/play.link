import type {ReactNode} from 'react';
import {createContext, useCallback, useEffect, useMemo, useState} from 'react';

export interface OverlayContextProps {
  /**
   * Opens an overlay with the provided content renderer.
   *
   * Note: The `contentRenderer` function is a closure that captures the data
   * at the time `openOverlay` is called. Any changes to that data after opening
   * will NOT be propagated to the overlay.
   *
   * Convention: When passing props to the overlay that are potentially mutable
   * (i.e. values that could change over time but you want to freeze them as initial
   * defaults), prefix them with "default". For example, use `defaultTitle` instead of
   * `title` to signal that the value is only used as an initial snapshot. In contrast,
   * inherently immutable values (like IDs) need not use the "default" prefix.
   *
   * If dynamic updates are required, consider rendering the overlay directly in your component.
   */
  openOverlay: (
    contentRenderer: (opened: boolean, setOpened: (opened: boolean) => void) => ReactNode,
  ) => void;
}

export const OverlayContext = createContext<OverlayContextProps | undefined>(undefined);

interface Overlay {
  id: number;
  contentRenderer: (opened: boolean, setOpened: (opened: boolean) => void) => ReactNode;
}

let overlayIdCounter = 0;

export const OverlayProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [overlays, setOverlays] = useState<Overlay[]>([]);

  const openOverlay = useCallback(
    (contentRenderer: (opened: boolean, setOpened: (opened: boolean) => void) => ReactNode) => {
      const id = overlayIdCounter++;
      setOverlays((prevOverlays) => [...prevOverlays, {id, contentRenderer}]);
    },
    [],
  );

  const removeOverlay = (id: number) => {
    setOverlays((prevOverlays) => prevOverlays.filter((overlay) => overlay.id !== id));
  };

  const value = useMemo(() => ({openOverlay}), [openOverlay]);

  return (
    <OverlayContext value={value}>
      {children}
      {overlays.map(({id, contentRenderer}) => (
        <OverlayInstance
          key={id}
          id={id}
          contentRenderer={contentRenderer}
          removeOverlay={removeOverlay}
        />
      ))}
    </OverlayContext>
  );
};

interface OverlayInstanceProps {
  id: number;
  contentRenderer: (opened: boolean, setOpened: (opened: boolean) => void) => ReactNode;
  removeOverlay: (id: number) => void;
}

const OverlayInstance: React.FC<OverlayInstanceProps> = ({id, contentRenderer, removeOverlay}) => {
  const [opened, setOpened] = useState(true);

  useEffect(() => {
    if (!opened) {
      removeOverlay(id);
    }
  }, [opened, id, removeOverlay]);

  return opened ? <>{contentRenderer(opened, setOpened)}</> : null;
};
