import type {HTMLAttributes} from 'react';
import {useState} from 'react';
import {Toast} from '../toast';

type Props = {
  onSubmit: () => void;
} & HTMLAttributes<HTMLFormElement>;

export type FormProps = Props;

export function Form({children, onSubmit, ...props}: Props) {
  const [networkError, setNetworkError] = useState<any>(null);

  return (
    <form
      onSubmit={(evt: any) => {
        evt.preventDefault();
        try {
          onSubmit();
        } catch (error: any) {
          setNetworkError(error);
        }
      }}
      {...props}
    >
      {!!networkError?.message && (
        <Toast severity="error" className="mb-6">
          {networkError.message}
        </Toast>
      )}
      {children}
    </form>
  );
}
