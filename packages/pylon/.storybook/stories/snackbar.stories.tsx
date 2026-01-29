import {useState} from 'react';
import {Button} from '../../src/components/button';
import {SnackbarProvider, useSnackbar} from '../../src/components/snackbar/SnackbarContext';
import {ProvidersDecorator} from '../Providers';

export default {
  title: 'Components/Snackbar',
  decorators: [ProvidersDecorator],
};

function StackingDemo() {
  const {showSnackbar} = useSnackbar();
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-bold text-lg">Stacking Snackbars</h2>
      <p className="text-sm text-gray-500">
        Click the buttons multiple times to see snackbars stack!
      </p>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="primary"
          onClick={() => {
            setCount((c) => c + 1);
            showSnackbar({
              message: `Success message #${count + 1}`,
              severity: 'success',
            });
          }}
        >
          Show Success
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            showSnackbar({
              message: 'This is an info message',
              severity: 'info',
            })
          }
        >
          Show Info
        </Button>
        <Button
          variant="warning"
          onClick={() =>
            showSnackbar({
              message: 'Warning! Something needs attention',
              severity: 'warning',
            })
          }
        >
          Show Warning
        </Button>
        <Button
          variant="destructive"
          onClick={() =>
            showSnackbar({
              message: 'Error occurred!',
              severity: 'error',
            })
          }
        >
          Show Error
        </Button>
      </div>
    </div>
  );
}

function StackingTemplate() {
  return (
    <SnackbarProvider position="top-center">
      <StackingDemo />
    </SnackbarProvider>
  );
}

export const Default = StackingTemplate.bind({});
