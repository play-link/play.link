import {Button} from '@play/pylon';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-[var(--primary-active)] to-gray-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white tracking-tight">
          Play<span className="text-[var(--primary-muted)]">.link</span>
        </h1>
        <p className="text-gray-200 text-lg">
          Interactive experiences, reimagined
        </p>
        <Button>Explore</Button>
      </div>
    </div>
  );
}

export default App;
