import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateTotpSecret, generateOtpAuthUri, verifyTotpCode } from '../services/totpService';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture?: string;
  isPro: boolean;
  isAdmin?: boolean;
  role?: 'USER' | 'ADMIN';
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  loginWithEmail: (email: string, pass: string, mfaCode?: string, setupSecret?: string) => Promise<{ 
    success: boolean; 
    requiresMfa?: boolean; 
    requiresMfaSetup?: boolean;
    mfaSecret?: string;
    otpauthUri?: string;
    message?: string 
  }>;
  resetMfaSecret: (email: string) => void;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  unlockProStatus: (token?: string, plan?: string) => Promise<void> | void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const USER_STORAGE_KEY = 'natalvagas_auth_user';
export const TOKEN_STORAGE_KEY = 'natalvagas_auth_token';
export const PRO_TOKEN_KEY = 'natalvagas_pro_token';

export const isDeveloperEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean.endsWith('@natalvagas.com.br') ||
    clean === 'efojunior25@gmail.com' ||
    clean === 'natalvagas.edson@gmail.com' ||
    clean === 'edson' ||
    clean === 'admin'
  );
};

export const MASTER_PASSWORDS = [
  'edson2026',
  'admin2026',
  'potiguar2026',
  'natalvagas2026',
  'edson',
  'natalvagas',
  'natalvagas-pro-auth-secret-potiguar-2026'
];

export interface ProTokenPayload {
  status: string;
  plan: string;
  expiresAt: number;
  txid?: string;
  code?: string;
}

export const b64Encode = (obj: any): string => {
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)));
};

export const b64Decode = <T = any>(str: string): T => {
  const decoded = decodeURIComponent(escape(atob(str)));
  return JSON.parse(decoded);
};

