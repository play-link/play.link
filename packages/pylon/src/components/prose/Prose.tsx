import type {HTMLAttributes, ReactNode} from 'react';
import styled from 'styled-components';

export interface ProseProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Size variant for text */
  size?: 'sm' | 'base';
}

/**
 * Prose component for rendering formatted text content with proper typography.
 * Applies consistent styling for paragraphs, lists, and other text elements.
 *
 * @example
 * <Prose>
 *   <p>Some introductory text.</p>
 *   <ul>
 *     <li>First item</li>
 *     <li>Second item</li>
 *   </ul>
 * </Prose>
 */
export function Prose({children, size = 'sm', ...props}: ProseProps) {
  return (
    <Root $size={size} {...props}>
      {children}
    </Root>
  );
}

const Root = styled.div<{$size: 'sm' | 'base'}>`
  font-size: ${({$size}) => ($size === 'sm' ? 'var(--text-sm)' : 'var(--text-base)')};
  line-height: var(--leading-relaxed);

  /* Paragraphs */
  p {
    margin: 0;
  }

  p + p {
    margin-top: var(--spacing-3);
  }

  /* Lists */
  ul,
  ol {
    margin: var(--spacing-2) 0;
    padding-left: var(--spacing-5);
  }

  ul {
    list-style-type: disc;
  }

  ol {
    list-style-type: decimal;
  }

  li {
    margin: var(--spacing-1) 0;
  }

  li::marker {
    color: var(--fg-muted);
  }

  /* Nested lists */
  ul ul,
  ol ol,
  ul ol,
  ol ul {
    margin: var(--spacing-1) 0;
  }

  /* Headings/strong text */
  b,
  strong {
    font-weight: var(--font-weight-medium);
  }

  /* Links */
  a {
    color: var(--primary);
    text-decoration: underline;

    &:hover {
      text-decoration: none;
    }
  }

  /* Code */
  code {
    background: var(--bg-subtle);
    border-radius: var(--radius-sm);
    font-family: var(--font-mono);
    font-size: 0.9em;
    padding: 0.1em 0.3em;
  }

  /* Spacing between different element types */
  > * + * {
    margin-top: var(--spacing-3);
  }

  > *:first-child {
    margin-top: 0;
  }
`;
