import React, { createContext, useContext, useMemo, useState } from 'react';

type LoginProvider = 'google' | 'email';

type AuthContextValue = {
  isAuthenticated: boolean;
  loginMethod: LoginProvider | null;
  login: (provider: LoginProvider) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginProvider | null>(null);

  const login = (provider: LoginProvider) => {
    setLoginMethod(provider);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setLoginMethod(null);
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ isAuthenticated, loginMethod, login, logout }),
    [isAuthenticated, loginMethod],
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