export const verifyProToken = (tokenStr: string | null): boolean => {
  if (!tokenStr) return false;
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 2) return false;
    const [b64, signature] = parts;
    if (!b64 || !signature) return false;

    // Decodifica payload seguro com UTF-8
    const payload: ProTokenPayload = b64Decode(b64);
    if (payload.status !== 'approved') return false;
    if (payload.expiresAt && payload.expiresAt < Date.now()) {
      return false; // Token expirado
    }

    // Assinatura deve ser uma hash HMAC-SHA256 hex válida (64 caracteres)
    const isHmacHex = /^[a-f0-9]{64}$/i.test(signature);
    if (!isHmacHex) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializa a sessão a partir da nuvem ou do armazenamento local
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.user) {
                const isProUnlocked = data.user.isPro || verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
                const userObj: UserProfile = { ...data.user, isPro: isProUnlocked };
                setUser(userObj);
                localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userObj));
                return;
              }
            }
          } catch (apiErr) {
            console.warn('Falha ao sincronizar com /api/auth/me, usando cache local:', apiErr);
          }
        }

        const stored = localStorage.getItem(USER_STORAGE_KEY);
        const isProUnlocked = verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.isPro = isProUnlocked || Boolean(parsed.isPro);
          if (isDeveloperEmail(parsed.email)) {
            // SÓ ativa o Modo Administrador se o MFA foi validado nesta sessão via sessionStorage
            const isMfaActiveInSession = sessionStorage.getItem('natalvagas_admin_mfa_auth') === 'true';
            parsed.isAdmin = isMfaActiveInSession;
            parsed.role = isMfaActiveInSession ? 'ADMIN' : 'USER';
          }
          setUser(parsed);
        }
      } catch (e) {
        console.error('Erro ao restaurar sessão:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
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

      const isDev = isDeveloperEmail(email);
      const isProUnlocked = isDev || verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));

      // Modo administrador NUNCA pode ser ativado sem MFA
      const newUser: UserProfile = {
        id: `google_${Date.now()}`,
        name: name,
        email,
        picture,
        isPro: isProUnlocked,
        isAdmin: false,
        role: 'USER',
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

  const resetMfaSecret = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    localStorage.removeItem(`natalvagas_mfa_secret_${cleanEmail}`);
    localStorage.removeItem('natalvagas_admin_mfa_enabled');
    sessionStorage.removeItem('natalvagas_admin_mfa_auth');
    sessionStorage.removeItem('natalvagas_admin_email');
  };

  const loginWithEmail = async (email: string, pass: string, mfaCode?: string, setupSecret?: string): Promise<{ 
    success: boolean; 
    requiresMfa?: boolean; 
    requiresMfaSetup?: boolean;
    mfaSecret?: string;
    otpauthUri?: string;
    message?: string 
  }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Se for e-mail de Desenvolvedor da Página
    if (isDeveloperEmail(cleanEmail)) {
      const isPasswordValid = MASTER_PASSWORDS.includes(cleanPass.toLowerCase());
      if (!isPasswordValid) {
        setIsLoading(false);
        return { success: false, message: 'Senha de administrador inválida.' };
      }

      const secretStorageKey = `natalvagas_mfa_secret_${cleanEmail}`;
      const storedSecret = localStorage.getItem(secretStorageKey);

      // CASO 1: PRIMEIRO ACESSO - O MFA DEVE SER CONFIGURADO COM APLICATIVO AUTENTICADOR!
      if (!storedSecret) {
        const secretToUse = setupSecret || generateTotpSecret();
        const uri = generateOtpAuthUri(cleanEmail, secretToUse);

        // Se o usuário ainda não enviou o código de 6 dígitos gerado pelo aplicativo
        if (!mfaCode) {
          setIsLoading(false);
          return { 
            success: false, 
            requiresMfaSetup: true,
            mfaSecret: secretToUse,
            otpauthUri: uri,
            message: 'Primeiro acesso: configure seu aplicativo autenticador (Google Authenticator ou Authy).' 
          };
        }

        // Validação estrita do código TOTP com o secret novo gerado
        const isSetupValid = await verifyTotpCode(mfaCode, secretToUse);
        if (!isSetupValid) {
          setIsLoading(false);
          return { 
            success: false, 
            requiresMfaSetup: true,
            mfaSecret: secretToUse,
            otpauthUri: uri,
            message: 'Código de confirmação incorreto. Abra o aplicativo autenticador e digite o código atual de 6 dígitos.' 
          };
        }

        // Pareamento confirmado com sucesso: salva a chave no dispositivo
        localStorage.setItem(secretStorageKey, secretToUse);
        localStorage.setItem('natalvagas_admin_mfa_enabled', 'true');
      } 
      // CASO 2: LOGINS SUBSEQUENTES - MFA JÁ CONFIGURADO
      else {
        // Se ainda não forneceu o código MFA de 6 dígitos
        if (!mfaCode) {
          setIsLoading(false);
          return { 
            success: false, 
            requiresMfa: true, 
            message: 'Digite o código de 6 dígitos gerado no seu aplicativo autenticador (Google Authenticator / Authy).' 
          };
        }

        // Validação estrita do código TOTP com a chave salva
        const isCodeValid = await verifyTotpCode(mfaCode, storedSecret);
        if (!isCodeValid) {
          setIsLoading(false);
          return { 
            success: false, 
            requiresMfa: true, 
            message: 'Código MFA incorreto ou expirado. Verifique o código atual no seu aplicativo e tente novamente.' 
          };
        }
      }

      // SÓ LIBERA O MODO ADMINISTRADOR APÓS MFA VALIDADO
      const name = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
      const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
      const adminUser: UserProfile = {
        id: `dev_${Date.now()}`,
        name: `${formattedName} (Dev/Admin)`,
        email: cleanEmail,
        isPro: true,
        isAdmin: true,
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      };

      setUser(adminUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
      sessionStorage.setItem('natalvagas_admin_mfa_auth', 'true');
      sessionStorage.setItem('natalvagas_admin_email', cleanEmail);
      setIsLoading(false);
      return { success: true, message: 'Autenticação em 2 etapas confirmada com sucesso! Modo Administrador ativado.' };
    }

    // Fluxo padrão para usuários comuns
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        const isProUnlocked = data.user.isPro || verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
        const loggedUser: UserProfile = { ...data.user, isPro: isProUnlocked };
        setUser(loggedUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(loggedUser));
        if (data.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        }
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || 'E-mail ou senha incorretos.' };
    } catch (err) {
      return { success: false, message: 'Erro ao autenticar. Verifique seus dados.' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isDeveloperEmail(cleanEmail)) {
      setIsLoading(false);
      return { 
        success: false, 
        message: 'Contas de administrador/desenvolvedor não podem ser criadas via cadastro público. Acesse pela tela de login.' 
      };
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        const isProUnlocked = verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
        const newUser: UserProfile = { ...data.user, isPro: isProUnlocked };
        setUser(newUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        if (data.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        }
        return { success: true, message: data.message };
      }

      if (!res.ok && res.status !== 400 && res.status !== 409) {
        const isProUnlocked = verifyProToken(localStorage.getItem(PRO_TOKEN_KEY));
        const fallbackUser: UserProfile = {
          id: `user_${Date.now()}`,
          name,
          email,
          isPro: isProUnlocked,
          createdAt: new Date().toISOString()
        };
        setUser(fallbackUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fallbackUser));
        return { success: true };
      }

      return { success: false, message: data.message || 'Erro ao criar conta. Tente outro e-mail.' };
    } catch (err) {
      return { success: false, message: 'Erro de conexão ao criar conta. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    try {
      sessionStorage.removeItem('natalvagas_admin_mfa_auth');
      sessionStorage.removeItem('natalvagas_admin_email');
    } catch {}
  };

  const unlockProStatus = async (token?: string, plan: string = 'monthly') => {
    let finalToken = token;

    // Se nenhum token for passado, solicita token oficial assinado pela Edge Function
    if (!finalToken) {
      try {
        const res = await fetch('/api/auth/sign-pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan,
            email: user?.email || undefined
          })
        });
        if (res.ok) {
          const data = await res.json();
          finalToken = data.token;
        }
      } catch (err) {
        console.warn('Falha ao obter token assinado do servidor:', err);
      }
    }

    if (finalToken && verifyProToken(finalToken)) {
      localStorage.setItem(PRO_TOKEN_KEY, finalToken);
      localStorage.removeItem('natalvagas_resume_pro_unlocked');
      setUser(prev => prev ? { ...prev, isPro: true } : null);
    } else {
      console.error('Token PRO inválido ou rejeitado na verificação de integridade');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        resetMfaSecret,
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
