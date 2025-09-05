import { useState, useEffect } from "react";

interface AuthUser {
  id?: number;
  email: string;
  name: string;
  nivel_acesso?: string;
  setores?: string[];
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
          const { email, name, loginTime } = data as AuthRecord;
          if (email && name && loginTime) return { email, name, loginTime };
        }
      } else if (typeof data.loginTime === "number") {
        if (now - data.loginTime < LEGACY_EXPIRY) {
          const { email, name, loginTime } = data as AuthUser;
          if (email && name && loginTime) return { email, name, loginTime };
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
          const { email, name, loginTime } = data as AuthRecord;
          if (email && name && loginTime) return { email, name, loginTime };
        }
      } else if (typeof data.loginTime === "number") {
        if (now - data.loginTime < LEGACY_EXPIRY) {
          const { email, name, loginTime } = data as AuthUser;
          if (email && name && loginTime) return { email, name, loginTime };
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

  const login = (email: string, _password: string, remember = true) => {
    const now = Date.now();
    const base: AuthUser = {
      email,
      name: email.split("@")[0] || "Usuário",
      loginTime: now,
    };

    const record: AuthRecord = {
      ...base,
      expiresAt: now + (remember ? REMEMBER_EXPIRY : SESSION_EXPIRY),
    };

    setUser(base);

    // Persistir conforme "Lembrar-me"
    try {
      const payload = JSON.stringify(record);
      if (remember) {
        sessionStorage.removeItem(AUTH_KEY);
        localStorage.setItem(AUTH_KEY, payload);
      } else {
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.setItem(AUTH_KEY, payload);
      }
    } catch {
      // Em caso de quota/storage cheia, não quebrar o fluxo
    }

    return true;
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
