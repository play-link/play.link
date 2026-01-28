import {styled} from 'styled-components';

const defaultColors: Array<[string, string]> = [
  ['#697fff', '#ff9ada'],
  ['#ff5900', '#ff9ada'],
  ['#697fff', '#00d192'],
  ['#ff5900', '#e6ff00'],
  ['#00d192', '#e6ff00'],
  ['#0061ff', '#60efff'],
  ['#ba42c0', '#deb8f5'],
  ['#01dbff', '#0f971c'],
  ['#ff51eb', '#ede342'],
  ['#a106f4', '#00d192'],
  ['#697fff', '#8752a3'],
  ['#f40752', '#ff9ada'],
  ['#f19e18', '#ff5900'],
  ['#6c35c8', '#ef566a'],
  ['#00d192', '#46b83d'],
  ['#ff9ada', '#ed5c86'],
  ['#ff9ada', '#00458e'],
  ['#01dbff', '#f55c7a'],
  ['#ff5900', '#f90c71'],
  ['#00d192', '#affcaf'],
];

// https://en.wikipedia.org/wiki/Linear_congruential_generator
function stringAsciiPRNG(value: string, m: number): number {
  const charCodes = value.split('').map((letter) => letter.charCodeAt(0));
  const len = charCodes.length;
  const a = (len % (m - 1)) + 1;
  const c = charCodes.reduce((current, next) => current + next) % m;

  let random = charCodes[0] % m;
  for (let i = 0; i < len; i++) random = (a * random + c) % m;

  return random;
}

/**
 * Get a value based color.
 * The reason for this is we want colors to be consistent for the same value.
 */
function getRandomGradient(value: string, colors: string[][] = defaultColors): string {
  if (!value) return 'transparent';
  const idx = stringAsciiPRNG(value, colors.length);
  const [colorA, colorB] = colors[idx > -1 ? idx : 0];
  return `linear-gradient(to bottom, ${colorA}, ${colorB})`;
}

export type AvatarSize = 'lg' | 'md' | 'sm' | 'xs';

export interface AvatarProps {
  className?: string;
  size?: AvatarSize | number;
  src?: string;
  text?: string;
}

export function Avatar({text = '-', size = 'md', src, ...restProps}: AvatarProps) {
  const _size = typeof size === 'string' ? sizeMap[size] : size;

  return (
    <StyledAvatar $size={_size} $src={src} $text={text} {...restProps}>
      {src ? null : text.charAt(0)}
    </StyledAvatar>
  );
}

const StyledAvatar = styled.div<{$size: number; $src?: string; $text: string}>`
  align-items: center;
  background-position: center;
  background-size: cover;
  border-radius: 100%;
  box-shadow: inset 0 0 0 0.0625rem hsl(0deg 0% 100% / 20%);
  color: var(--white);
  display: flex;
  flex-shrink: 0;
  font-size: ${(p) => Math.max(p.$size / 2.5, 10)}px;
  font-weight: 500;
  height: ${(p) => p.$size}px;
  justify-content: center;
  text-transform: uppercase;
  width: ${(p) => p.$size}px;
  ${(p) =>
    p.$src
      ? `
          background-image: url(${p.$src});
        `
      : `
          background: ${getRandomGradient(p.$text)};
        `}
`;

const sizeMap = {
  lg: 38,
  md: 28,
  sm: 24,
  xs: 18,
};
