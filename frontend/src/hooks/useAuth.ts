import { useState, useEffect } from "react";

interface AuthUser {
  id?: number;
  email: string;
  name: string;
  nivel_acesso?: string;
  setores?: string[];
  alterar_senha_primeiro_acesso?: boolean;
  loginTime: number;
}

interface AuthRecord extends AuthUser {
  expiresAt: number;
}

const AUTH_KEY = "evoque-fitness-auth";
const REMEMBER_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 dias
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas (fallback de segurança)

function readFromStorage(): AuthUser | null {
  const now = Date.now();
  const LEGACY_EXPIRY = 24 * 60 * 60 * 1000; // compat 24h

  // 1) Preferir sessão atual (sessionStorage)
  const sessionRaw = sessionStorage.getItem(AUTH_KEY);
  if (sessionRaw) {
    try {
      const data = JSON.parse(sessionRaw) as Partial<AuthRecord & AuthUser>;
      if (typeof (data as AuthRecord).expiresAt === "number") {
        if (now < (data as AuthRecord).expiresAt) {
          const { email, name, loginTime, nivel_acesso, setores, alterar_senha_primeiro_acesso, id } = data as AuthRecord & Partial<AuthUser>;
          if (email && name && loginTime) return { id, email, name, loginTime, nivel_acesso, setores, alterar_senha_primeiro_acesso } as AuthUser;
        }
      } else if (typeof data.loginTime === "number") {
        if (now - data.loginTime < LEGACY_EXPIRY) {
          const { email, name, loginTime, nivel_acesso, setores, alterar_senha_primeiro_acesso, id } = data as AuthUser & Partial<AuthRecord>;
          if (email && name && loginTime) return { id, email, name, loginTime, nivel_acesso, setores, alterar_senha_primeiro_acesso } as AuthUser;
        }
      }
      sessionStorage.removeItem(AUTH_KEY);
    } catch {
      sessionStorage.removeItem(AUTH_KEY);
    }
  }

  // 2) Senão, usar persistência (localStorage)
  const localRaw = localStorage.getItem(AUTH_KEY);
  if (localRaw) {
    try {
      const data = JSON.parse(localRaw) as Partial<AuthRecord & AuthUser>;
      if (typeof (data as AuthRecord).expiresAt === "number") {
        if (now < (data as AuthRecord).expiresAt) {
          const { email, name, loginTime, nivel_acesso, setores, alterar_senha_primeiro_acesso, id } = data as AuthRecord & Partial<AuthUser>;
          if (email && name && loginTime) return { id, email, name, loginTime, nivel_acesso, setores, alterar_senha_primeiro_acesso } as AuthUser;
        }
      } else if (typeof data.loginTime === "number") {
        if (now - data.loginTime < LEGACY_EXPIRY) {
          const { email, name, loginTime, nivel_acesso, setores, alterar_senha_primeiro_acesso, id } = data as AuthUser & Partial<AuthRecord>;
          if (email && name && loginTime) return { id, email, name, loginTime, nivel_acesso, setores, alterar_senha_primeiro_acesso } as AuthUser;
        }
      }
      localStorage.removeItem(AUTH_KEY);
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
  }

  return null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existing = readFromStorage();
    if (existing) setUser(existing);
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string, remember = true) => {
    try {
      const res = await fetch('/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, senha: password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        throw new Error((err && (err.detail || err.message)) || 'Falha ao autenticar');
      }
      const data = await res.json();
      const now = Date.now();
      const base: AuthUser = {
        id: data.id,
        email: data.email,
        name: `${data.nome} ${data.sobrenome}`,
        nivel_acesso: data.nivel_acesso,
        setores: Array.isArray(data.setores) ? data.setores : [],
        loginTime: now,
        // include flag
        alterar_senha_primeiro_acesso: !!data.alterar_senha_primeiro_acesso,
      };
      const record: AuthRecord = {
        ...base,
        expiresAt: now + (remember ? REMEMBER_EXPIRY : SESSION_EXPIRY),
      };
      setUser(base);
      try {
        const payload = JSON.stringify(record);
        if (remember) {
          sessionStorage.removeItem(AUTH_KEY);
          localStorage.setItem(AUTH_KEY, payload);
        } else {
          localStorage.removeItem(AUTH_KEY);
          sessionStorage.setItem(AUTH_KEY, payload);
        }
      } catch {}
      // return full server data for immediate decisions
      return data;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(AUTH_KEY);
  };

  const isAuthenticated = !!user;

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
