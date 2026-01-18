import { Button } from "@play/pylon";

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white tracking-tight">
          Play<span className="text-indigo-400">.link</span>
        </h1>
        <p className="text-slate-300 text-lg">
          Interactive experiences, reimagined
        </p>
        <Button>Explore</Button>
      </div>
    </div>
  );
}

export default App;
