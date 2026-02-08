import {useState} from 'react';
import {Navigate, useSearchParams} from 'react-router-dom';
import {Button} from '@play/pylon';
import {useAppContext} from '@/lib/app-context';
import {useAuth} from '@/lib/auth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'sent' | 'verifying' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const {signInWithMagicLink, verifyOtp} = useAuth();
  const {me, isLoading} = useAppContext();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-(--primary) border-t-transparent rounded-full" />
      </div>
    );
  }

  // Redirect to returnTo or home if already authenticated
  if (me) {
    return <Navigate to={returnTo || '/'} replace />;
  }

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('verifying');
    setErrorMessage('');

    const {error} = await verifyOtp(email, otpCode);

    if (error) {
      setStatus('sent'); // Go back to sent state to allow retry
      setErrorMessage(error.message);
    }
    // If successful, the auth state change listener will handle the redirect
  };

  if (status === 'sent' || status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="text-6xl">✉️</div>
          <h1 className="text-2xl font-bold text-white">Check your email</h1>
          <p className="text-gray-200">
            We sent a magic link to{' '}
            <span className="font-medium text-white">{email}</span>
          </p>
          <p className="text-gray-500 text-sm">
            Click the link in the email to sign in, or enter the 6-digit code
            below.
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-4 mt-6">
            <div>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-center text-2xl tracking-widest placeholder:text-gray-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
              />
            </div>

            {errorMessage && (
              <p className="text-(--fg-error) text-sm">{errorMessage}</p>
            )}

            <Button
              type="submit"
              disabled={status === 'verifying' || otpCode.length !== 6}
              style={{width: '100%'}}
            >
              {status === 'verifying' ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          <button
            onClick={() => {
              setStatus('idle');
              setOtpCode('');
              setErrorMessage('');
            }}
            className="text-(--color-primary-400) hover:text-(--color-primary-300) text-sm underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Play.link <span className="text-(--color-primary-400)">Studio</span>
          </h1>
          <p className="text-gray-200">Sign in with your email</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
            />
          </div>

          {status === 'error' && (
            <p className="text-(--fg-error) text-sm">{errorMessage}</p>
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
