import { useState, useEffect } from "react";

interface AuthUser {
  email: string;
  name: string;
  loginTime: number;
}

const AUTH_KEY = "evoque-fitness-auth";
const AUTH_EXPIRY = 24 * 60 * 60 * 1000; // 24 horas

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há login salvo no localStorage
    const savedAuth = localStorage.getItem(AUTH_KEY);
    if (savedAuth) {
      try {
        const authData: AuthUser = JSON.parse(savedAuth);
        const now = Date.now();

        // Verificar se não expirou (24h)
        if (now - authData.loginTime < AUTH_EXPIRY) {
          setUser(authData);
        } else {
          // Expirou, remover
          localStorage.removeItem(AUTH_KEY);
        }
      } catch (error) {
        // Dados inválidos, remover
        localStorage.removeItem(AUTH_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    // Simular login (sem validação real)
    const authData: AuthUser = {
      email,
      name: email.split("@")[0] || "Usuário",
      loginTime: Date.now(),
    };

    setUser(authData);
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    return true;
  };

  const logout = () => {
    setUser(null);
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
