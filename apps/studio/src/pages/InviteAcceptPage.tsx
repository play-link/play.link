import {useEffect, useState} from 'react';
import {Navigate, useNavigate, useParams} from 'react-router-dom';
import {Avatar, Button, Card, Loading} from '@play/pylon';
import {useAppContext} from '@/lib/app-context';
import {useAuth} from '@/lib/auth';
import {trpc} from '@/lib/trpc';

type InviteStatus =
  | 'loading'
  | 'valid'
  | 'invalid'
  | 'expired'
  | 'accepted'
  | 'email_mismatch';

interface StudioInfo {
  id: string;
  slug: string;
  name: string;
  avatar_url: string | null;
}

export function InviteAcceptPage() {
  const {token} = useParams<{token: string}>();
  const navigate = useNavigate();
  const {me, isLoading: authLoading} = useAppContext();
  const {signOut} = useAuth();
  const [status, setStatus] = useState<InviteStatus>('loading');

  // Fetch invite details
  const {
    data: invite,
    isLoading: inviteLoading,
    error,
  } = trpc.invite.getByToken.useQuery(
    {token: token!},
    {enabled: !!token && !!me},
  );

  // Extract studio from the invite (Supabase returns it as an array from join)
  const studio: StudioInfo | null = invite?.studios
    ? Array.isArray(invite.studios)
      ? invite.studios[0]
      : invite.studios
    : null;

  // Accept mutation
  const acceptInvite = trpc.invite.accept.useMutation({
    onSuccess: () => {
      setStatus('accepted');
      // Redirect to studio after short delay
      setTimeout(() => {
        navigate(`/${studio?.slug || ''}`, {replace: true});
      }, 2000);
    },
    onError: (err) => {
      if (err.message.includes('expired')) {
        setStatus('expired');
      } else if (err.message.includes('different email')) {
        setStatus('email_mismatch');
      } else {
        setStatus('invalid');
      }
    },
  });

  useEffect(() => {
    if (error) {
      setStatus('invalid');
    } else if (invite) {
      if (invite.accepted_at) {
        setStatus('accepted');
      } else {
        setStatus('valid');
      }
    }
  }, [invite, error]);

  // If not logged in, redirect to login with return URL
  if (!authLoading && !me) {
    const returnUrl = encodeURIComponent(`/invite/${token}`);
    return <Navigate to={`/login?returnTo=${returnUrl}`} replace />;
  }

  if (authLoading || inviteLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  const handleAccept = () => {
    if (token) {
      acceptInvite.mutate({token});
    }
  };

  // Render different states
  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-400 mb-6">
            This invitation link is invalid or has been revoked.
          </p>
          <Button onClick={() => navigate('/')} variant="primary">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Invitation Expired
          </h1>
          <p className="text-gray-400 mb-6">
            This invitation has expired. Please ask for a new invitation.
          </p>
          <Button onClick={() => navigate('/')} variant="primary">
            Go to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (status === 'email_mismatch') {
    const handleSignOut = async () => {
      await signOut();
      // After sign out, the page will redirect to login with returnTo
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-white mb-2">Email Mismatch</h1>
          <p className="text-gray-400 mb-4">
            This invitation was sent to{' '}
            <strong className="text-white">{invite?.email}</strong>
          </p>
          <p className="text-gray-400 mb-6">
            You're signed in as{' '}
            <strong className="text-white">{me?.email}</strong>
          </p>
          <div className="space-y-3">
            <Button
              onClick={handleSignOut}
              variant="primary"
              style={{width: '100%'}}
            >
              Sign out and use correct email
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              style={{width: '100%'}}
            >
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (status === 'accepted') {
    // If invite was already accepted before (not just now), show button to go to studio
    const wasAlreadyAccepted = invite?.accepted_at && !acceptInvite.isSuccess;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {wasAlreadyAccepted ? 'Already a member!' : 'Welcome to the team!'}
          </h1>
          <p className="text-gray-400 mb-6">
            {wasAlreadyAccepted
              ? `You're already a member of `
              : `You've joined `}
            <strong className="text-white">{studio?.name}</strong>
          </p>
          {wasAlreadyAccepted ? (
            <Button
              onClick={() => navigate(`/${studio?.slug || ''}`)}
              variant="primary"
              style={{width: '100%'}}
            >
              Go to Studio
            </Button>
          ) : (
            <p className="text-gray-500 text-sm">
              Redirecting you to the studio...
            </p>
          )}
        </Card>
      </div>
    );
  }

  // Valid invite - show accept UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-(--color-primary-700) to-gray-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8">
        <Avatar
          text={studio?.name || 'Studio'}
          src={studio?.avatar_url ?? undefined}
          size="lg"
          className="mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-white mb-2">
          Join {studio?.name}
        </h1>
        <p className="text-gray-400 mb-6">
          You've been invited to join as a{' '}
          <strong className="text-white">{invite?.role?.toLowerCase()}</strong>
        </p>
        <div className="space-y-3">
          <Button
            onClick={handleAccept}
            variant="primary"
            disabled={acceptInvite.isPending}
            style={{width: '100%'}}
          >
            {acceptInvite.isPending ? 'Accepting...' : 'Accept Invitation'}
          </Button>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            style={{width: '100%'}}
          >
            Decline
          </Button>
        </div>
      </Card>
    </div>
  );
}
