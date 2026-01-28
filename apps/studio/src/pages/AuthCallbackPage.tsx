import {useEffect} from 'react';
import {useNavigate} from 'react-router';
import {getSupabaseClient} from '@play/supabase-client';

export function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Handle the magic link callback
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate('/', {replace: true});
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-[var(--primary-active)] to-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto" />
        <p className="text-white">Signing you in...</p>
      </div>
    </div>
  );
}
