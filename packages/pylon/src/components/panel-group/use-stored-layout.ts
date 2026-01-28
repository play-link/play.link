import {useEffect, useMemo, useState} from 'react';

// Store layouts as: { panelGroupId: { panelKey: percentage } }
type StoredLayout = Record<string, Record<string, string>>;

interface UseStoredLayoutParams {
  panelGroupId: string;
  panelKeys: string[]; // Array of panel keys in current render order
  childsRef: React.RefObject<HTMLElement[]>;
}

const STORAGE_KEY = 'panel-group';

// Helper to read from local storage (moved outside to avoid closure issues)
const getStoredLayout = (groupId: string, keys: string[]): Record<string, string> | undefined => {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    if (item) {
      const allLayouts: StoredLayout = JSON.parse(item);
      const groupLayout = allLayouts[groupId];
      if (groupLayout) {
        // Return only the layouts for panels that are currently present
        const filtered: Record<string, string> = {};
        keys.forEach((key) => {
          if (groupLayout[key]) {
            filtered[key] = groupLayout[key];
          }
        });
        return Object.keys(filtered).length > 0 ? filtered : undefined;
      }
    }
  } catch (err) {
    console.error(err);
  }
  return undefined;
};

export const useStoredLayout = ({panelGroupId, panelKeys, childsRef}: UseStoredLayoutParams) => {
  // Create a stable key for panelKeys to use in dependency array
  const panelKeysKey = useMemo(() => panelKeys.join(','), [panelKeys]);

  const [storedLayout, setStoredLayout] = useState<Record<string, string> | undefined>(() =>
    getStoredLayout(panelGroupId, panelKeys),
  );

  // Update layout when panelGroupId or panelKeys change
  useEffect(() => {
    const currentLayout = getStoredLayout(panelGroupId, panelKeys);
    setStoredLayout(currentLayout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelGroupId, panelKeysKey]);

  const updateLocalStorage = () => {
    try {
      const allLayoutsRaw = localStorage.getItem(STORAGE_KEY);
      const allLayouts: StoredLayout = allLayoutsRaw ? JSON.parse(allLayoutsRaw) : {};

      // Get the previous layout for this panel group
      const previousLayout = allLayouts[panelGroupId] || {};

      // Calculate new layout from the current panel sizes, keyed by panel key
      const newLayout: Record<string, string> = {};

      childsRef.current.forEach((child, idx) => {
        const panelKey = panelKeys[idx];
        if (!panelKey) return;

        if (child) {
          // Assumes flex value is of the form "XX 0 0%" where XX is a percentage number.
          const flex = child.style.flex;
          const match = flex.match(/^([\d.]+)\s/);
          const currentPct = match ? match[1] : '0';

          // If panel is 0%, preserve its last known size from previous layout
          if (currentPct === '0' && previousLayout[panelKey] && previousLayout[panelKey] !== '0') {
            newLayout[panelKey] = previousLayout[panelKey];
          } else {
            newLayout[panelKey] = currentPct;
          }
        } else {
          // If no child element, preserve previous size if available
          newLayout[panelKey] = previousLayout[panelKey] || '0';
        }
      });

      // Merge with previous layout to preserve panels that aren't currently rendered
      const mergedLayout = {
        ...previousLayout,
        ...newLayout,
      };

      allLayouts[panelGroupId] = mergedLayout;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
      setStoredLayout(newLayout);
    } catch (err) {
      console.error(err);
    }
  };

  // Expose a setter to initialize the layout directly.
  const setLayoutDirectly = (layout: Record<string, string>) => {
    try {
      const allLayoutsRaw = localStorage.getItem(STORAGE_KEY);
      const allLayouts: StoredLayout = allLayoutsRaw ? JSON.parse(allLayoutsRaw) : {};
      allLayouts[panelGroupId] = layout;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
      setStoredLayout(layout);
    } catch (err) {
      console.error(err);
    }
  };

  return [storedLayout, updateLocalStorage, setLayoutDirectly] as const;
};
