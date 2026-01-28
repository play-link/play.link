import {css} from 'styled-components';

export const breakpoints = {
  sm: 568,
  md: 768,
  lg: 1024,
  xl: 1200,
  xxl: 1400,
};

export type Breakpoint = keyof typeof breakpoints;

export function mediaQuery(
  breakpoint: 'sm>' | '<sm' | 'md>' | '<md' | 'lg>' | '<lg' | 'xl>' | '<xl' | 'xxl>' | '<xxl',
  styles: ReturnType<typeof css>,
) {
  let operator, bp;

  if (breakpoint.startsWith('<')) {
    operator = '<';
    bp = breakpoint.slice(1) as Breakpoint;
  } else {
    operator = '>';
    bp = breakpoint.slice(0, -1) as Breakpoint;
  }

  let mediaFeature;
  if (operator === '>') {
    mediaFeature = `(min-width: ${breakpoints[bp]}px)`;
  } else if (operator === '<') {
    mediaFeature = `(max-width: ${breakpoints[bp]}px)`;
  } else {
    throw new Error(`Invalid operator: ${operator}`);
  }

  return css`
    @media ${mediaFeature} {
      ${styles}
    }
  `;
}
