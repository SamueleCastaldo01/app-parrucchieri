// pages/Homepage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import SettingsIcon from "@mui/icons-material/Settings";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ManageBillingButton from "../components/ManageBillingButton";
import Paywall from "../components/Paywall";
import SubscriptionBanner from "../components/SubscriptionBanner";
import { useSubscriptionStatus } from "../hooks/useSubscriptionStatus";
import { useCollectionCount, useTodayBookingsCount } from "../hooks/useCounts";

const PRIMARY = "#3a51b0";

function StatCard({ title, value, icon }) {
  const display = typeof value === "number" ? value : value || "—";
  return (
    <Card sx={{ borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
      <CardContent>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(58,81,176,0.1)", display: "grid", placeItems: "center" }}>
            {icon}
          </div>
          <div>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{display}</Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const sub = useSubscriptionStatus();

  const todayBookings = useTodayBookingsCount("date");
  const services = useCollectionCount("service");
  const employees = useCollectionCount("employee");
  const customers = useCollectionCount("customers");

  // Loading stato abbonamento
  if (sub.loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">Caricamento…</Typography>
      </Container>
    );
  }

  // SE NON c'è abbonamento attivo → mostra solo Paywall/stato
  if (!sub.active) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>Abbonamento richiesto</Typography>
          <ManageBillingButton />
        </div>

        <SubscriptionBanner
          status={sub.status}
          cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
          daysLeft={sub.daysLeft}
          currentPeriodEndMs={sub.currentPeriodEndMs}
          primary={PRIMARY}
        />

        <Card sx={{ borderRadius: 3, border: "1px solid #eef0f6" }}>
          <CardContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Per sbloccare la dashboard del negozio attiva un piano. Solo il supervisore paga; l’intero team è incluso.
            </Typography>
            <Paywall />
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Se ARRIVI QUI, abbonamento attivo → dashboard
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>Dashboard App Parrucchieri</Typography>
        </div>

        {/* Banner stato (annullato a fine periodo o vicino scadenza) */}
        <SubscriptionBanner
          status={sub.status}
          cancelAtPeriodEnd={sub.cancelAtPeriodEnd}
          daysLeft={sub.daysLeft}
          currentPeriodEndMs={sub.currentPeriodEndMs}
          primary={PRIMARY}
        />

        {/* Stat veloci (placeholder: sostituisci con i tuoi numeri reali) */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Prenotazioni oggi"
              value={todayBookings.loading ? "…" : todayBookings.error ? "—" : todayBookings.value}
              icon={<EventAvailableIcon htmlColor={PRIMARY} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Clienti"
              value={customers.loading ? "…" : customers.error ? "—" : customers.value}
              icon={<Diversity3Icon htmlColor={PRIMARY} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Servizi"
              value={services.loading ? "…" : services.error ? "—" : services.value}
              icon={<ContentCutIcon htmlColor={PRIMARY} />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Dipendenti"
              value={employees.loading ? "…" : employees.error ? "—" : employees.value}
              icon={<SettingsIcon htmlColor={PRIMARY} />}
            />
          </Grid>
        </Grid>

        {/* CTA principali */}
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth startIcon={<SettingsIcon />} sx={{ py: 2, borderRadius: 2, bgcolor: PRIMARY, "&:hover": { bgcolor: "#2f4098" } }} variant="contained" onClick={() => navigate("/configstore")}>Store</Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth startIcon={<ContentCutIcon />} sx={{ py: 2, borderRadius: 2 }} variant="outlined" onClick={() => navigate("/servizilist")}>Servizi</Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth startIcon={<Diversity3Icon />} sx={{ py: 2, borderRadius: 2 }} variant="outlined" onClick={() => navigate("/employeelist")}>Dipendenti</Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button fullWidth startIcon={<EventAvailableIcon />} sx={{ py: 2, borderRadius: 2 }} variant="outlined" onClick={() => navigate("/bookingsreview")}>Prenotazioni</Button>
          </Grid>
        </Grid>
      </Container>
    </motion.div>
  );
}
