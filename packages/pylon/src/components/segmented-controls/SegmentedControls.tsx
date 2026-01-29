import type {ReactNode} from 'react';
import {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';
import {toClassName} from '../../style';

const DEFAULT_ITEMS: SegmentedControlsItem[] = [];

export interface SegmentedControlsItem {
  label?: string;
  icon?: ReactNode;
  render?: () => ReactNode;
  value: string;
  disabled?: boolean;
}

export type SegmentedControlsSize = 'sm' | 'md' | 'lg';

export interface SegmentedControlsProps {
  className?: string;
  defaultValue?: string;
  items: SegmentedControlsItem[];
  onChange?: (_item: SegmentedControlsItem) => void;
  size?: SegmentedControlsSize;
  value?: string;
}

export function SegmentedControls({
  className,
  defaultValue,
  items = DEFAULT_ITEMS,
  onChange,
  size = 'md',
  value,
  ...restProps
}: SegmentedControlsProps) {
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue || (items[0]?.value ?? ''),
  );

  // Use controlled value if provided, otherwise use internal state
  const selectedValue = value !== undefined ? value : internalValue;
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === selectedValue),
  );

  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeBgStyle, setActiveBgStyle] = useState({left: 0, width: 0});
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    const currentButton = buttonRefs.current[selectedIndex];
    if (currentButton) {
      const rect = currentButton.getBoundingClientRect();
      const parentRect = currentButton.parentElement?.getBoundingClientRect();
      const left = rect.left - (parentRect?.left || 0);
      const width = rect.width;
      setActiveBgStyle({left, width});
    }
  }, [selectedIndex, items]);

  const renderItemContent = (item: SegmentedControlsItem) => {
    if (item.render) {
      return item.render();
    }

    if (item.icon) {
      return (
        <ItemContent>
          {item.icon}
          {item.label && <span>{item.label}</span>}
        </ItemContent>
      );
    }

    if (item.label) {
      return item.label;
    }

    return null;
  };

  return (
    <Root $size={size} {...restProps} className={className}>
      {items.map((item, idx) => (
        <ControlButton
          key={item.value}
          type="button"
          ref={(el) => {
            buttonRefs.current[idx] = el;
          }}
          tabIndex={0}
          className={toClassName({
            active: item.value === selectedValue,
          })}
          disabled={item.disabled}
          onClick={() => {
            setHasUserInteracted(true);
            if (value === undefined) {
              setInternalValue(item.value);
            }
            onChange?.(item);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setHasUserInteracted(true);
              if (value === undefined) {
                setInternalValue(item.value);
              }
              onChange?.(item);
            }
          }}
        >
          {renderItemContent(item)}
        </ControlButton>
      ))}
      <ActiveBgWrapper
        $hasUserInteracted={hasUserInteracted}
        style={{
          left: `${activeBgStyle.left}px`,
          width: `${activeBgStyle.width}px`,
        }}
      >
        <ActiveBg />
      </ActiveBgWrapper>
    </Root>
  );
}

const SIZES = {
  sm: '1.75rem',
  md: '1.875rem',
  lg: '2.125rem',
};

const Root = styled.div<{$size: SegmentedControlsProps['size']}>`
  align-items: center;
  background: var(--bg-press);
  border-radius: var(--radius-lg);
  cursor: pointer;
  display: inline-flex;
  height: ${(props) => SIZES[props.$size as keyof typeof SIZES]};
  outline: 0.125rem solid var(--bg-press);
  position: relative;
  user-select: none;
`;

const ControlButton = styled.button`
  all: unset;
  /*  */
  align-items: center;
  color: var(--fg);
  display: flex;
  flex: 1;
  height: 100%;
  justify-content: center;
  padding: 0 var(--spacing-4);
  line-height: 1;
  position: relative;
  text-align: center;
  white-space: nowrap;
  z-index: 1;

  &.active {
    color: var(--segmented-selected-text, --fg);
    font-weight: var(--font-weight-medium);
  }

  &:disabled {
    color: var(--fg-placeholder);
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid var(--input-outline-color);
  }
`;

const ItemContent = styled.div`
  align-items: center;
  display: flex;
  gap: var(--spacing-2);
`;

const ActiveBgWrapper = styled.div<{$hasUserInteracted: boolean}>`
  bottom: 0;
  pointer-events: none;
  position: absolute;
  top: 0;
  transition: ${(props) =>
    props.$hasUserInteracted ? 'width, left 0.2s var(--ease-in-out)' : 'none'};
`;

const ActiveBg = styled.div`
  background: var(--segmented-selected-bg, --bg);
  border-radius: var(--radius-lg);
  height: 100%;
  width: 100%;
`;
