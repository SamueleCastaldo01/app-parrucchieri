import { useEffect, useState, useMemo } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import ManageBillingButton from "./ManageBillingButton"; // 👈 importa qui

const PRIMARY = "#3a51b0";

// Mappa stato Stripe -> etichetta + colore chip (MUI)
const statusMeta = {
  active:     { label: "Attivo",        color: "primary"  },
  trialing:   { label: "In prova",      color: "success"  },
  past_due:   { label: "Scaduto (pag.)",color: "warning"  },
  unpaid:     { label: "Non pagato",    color: "error"    },
  canceled:   { label: "Disattivato",   color: "default"  },
  incomplete: { label: "Incompleto",    color: "default"  },
  incomplete_expired: { label: "Scaduto", color: "default" },
};

function formatDate(tsSec) {
  if (!tsSec) return "—";
  try {
    return new Date(tsSec * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

export default function SubscriptionsPanel({ onHasActiveChange }) {
  const [subs, setSubs] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) { setErr("Non sei loggato."); return; }
    const db = getFirestore();
    const q = query(
      collection(db, "customers", user.uid, "subscriptions"),
      orderBy("created", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setSubs(arr);
    }, (e) => setErr(e.message));
    return () => unsub();
  }, []);

  // c'è un abbonamento "attivo" o "trialing"?
  const hasActive = useMemo(() => {
    if (!subs || !Array.isArray(subs)) return false;
    return subs.some(s => s.status === "active" || s.status === "trialing");
  }, [subs]);

  // notifica al parent (Abbonamento.jsx) per mostrare/nascondere Paywall
  useEffect(() => {
    if (typeof onHasActiveChange === "function") onHasActiveChange(hasActive);
  }, [hasActive, onHasActiveChange]);

  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: 3,
        boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
    >
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY, mb: 1 }}>
          I tuoi abbonamenti
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Qui trovi lo stato e il rinnovo dei tuoi piani.
        </Typography>

        {err && (
          <Typography variant="body2" color="error" sx={{ my: 2 }}>
            Errore: {err}
          </Typography>
        )}

        {!subs && !err && (
          <Typography variant="body2">Carico abbonamenti…</Typography>
        )}

        {subs && subs.length === 0 && (
          <Typography variant="body2">Nessun abbonamento trovato.</Typography>
        )}

        {subs && subs.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            {subs.map((s) => {
              const meta = statusMeta[s.status] || { label: s.status, color: "default" };
              const nickname = s.items && s.items[0]?.price?.nickname;
              const periodEnd = formatDate(s.current_period_end);
              const created = formatDate(s.created);
              const cancelAt = s.cancel_at ? formatDate(s.cancel_at) : null;
              const cancelAtPeriodEnd = s.cancel_at_period_end;

              return (
                <Box
                  key={s.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid #eef0f6",
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box sx={{ flexGrow: 1, minWidth: 220 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {nickname || "Piano"} {s.metadata?.plan_name ? `— ${s.metadata.plan_name}` : ""}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Creato: {created} • Rinnovo: {periodEnd}
                      {cancelAtPeriodEnd && " • Annullato a fine periodo"}
                      {cancelAt && ` • Annulla il: ${cancelAt}`}
                    </Typography>
                  </Box>

                  {/* Stato + bottone affiancati */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={meta.label}
                      color={meta.color}
                      variant={meta.color === "default" ? "outlined" : "filled"}
                      sx={{ fontWeight: 700 }}
                    />
                    <ManageBillingButton /> {/* 👈 bottone gestisci */}
                  </Box>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
      <Divider />
    </Card>
  );
}
