import type {MetaFunction} from 'react-router';
import {Button} from '@play/pylon';

export const meta: MetaFunction = () => [
  {title: 'Play.link - Interactive experiences, reimagined'},
  {name: 'description', content: 'Play.link - Interactive experiences'},
  {property: 'og:title', content: 'Play.link'},
  {property: 'og:description', content: 'Interactive experiences, reimagined'},
  {property: 'og:type', content: 'website'},
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white tracking-tight">
          Play<span className="text-(--color-primary-400)">.link</span>
        </h1>
        <p className="text-gray-200 text-lg">
          Interactive experiences, reimagined
        </p>
        <Button>Explore</Button>
      </div>
    </div>
  );
}
