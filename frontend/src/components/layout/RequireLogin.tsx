import { useLocation, Navigate } from "react-router-dom";

export default function RequireLogin({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  // Allow when navigation explicitly bypasses the guard (from Login submit)
  // Otherwise redirect to login with intended URL as redirect param
  // No real auth persisted – always require login before entering a sector
  // This keeps behavior simple and predictable per request.
  const bypassGate = location.state?.bypassGate;
  if (bypassGate) {
    return <>{children}</>;
  }
  const redirect = location.pathname + location.search;
  return (
    <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />
  );
}
