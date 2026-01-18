import {useState} from 'react';
import {Button} from '@play/pylon';
import {useAuth} from '@/lib/auth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState('');
  const {signInWithMagicLink} = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    const {error} = await signInWithMagicLink(email);

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('sent');
    }
  };

  if (status === 'sent') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="text-6xl">✉️</div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-slate-300">
            We sent a magic link to{' '}
            <span className="font-medium text-white">{email}</span>
          </p>
          <p className="text-slate-400 text-sm">
            Click the link in the email to sign in.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="text-purple-400 hover:text-purple-300 text-sm underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Play.link <span className="text-purple-400">Studio</span>
          </h1>
          <p className="text-slate-300">Sign in with your email</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm">{errorMessage}</p>
          )}

          <Button
            type="submit"
            disabled={status === 'loading'}
            style={{width: '100%'}}
          >
            {status === 'loading' ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>
      </div>
    </div>
  );
}
