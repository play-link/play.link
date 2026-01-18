import {Button} from '@play/pylon';
import {useAuth} from '@/lib/auth';

export function HomePage() {
  const {user, signOut} = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold text-white tracking-tight">
          Play.link <span className="text-purple-400">Studio</span>
        </h1>
        <p className="text-slate-300 text-lg">
          Welcome, <span className="font-medium text-white">{user?.email}</span>
        </p>
        <Button variant="secondary" onClick={signOut}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
