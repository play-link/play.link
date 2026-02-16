import * as React from 'react';
import type {
  ControllerProps,
  FieldPath,
  FieldPathValue,
  FieldValues,
} from 'react-hook-form';
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
  className?: string;
  fieldsetProps?: FieldsetProps;
  render: (
    params: Omit<ControllerRenderParams<TFieldValues, TName>, 'field'> & {
      controlledProps: ControlledProps<TFieldValues, TName>;
    },
  ) => React.ReactNode;
}

type ControlledProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
> = Omit<ControllerRenderParams<TFieldValues, TName>['field'], 'id' | 'invalid' | 'value'> & {
  /**
   * The id is set to the field name by default.
   */
  id: string;
  /**
   * invalid indicates if the field has an error.
   */
  invalid: boolean;
  /**
   * Points to help/error text ids for accessibility when present.
   */
  'aria-describedby'?: string;
  value: FieldPathValue<TFieldValues, TName>;
};

// FieldsetController wraps Controller and injects error state and an id into Fieldset.
// By using the field name as the default id, we ensure that if a Fieldset label is used,
// it will automatically associate with the rendered input.
export function FieldsetController<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  className,
  fieldsetProps = DEFAULT_FIELDSET_PROPS,
  render,
  name,
  ...props
}: FieldsetControllerProps<TFieldValues, TName>) {
  const fieldId = fieldsetProps?.labelFor || name;
  const helpTextId = `${fieldId}-help`;
  const invalidTextId = `${fieldId}-error`;
  const resolvedHelpTextId = fieldsetProps.helpTextId || helpTextId;
  const resolvedInvalidTextId = fieldsetProps.invalidTextId || invalidTextId;

  return (
    <Controller
      name={name}
      render={({field, ...rest}) => {
        const invalid = !!rest.fieldState.error;
        const hasInlineInvalidText
          = invalid && !fieldsetProps.invalidAsTooltip && !!rest.fieldState.error?.message;

        const describedByIds = [
          fieldsetProps.helpText ? resolvedHelpTextId : undefined,
          hasInlineInvalidText ? resolvedInvalidTextId : undefined,
        ].filter(Boolean);

        const controlledProps: ControlledProps<TFieldValues, TName> = {
          ...field,
          invalid,
          id: fieldId,
          'aria-describedby':
            describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
        };

        return (
          <Fieldset
            className={[fieldsetProps.className, className].filter(Boolean).join(' ') || undefined}
            labelFor={fieldId}
            helpTextId={fieldsetProps.helpText ? resolvedHelpTextId : undefined}
            invalid={invalid}
            invalidText={rest.fieldState.error?.message}
              invalidTextId={hasInlineInvalidText ? resolvedInvalidTextId : undefined}
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
