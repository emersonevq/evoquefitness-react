import { Navigate, useLocation } from "react-router-dom";

export default function RequireLogin({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  // Allow when navigation explicitly bypasses the guard (from Login submit)
  // Otherwise redirect to login with intended URL as redirect param
  // No real auth persisted – always require login before entering a sector
  // This keeps behavior simple and predictable per request.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state = location.state as any;
  if (state?.bypassGate) return <>{children}</>;
  const redirect = `${location.pathname}${location.search}`;
  return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
}
