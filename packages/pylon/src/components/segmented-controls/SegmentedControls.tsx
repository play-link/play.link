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

const Root = styled.div<{$size: SegmentedControlsProps['size']}>`
  align-items: center;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  cursor: pointer;
  display: inline-flex;
  height: ${(props) => `var(--control-height-${props.$size})`};
  padding: 0.125rem;
  position: relative;
  user-select: none;
`;

const ControlButton = styled.button`
  all: unset;
  /*  */
  align-items: center;
  color: var(--fg-body);
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
    color: var(--segmented-selected-text, --fg-body);
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
  bottom: 2px;
  pointer-events: none;
  position: absolute;
  top: 2px;
  transition: ${(props) =>
    props.$hasUserInteracted ? 'width, left 0.2s var(--ease-in-out)' : 'none'};
`;

const ActiveBg = styled.div`
  background: var(--segmented-selected-bg, --bg-body);
  border-radius: var(--radius-full);
  height: 100%;
  width: 100%;
  border: 1px solid var(--border-subtle);
  /* box-shadow: 0 2px 0 0 var(--border-subtle); */
  /* margin-top: -1px; */
`;
