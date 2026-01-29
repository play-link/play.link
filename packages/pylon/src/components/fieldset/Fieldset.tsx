import type {HTMLAttributes, ReactNode} from 'react';
import type {RuleSet} from 'styled-components';
import styled from 'styled-components';
import {Tooltip} from '../tooltip';

export type FieldsetProps = HTMLAttributes<HTMLFieldSetElement> & {
  // Additional CSS rules to customize the Fieldset's styling using styled-components
  fieldsetCss?: RuleSet<object>;
  // Help text displayed below the Fieldset; can be a simple string or a React element
  helpText?: string | ReactNode;
  // Determines if the Fieldset is in an invalid state
  invalid?: boolean;
  // Text indicating an invalid state, shown either inline or in a tooltip
  invalidText?: string;
  // Label text or element displayed above the Fieldset
  label?: string | ReactNode;
  // The ID of the associated input element; used for the label's htmlFor attribute
  labelFor?: string;
  // If true, the invalid text will be displayed in a tooltip rather than inline
  invalidAsTooltip?: boolean;
  // If false, the Fieldset will take up the full width of its container
  noFullWidth?: boolean;
};

export function Fieldset({
  children,
  fieldsetCss,
  helpText,
  invalid = false,
  invalidAsTooltip = false,
  invalidText,
  label,
  labelFor,
  noFullWidth = false,
  ...restProps
}: FieldsetProps) {
  return (
    <StyledFieldset $fieldsetCss={fieldsetCss} $noFullWidth={noFullWidth} {...restProps}>
      {label && <Label htmlFor={labelFor}>{label}</Label>}
      {invalid && invalidAsTooltip ? (
        <Tooltip
          text={invalidText}
          severity="error"
          keepOpenedOnChildFocus
          overlayPosition={{
            horizontalAlign: 'left',
            verticalOffset: 2,
          }}
          className="w-full"
        >
          {children}
        </Tooltip>
      ) : (
        children
      )}
      {invalid && !invalidAsTooltip && !!invalidText && <InvalidText>{invalidText}</InvalidText>}
      {!!helpText && <HelpText>{helpText}</HelpText>}
    </StyledFieldset>
  );
}

const StyledFieldset = styled.fieldset<{
  $fieldsetCss: FieldsetProps['fieldsetCss'];
  $noFullWidth: FieldsetProps['noFullWidth'];
}>`
  align-items: flex-start;
  display: inline-flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
  width: ${(p) => (p.$noFullWidth ? 'auto' : '100%')};
  ${(p) => p.$fieldsetCss}
`;

const Label = styled.label`
  color: var(--fg);
  font-size: var(--text-sm);
  margin-bottom: var(--spacing-0-5);
  width: 100%;
`;

const InvalidText = styled.p`
  color: var(--error-dark);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  margin-top: var(--spacing-0-5);
`;

const HelpText = styled.p`
  color: var(--fg-subtle);
  font-size: var(--text-sm);
  margin-top: var(--spacing-0-5);
`;
