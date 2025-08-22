// components/PrivatePerm.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useRole } from "../hooks/useRole";
import { useActiveSubscription } from "../hooks/useActiveSubscription";

export default function PrivatePerm() {
  const { loading: lRole, role } = useRole();
  const { loading: lSub, active } = useActiveSubscription();

  if (lRole || lSub) return <div style={{padding:24}}>Verifica permessi…</div>;

  // Utenti normali passano sempre
  if (role !== "supervisor") return <Outlet />;

  // Supervisor senza abbonamento: manda alla pagina abbonamento
  if (!active) return <Navigate to="/abbonamento" replace />;

  // Supervisor abbonato: ok
  return <Outlet />;
}
