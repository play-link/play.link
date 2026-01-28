import type {InputHTMLAttributes} from 'react';
import {useImperativeHandle, useRef, useState} from 'react';
import type {RuleSet} from 'styled-components';
import styled from 'styled-components';
import type {ButtonProps} from '../button';
import {Button} from '../button';

export interface InputFileProps {
  buttonCss?: RuleSet<object>;
  buttonProps?: ButtonProps;
  placeholder?: string;
  ref?: React.Ref<HTMLInputElement>;
  showSelectedFileNames?: boolean;
}

type Props = InputHTMLAttributes<HTMLInputElement> & InputFileProps;

export function InputFile({
  ref,
  buttonCss,
  buttonProps,
  multiple = false,
  onChange,
  placeholder,
  showSelectedFileNames = true,
  ...props
}: Props) {
  const [selectedFiles, setSelectedFiles] = useState<FileList | []>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => inputRef.current!);

  const handleFileChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(evt);
    }
    setSelectedFiles(evt.target.files ?? []);
  };

  const getButtonLabel = () => {
    if (selectedFiles.length > 0 && showSelectedFileNames) {
      return Array.from(selectedFiles)
        .map((file) => file.name)
        .join(', ');
    }
    return placeholder || (multiple ? 'Select files' : 'Select file');
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        tabIndex={-1}
        multiple={multiple}
        style={{display: 'none'}}
        onChange={handleFileChange}
        {...props}
      />

      <StyledButton
        variant="primary"
        onClick={() => inputRef.current?.click()}
        $extraCss={buttonCss}
        {...buttonProps}
      >
        {getButtonLabel()}
      </StyledButton>
    </>
  );
}

const StyledButton = styled(Button)<{$extraCss?: RuleSet<object>}>`
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  ${(p) => p.$extraCss}
`;
