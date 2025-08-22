// pages/Abbonamento.jsx
import React, { useState } from "react";
import Container from "@mui/material/Container";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SubscriptionsPanel from "../components/SubscriptionsPanel";
import Paywall from "../components/Paywall";

const PRIMARY = "#3a51b0";

export default function Abbonamento() {
  const [hasActive, setHasActive] = useState(false);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY, mb: 3 }}>
        Gestione Abbonamento
      </Typography>

      {/* I TUOI ABBONAMENTI */}
      <SubscriptionsPanel onHasActiveChange={setHasActive} />

      {/* PRICING CARD: mostrata solo se NON c’è un abbonamento attivo/trial */}
      {!hasActive && (
        <Card
          sx={{
            mt: 3,
            borderRadius: 3,
            boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: PRIMARY, mb: 1 }}>
              Piano Pro
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 1 }}>
              €20 <span style={{ fontSize: 18, fontWeight: 400 }}>/mese</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Sblocca tutte le funzionalità per gestire al meglio il tuo salone.
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Funzionalità chiave (sintesi) */}
            <Box sx={{ textAlign: "left", m: "0 auto", maxWidth: 420 }}>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                <li>Gestione dipendenti, orari e assenze</li>
                <li>Prenotazioni clienti con conferme/notifiche</li>
                <li>Catalogo servizi con prezzo e durata</li>
                <li>Dashboard con statistiche e grafici</li>
                <li>Area cliente per prenotazioni online</li>
              </ul>
            </Box>

            {/* Bottone checkout (Paywall mantiene la tua logica) */}
            <Box sx={{ mt: 3 }}>
              <Paywall />
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
