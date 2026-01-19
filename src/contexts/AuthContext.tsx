import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type LoginProvider = 'google' | 'email';

type AuthContextValue = {
  isAuthenticated: boolean;
  loginMethod: LoginProvider | null;
  isLoading: boolean;
  authError: string | null;
  session: Session | null;
  user: User | null;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getLoginMethod = (session: Session | null): LoginProvider | null => {
  const provider = session?.user?.app_metadata?.provider;
  if (provider === 'google') {
    return 'google';
  }
  if (provider === 'email') {
    return 'email';
  }
  return session ? 'email' : null;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loginMethod, setLoginMethod] = useState<LoginProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoginMethod(getLoginMethod(data.session));
        setIsLoading(false);
      })
      .catch((error: Error) => {
        if (!isMounted) {
          return;
        }
        setAuthError(error.message);
        setIsLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) {
        return;
      }
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoginMethod(getLoginMethod(newSession));
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const clearError = () => setAuthError(null);

  const loginWithGoogle = async () => {
    clearError();
    setIsLoading(true);
    const redirectTo = Linking.createURL('auth/callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
      return false;
    }

    if (data?.url) {
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type === 'success' && result.url) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url);
        if (exchangeError) {
          setAuthError(exchangeError.message);
          setIsLoading(false);
          return false;
        }
      }
    }

    setIsLoading(false);
    return true;
  };

  const loginWithEmail = async (email: string) => {
    clearError();
    setIsLoading(true);
    const redirectTo = Linking.createURL('auth/callback');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      setAuthError(error.message);
      setIsLoading(false);
      return false;
    }

    setIsLoading(false);
    return true;
  };

  const logout = async () => {
    clearError();
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
    setIsLoading(false);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session),
      loginMethod,
      isLoading,
      authError,
      session,
      user,
      loginWithGoogle,
      loginWithEmail,
      logout,
      clearError,
    }),
    [session, loginMethod, isLoading, authError, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
