import {MemoryRouter} from 'react-router';
import {OverlayProvider} from '../src/components/overlay/OverlayContext';
import './index.css';

export function ProvidersDecorator(Story: any) {
  return (
    <MemoryRouter>
      <OverlayProvider>
        <Story />
      </OverlayProvider>
    </MemoryRouter>
  );
}
