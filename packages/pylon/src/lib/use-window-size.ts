import {useLayoutEffect, useState} from 'react';
import {off, on} from './utils';

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useLayoutEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    on(window, 'resize', updateSize);
    return () => off(window, 'resize', updateSize);
  }, []);

  return size;
}
