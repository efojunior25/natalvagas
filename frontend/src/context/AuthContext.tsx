import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type AccountRole = 'USER' | 'COMPANY' | 'EDITDEV';
export interface UserProfile { id: string; name: string; email: string; picture?: string; isPro: boolean; role: AccountRole; companyId?: string | null; companyVerified?: boolean; emailVerified?: boolean; createdAt?: string }
interface RegisterInput { accountType?: 'USER' | 'COMPANY'; companyName?: string; cnpj?: string }
interface AuthResult { success: boolean; message?: string; requiresMfa?: boolean; requiresMfaSetup?: boolean; mfaSecret?: string; otpauthUri?: string }
interface AuthContextType { user: UserProfile | null; isAuthenticated: boolean; isLoading: boolean; loginWithGoogle: (credential: string) => Promise<boolean>; loginWithEmail: (email: string, pass: string, mfaCode?: string, setupSecret?: string) => Promise<AuthResult>; resetMfaSecret: (email: string) => void; registerWithEmail: (name: string, email: string, pass: string, input?: RegisterInput) => Promise<AuthResult>; logout: () => Promise<void>; unlockProStatus: () => Promise<void> }
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Compatibilidade temporária: identidade privilegiada nunca é inferida por e-mail no cliente.
export const isDeveloperEmail = (_email?: string | null): boolean => false;
export const verifyProToken = (_token: string | null): boolean => false;
export const USER_STORAGE_KEY = 'natalvagas_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null); const [isLoading, setIsLoading] = useState(true);
  const refreshSession = async () => { try { const res = await fetch('/api/auth/me', { credentials: 'include' }); const data = await res.json().catch(() => ({})); setUser(res.ok && data.success ? data.user : null); } catch { setUser(null); } };
  useEffect(() => { refreshSession().finally(() => setIsLoading(false)); }, []);
  const loginWithEmail = async (email: string, password: string, mfaCode?: string): Promise<AuthResult> => { setIsLoading(true); try { const res = await fetch('/api/auth/login', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, mfaCode }) }); const data = await res.json().catch(() => ({})); if (res.ok && data.success) setUser(data.user); return { success: res.ok && data.success, message: data.message, requiresMfa: Boolean(data.requiresMfa) }; } catch { return { success: false, message: 'Serviço de autenticação indisponível.' }; } finally { setIsLoading(false); } };
  const registerWithEmail = async (name: string, email: string, password: string, input: RegisterInput = {}): Promise<AuthResult> => { setIsLoading(true); try { const res = await fetch('/api/auth/register', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, ...input }) }); const data = await res.json().catch(() => ({})); if (res.ok && data.success) setUser(data.user); return { success: res.ok && data.success, message: data.message }; } catch { return { success: false, message: 'Serviço de cadastro indisponível.' }; } finally { setIsLoading(false); } };
  const logout = async () => { try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } finally { setUser(null); localStorage.removeItem(USER_STORAGE_KEY); sessionStorage.removeItem('natalvagas_admin_mfa_auth'); } };
  const loginWithGoogle = async () => false;
  const resetMfaSecret = () => undefined;
  const unlockProStatus = async () => { await refreshSession(); };
  return <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), isLoading, loginWithGoogle, loginWithEmail, resetMfaSecret, registerWithEmail, logout, unlockProStatus }}>{children}</AuthContext.Provider>;
};
export const useAuth = (): AuthContextType => { const value = useContext(AuthContext); if (!value) throw new Error('useAuth deve ser usado dentro de AuthProvider'); return value; };
