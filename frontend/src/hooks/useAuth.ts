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
          const {
            email,
            name,
            loginTime,
            nivel_acesso,
            setores,
            alterar_senha_primeiro_acesso,
            id,
          } = data as AuthRecord & Partial<AuthUser>;
          if (email && name && loginTime)
            return {
              id,
              email,
              name,
              loginTime,
              nivel_acesso,
              setores,
              alterar_senha_primeiro_acesso,
            } as AuthUser;
        }
      } else if (typeof data.loginTime === "number") {
        if (now - data.loginTime < LEGACY_EXPIRY) {
          const {
            email,
            name,
            loginTime,
            nivel_acesso,
            setores,
            alterar_senha_primeiro_acesso,
            id,
          } = data as AuthUser & Partial<AuthRecord>;
          if (email && name && loginTime)
            return {
              id,
              email,
              name,
              loginTime,
              nivel_acesso,
              setores,
              alterar_senha_primeiro_acesso,
            } as AuthUser;
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
          const {
            email,
            name,
            loginTime,
            nivel_acesso,
            setores,
            alterar_senha_primeiro_acesso,
            id,
          } = data as AuthRecord & Partial<AuthUser>;
          if (email && name && loginTime)
            return {
              id,
              email,
              name,
              loginTime,
              nivel_acesso,
              setores,
              alterar_senha_primeiro_acesso,
            } as AuthUser;
        }
      } else if (typeof data.loginTime === "number") {
        if (now - data.loginTime < LEGACY_EXPIRY) {
          const {
            email,
            name,
            loginTime,
            nivel_acesso,
            setores,
            alterar_senha_primeiro_acesso,
            id,
          } = data as AuthUser & Partial<AuthRecord>;
          if (email && name && loginTime)
            return {
              id,
              email,
              name,
              loginTime,
              nivel_acesso,
              setores,
              alterar_senha_primeiro_acesso,
            } as AuthUser;
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

    // Socket.IO connection (shared on window so multiple imports don't recreate)
    let socket: any = (window as any).__APP_SOCK__;
    let mounted = true;
    const setupSocket = async () => {
      if (socket) return socket;
      try {
        const { io } = await import("socket.io-client");
        // Connect socket to same origin (server mounts socket.io at root /socket.io)
        const origin = window.location.origin;
        const path = "/socket.io";
        socket = io(origin, {
          path,
          transports: ["websocket", "polling"],
          autoConnect: true,
        });
        (window as any).__APP_SOCK__ = socket;
        socket.on("connect", () => {
          console.debug("[SIO] connect", socket.id);
          // identify if we have a current user
          const curr = readFromStorage();
          if (curr && curr.id) {
            socket.emit("identify", { user_id: curr.id });
            console.debug("[SIO] identify emitted for user", curr.id);
          }
        });
        socket.on("disconnect", (reason: any) => {
          console.debug("[SIO] disconnect", reason);
        });
        socket.on("connect_error", (err: any) => {
          console.debug("[SIO] connect_error", err);
        });
        socket.on("auth:logout", (data: any) => {
          console.debug("[SIO] auth:logout received", data);
          try {
            const uid = data?.user_id;
            const curr = readFromStorage();
            if (curr && curr.id && uid === curr.id) {
              // force local logout
              setUser(null);
              sessionStorage.removeItem(AUTH_KEY);
              localStorage.removeItem(AUTH_KEY);
              window.dispatchEvent(new CustomEvent("auth:revoked"));

              // As a fallback, redirect immediately to the login page preserving current path
              try {
                const redirect =
                  window.location.pathname + window.location.search;
                window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
              } catch (e) {
                window.location.href = "/login";
              }
            }
          } catch (e) {
            console.error("[SIO] auth:logout handler error", e);
            try {
              window.location.href = "/login";
            } catch {}
          }
        });

        // Server-side permission/profile update for this user
        socket.on("auth:refresh", (data: any) => {
          try {
            const uid = data?.user_id;
            const curr = readFromStorage();
            if (curr && curr.id && uid === curr.id) {
              console.debug("[SIO] auth:refresh for user", uid, "- refreshing permissions");
              // Dispatch the refresh event to trigger permission updates
              window.dispatchEvent(new CustomEvent("auth:refresh"));
            }
          } catch (e) {
            console.debug("[SIO] auth:refresh handler error", e);
          }
        });
      } catch (e) {
        // ignore socket setup errors
      }
      return socket;
    };
    setupSocket();

    const refresh = async () => {
      try {
        if (!mounted) return;
        const current = readFromStorage();
        if (!current || !current.id) return;
        console.debug("[AUTH] Refreshing user data for id", current.id);
        const res = await fetch(`/api/usuarios/${current.id}`);
        if (!res.ok) {
          console.debug("[AUTH] Refresh failed with status", res.status);
          return;
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
          alterar_senha_primeiro_acesso: !!data.alterar_senha_primeiro_acesso,
        };
        const record: AuthRecord = {
          ...base,
          expiresAt: now + REMEMBER_EXPIRY,
        };
        console.debug("[AUTH] Updated user with setores:", base.setores);
        setUser(base);
        try {
          // prefer preserving existing storage choice
          const sessionRaw = sessionStorage.getItem(AUTH_KEY);
          if (sessionRaw)
            sessionStorage.setItem(AUTH_KEY, JSON.stringify(record));
          else localStorage.setItem(AUTH_KEY, JSON.stringify(record));
        } catch {}
        // re-identify socket on refresh
        try {
          const s = (window as any).__APP_SOCK__;
          if (s && s.connected && base.id)
            s.emit("identify", { user_id: base.id });
        } catch (e) {}
      } catch (err) {
        console.debug("[AUTH] Refresh error:", err);
      }
    };
    window.addEventListener("auth:refresh", refresh as EventListener);
    window.addEventListener("users:changed", refresh as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener("auth:refresh", refresh as EventListener);
      window.removeEventListener("users:changed", refresh as EventListener);
      // do not disconnect socket here - keep global alive
    };
  }, []);

  const login = async (
    identifier: string,
    password: string,
    remember = true,
  ) => {
    try {
      const res = await fetch("/api/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, senha: password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}) as any);
        throw new Error(
          (err && (err.detail || err.message)) || "Falha ao autenticar",
        );
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
      // identify socket if present
      try {
        const s = (window as any).__APP_SOCK__;
        if (s && s.connected && base.id)
          s.emit("identify", { user_id: base.id });
      } catch (e) {}
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
