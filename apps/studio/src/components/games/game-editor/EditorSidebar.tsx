import styled from 'styled-components';
import {ColorPickerInput} from '@play/pylon';

export interface PageConfig {
  theme?: {
    bgColor?: string;
    textColor?: string;
    linkColor?: string;
  };
}

const DEFAULTS = {
  bgColor: '#030712',
  textColor: '#ffffff',
  linkColor: '#818cf8',
};

interface EditorSidebarProps {
  pageConfig: PageConfig;
  onChange: (config: PageConfig) => void;
}

export function EditorSidebar({pageConfig, onChange}: EditorSidebarProps) {
  const theme = pageConfig.theme ?? {};

  const updateThemeColor = (key: keyof typeof DEFAULTS, color: string) => {
    onChange({
      ...pageConfig,
      theme: {
        ...theme,
        [key]: color,
      },
    });
  };

  return (
    <Container>
      <SectionTitle>Theme Colors</SectionTitle>

      <Field>
        <FieldLabel>Background</FieldLabel>
        <ColorPickerInput
          value={theme.bgColor || DEFAULTS.bgColor}
          onChange={(c) => updateThemeColor('bgColor', c)}
        />
      </Field>

      <Field>
        <FieldLabel>Text</FieldLabel>
        <ColorPickerInput
          value={theme.textColor || DEFAULTS.textColor}
          onChange={(c) => updateThemeColor('textColor', c)}
        />
      </Field>

      <Field>
        <FieldLabel>Links</FieldLabel>
        <ColorPickerInput
          value={theme.linkColor || DEFAULTS.linkColor}
          onChange={(c) => updateThemeColor('linkColor', c)}
        />
      </Field>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding: var(--spacing-4);
`;

const SectionTitle = styled.h3`
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--fg);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
`;

const FieldLabel = styled.label`
  font-size: var(--text-sm);
  color: var(--fg-muted);
`;
