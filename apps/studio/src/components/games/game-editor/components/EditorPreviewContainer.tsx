import type {ReactNode} from 'react';
import styled from 'styled-components';

interface EditorPreviewContainerProps {
  previewMode: 'desktop' | 'mobile';
  children: ReactNode;
}

export function EditorPreviewContainer({previewMode, children}: EditorPreviewContainerProps) {
  return (
    <PreviewArea $mobile={previewMode === 'mobile'}>
      {previewMode === 'mobile' ? (
        <MobileFrame>
          <MobileScreen>{children}</MobileScreen>
        </MobileFrame>
      ) : children}
    </PreviewArea>
  );
}

const PreviewArea = styled.div<{$mobile: boolean}>`
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${(props) => props.$mobile
    ? `
      align-items: center;
      justify-content: center;
      background: var(--bg-muted);
    `
    : ''}
`;

const MobileFrame = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 2rem;
`;

const MobileScreen = styled.div`
  width: 393px;
  height: 852px;
  max-height: calc(100vh - 6rem);
  border-radius: 2.5rem;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;
