// components/SubscriptionBanner.jsx
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

export default function SubscriptionBanner({ status, cancelAtPeriodEnd, daysLeft, currentPeriodEndMs, primary="#3a51b0" }) {
  if (!status) return null;

  const endStr = currentPeriodEndMs ? new Date(currentPeriodEndMs).toLocaleDateString() : null;

  // trial/active ma annullato a fine periodo
  if (cancelAtPeriodEnd && endStr) {
    return (
      <Stack sx={{ mb: 2 }}>
        <Alert severity="warning" sx={{ borderLeft: `4px solid ${primary}` }}>
          Hai annullato l’abbonamento. Rimane attivo fino al <b>{endStr}</b> ({daysLeft} giorni rimasti).
        </Alert>
      </Stack>
    );
  }

  // trial/active vicino alla scadenza (<= 5 giorni)
  if ((status === "active" || status === "trialing") && typeof daysLeft === "number" && daysLeft <= 5 && endStr) {
    return (
      <Stack sx={{ mb: 2 }}>
        <Alert severity="info" sx={{ borderLeft: `4px solid ${primary}` }}>
          Il tuo abbonamento scadrà il <b>{endStr}</b> (mancano {daysLeft} giorni). Puoi rinnovare o aggiornare dal Portale.
        </Alert>
      </Stack>
    );
  }

  return null;
}
