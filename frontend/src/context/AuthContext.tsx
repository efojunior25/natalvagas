import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  isPro: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  unlockProStatus: (token?: string, plan?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'natalvagas_auth_user';
const TOKEN_STORAGE_KEY = 'natalvagas_auth_token';
export const PRO_TOKEN_KEY = 'natalvagas_pro_token';

export interface ProTokenPayload {
  status: string;
  plan: string;
  expiresAt: number;
  txid?: string;
  code?: string;
}

export const verifyProToken = (tokenStr: string | null): boolean => {
  if (!tokenStr) return false;
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 2) return false;
    const [b64, signature] = parts;
    let hash = 0;
    for (let i = 0; i < b64.length; i++) {
      hash = ((hash << 5) - hash) + b64.charCodeAt(i);
      hash |= 0;
    }
    const expectedSig = Math.abs(hash).toString(36);
    if (signature !== expectedSig) return false;

    const payload: ProTokenPayload = JSON.parse(atob(b64));
    if (payload.status !== 'approved') return false;
    if (payload.expiresAt && payload.expiresAt < Date.now()) {
      return false; // Token expirado
    }
    return true;
  } catch (e) {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializa a sessão a partir do armazenamento local
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      const isProUnlocked = verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.isPro = isProUnlocked;
        setUser(parsed);
      }
    } catch (e) {
      console.error('Erro ao restaurar sessão:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login simulado ou integrado com Google Credential
  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Decodifica payload JWT do Google (sem biblioteca externa pesada)
      let name = 'Usuário Google';
      let email = 'usuario@gmail.com';
      let picture = '';

      if (credential) {
        try {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            name = payload.name || name;
            email = payload.email || email;
            picture = payload.picture || '';
          }
        } catch (jwtErr) {
          console.warn('Utilizando dados padrão de credencial.');
        }
      }

      const isProUnlocked = verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));

      const newUser: UserProfile = {
        id: `google_${Date.now()}`,
        name,
        email,
        picture,
        isPro: isProUnlocked,
        createdAt: new Date().toISOString()
      };

      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, credential || 'mock_token');
      return true;
    } catch (err) {
      console.error('Erro no login com Google:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, _pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const isProUnlocked = verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
      const name = email.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

      const loggedUser: UserProfile = {
        id: `user_${Date.now()}`,
        name: formattedName,
        email,
        isPro: isProUnlocked,
        createdAt: new Date().toISOString()
      };

      setUser(loggedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (name: string, email: string, _pass: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const isProUnlocked = verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        name,
        email,
        isPro: isProUnlocked,
        createdAt: new Date().toISOString()
      };

      setUser(newUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const unlockProStatus = (token?: string, plan: string = 'monthly') => {
    let finalToken = token;
    if (!finalToken) {
      const expiresDays = plan === 'lifetime' ? 3650 : plan === 'annual' ? 365 : 30;
      const payload = {
        status: 'approved',
        plan,
        issuedAt: Date.now(),
        expiresAt: Date.now() + expiresDays * 24 * 60 * 60 * 1000
      };
      const b64 = btoa(JSON.stringify(payload));
      let hash = 0;
      for (let i = 0; i < b64.length; i++) {
        hash = ((hash << 5) - hash) + b64.charCodeAt(i);
        hash |= 0;
      }
      finalToken = `${b64}.${Math.abs(hash).toString(36)}`;
    }

    localStorage.setItem(PRO_TOKEN_KEY, finalToken);
    localStorage.removeItem('natalvagas_resume_pro_unlocked');
    setUser(prev => prev ? { ...prev, isPro: true } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        unlockProStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
