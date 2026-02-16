import styled from 'styled-components'
import {Loading} from '@play/pylon'

export function GamesPageLoadingState() {
  return (
    <LoadingContainer>
      <Loading size="lg" />
    </LoadingContainer>
  )
}

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16rem;
`
