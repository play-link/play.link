import type {ReactNode} from 'react';
import {useEffect, useRef, useState} from 'react';
import {styled} from 'styled-components';

type Props = {
  children: ReactNode;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export function InputAdornment({children, leftAdornment, rightAdornment, className, style}: Props) {
  const leftAdornmentRef = useRef<HTMLDivElement>(null);
  const rightAdornmentRef = useRef<HTMLDivElement>(null);
  const [leftAdornmentWidth, setLeftAdornmentWidth] = useState(0);
  const [rightAdornmentWidth, setRightAdornmentWidth] = useState(0);

  useEffect(() => {
    if (leftAdornmentRef.current) {
      const width = leftAdornmentRef.current.offsetWidth;
      setLeftAdornmentWidth(width);
    } else {
      setLeftAdornmentWidth(0);
    }
  }, [leftAdornment]);

  useEffect(() => {
    if (rightAdornmentRef.current) {
      const width = rightAdornmentRef.current.offsetWidth;
      setRightAdornmentWidth(width);
    } else {
      setRightAdornmentWidth(0);
    }
  }, [rightAdornment]);

  return (
    <Root className={className} style={style}>
      {leftAdornment && (
        <Adornment ref={leftAdornmentRef} $position="left">
          {leftAdornment}
        </Adornment>
      )}
      <InputWrapper
        $leftAdornmentWidth={leftAdornmentWidth}
        $rightAdornmentWidth={rightAdornmentWidth}
      >
        {children}
      </InputWrapper>
      {rightAdornment && (
        <Adornment ref={rightAdornmentRef} $position="right">
          {rightAdornment}
        </Adornment>
      )}
    </Root>
  );
}

const Root = styled.div`
  align-items: center;
  display: flex;
  position: relative;
  width: 100%;
`;

const Adornment = styled.div<{$position: 'left' | 'right'}>`
  align-items: center;
  bottom: 0;
  display: flex;
  height: 100%;
  justify-content: center;
  position: absolute;
  top: 0;
  z-index: 1;
  ${({$position}) => ($position === 'left' ? 'left: 0' : 'right: 0')};
`;

const InputWrapper = styled.div<{
  $leftAdornmentWidth: number;
  $rightAdornmentWidth: number;
}>`
  width: 100%;

  input {
    width: 100%;
    ${({$leftAdornmentWidth}) =>
      $leftAdornmentWidth > 0
        ? `padding-left: calc(${$leftAdornmentWidth}px + var(--spacing-1-5));`
        : ''}
    ${({$rightAdornmentWidth}) =>
      $rightAdornmentWidth > 0
        ? `padding-right: calc(${$rightAdornmentWidth}px + var(--spacing-1-5));`
        : ''}
  }
`;
