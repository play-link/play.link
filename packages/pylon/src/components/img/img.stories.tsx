import styled from 'styled-components';
import {Img} from './Img';
import {ProvidersDecorator} from '.storybook/Providers';

export default {
  title: 'Img',
  component: Img,
  decorators: [ProvidersDecorator],
};

function Template() {
  return <StyledImg src="https://www.w3schools.com/tags/img_girl.jpg" sizing="cover" />;
}

const StyledImg = styled(Img)`
  width: 200px;
  height: 200px;
`;

export const Default = Template.bind({});
