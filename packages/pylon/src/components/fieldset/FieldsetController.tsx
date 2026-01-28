import * as React from 'react';
import type {ControllerProps, FieldPath, FieldValues} from 'react-hook-form';
import {Controller} from 'react-hook-form';
import type {FieldsetProps} from './Fieldset';
import {Fieldset} from './Fieldset';

const DEFAULT_FIELDSET_PROPS: FieldsetProps = {};

// Extract the render parameter type from Controller
type ControllerRenderParams<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Parameters<NonNullable<ControllerProps<TFieldValues, TName>['render']>>[0];

// Our render callback will receive everything except the raw field,
// plus our controlledProps that combine the field props with an id and invalid flag.
interface FieldsetControllerProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  fieldsetProps?: FieldsetProps;
  render: (
    params: Omit<ControllerRenderParams<TFieldValues, TName>, 'field'> & {
      controlledProps: Omit<
        ControllerRenderParams<TFieldValues, TName>['field'],
        'id' | 'invalid' | 'value'
      > & {
        /**
         * The id is set to the field name by default.
         */
        id: string;
        /**
         * invalid indicates if the field has an error.
         */
        invalid: boolean;
        value: any;
      };
    },
  ) => React.ReactNode;
}

// FieldsetController wraps Controller and injects error state and an id into Fieldset.
// By using the field name as the default id, we ensure that if a Fieldset label is used,
// it will automatically associate with the rendered input.
export function FieldsetController<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  fieldsetProps = DEFAULT_FIELDSET_PROPS,
  render,
  name,
  ...props
}: FieldsetControllerProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      render={({field, ...rest}) => {
        const controlledProps = {
          ...field,
          invalid: !!rest.fieldState.error,
          id: name,
        };
        return (
          <Fieldset
            labelFor={fieldsetProps?.labelFor || name}
            invalid={!!rest.fieldState.error}
            invalidText={rest.fieldState.error?.message}
            {...fieldsetProps}
          >
            {render({controlledProps, ...rest})}
          </Fieldset>
        );
      }}
      {...props}
    />
  );
}
