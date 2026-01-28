import {useEffect, useState} from 'react';
import type {User} from '@play/supabase-client';
import {getSupabaseClient} from '@play/supabase-client';

interface AuthState {
  user: User | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Get initial session
    supabase.auth.getSession().then(({data: {session}}) => {
      setState({
        user: session?.user ?? null,
        loading: false,
      });
    });

    // Listen for auth changes
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const supabase = getSupabaseClient();
    const {error} = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return {error};
  };

  const verifyOtp = async (email: string, token: string) => {
    const supabase = getSupabaseClient();
    const {error} = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return {error};
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  return {
    user: state.user,
    loading: state.loading,
    signInWithMagicLink,
    verifyOtp,
    signOut,
  };
}
