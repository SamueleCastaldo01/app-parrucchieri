import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  Avatar,
  useTheme,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase-config";
import { useNavigate } from "react-router-dom";

/**
 * UserHome – Mobile-first, coerente con lo stile Admin
 * - Header compatto con avatar e impostazioni
 * - "Hero" con saluto, chip stato e sfondo gradevole
 * - Sezione quick-actions a card grandi (Prenota / Le mie prenotazioni)
 * - Banner promozionale opzionale
 * - Sezione prossima prenotazione (placeholder se non esiste)
 * - Micro-animazioni con framer-motion
 */
export function UserHome() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  const email = useSelector((state) => state.userAuth.userDetails?.email);

  // Initials per l'avatar
  const initials = useMemo(() => {
    const n = nome?.trim()?.[0] || "";
    const c = cognome?.trim()?.[0] || "";
    return (n + c || email?.[0] || "").toUpperCase();
  }, [nome, cognome, email]);

  useEffect(() => {
    let mounted = true;
    const fetchNomeCognome = async () => {
      try {
        if (!email) return;
        const usersRef = collection(db, "user"); // manteniamo la tua collection singolare
        const q = query(usersRef, where("email", "==", email), limit(1));
        const snap = await getDocs(q);
        if (!mounted) return;
        if (!snap.empty) {
          const data = snap.docs[0].data();
          setNome(data?.nome || "");
          setCognome(data?.cognome || "");
        }
      } catch (e) {
        // silenzioso: manteniamo fallback
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };
    fetchNomeCognome();
    return () => {
      mounted = false;
    };
  }, [email]);

  const Greeting = () => (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Avatar
        sx={{
          bgcolor: theme.palette.primary.main,
          width: 44,
          height: 44,
          fontWeight: 700,
          boxShadow: 2,
        }}
      >
        {initials}
      </Avatar>
      <Box>
        <Typography variant="overline" sx={{ color: "text.secondary" }}>
          PROFESSIONISTA
        </Typography>
        {loadingUser ? (
          <Skeleton variant="text" width={180} height={28} sx={{ mt: -0.5 }} />
        ) : (
          <Typography variant="h5" fontWeight={800} lineHeight={1.1}>
            Ciao {nome || cognome ? `${nome} ${cognome}`.trim() : email}
          </Typography>
        )}
      </Box>
    </Stack>
  );

  const Hero = () => (
    <Box sx={{ position: "relative", mt: 1 }}>
      {/* sfondo morbido */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.secondary.light}22)`,
          filter: "blur(0px)",
        }}
      />
      <Card elevation={0} sx={{ borderRadius: 3, backdropFilter: "saturate(1.1)", position: "relative" }}>
        <CardContent sx={{ p: 2.25 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Greeting />
            <IconButton size="small" onClick={() => navigate("/userprofile")}>
              <SettingsIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
            <Chip icon={<FavoriteIcon />} label="Benvenuto" size="small" color="primary" variant="outlined" />
            <Chip icon={<LocalOfferIcon />} label="Promo attive" size="small" variant="outlined" />
          </Stack>

          <Box sx={{ mt: 1.75 }}>
            <Typography variant="body2" color="text.secondary">
              Prenota in pochi tap: scegli servizio, orario e professionista.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const QuickAction = ({ icon, title, subtitle, onClick }) => (
    <motion.div whileTap={{ scale: 0.98 }}>
      <CardActionArea onClick={onClick} sx={{ borderRadius: 3 }}>
        <Card sx={{ borderRadius: 3, height: 132 }}>
          <CardContent sx={{ p: 2.25, height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ height: "100%" }}>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {subtitle}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {icon}
                <ArrowForwardIosIcon fontSize="small" sx={{ opacity: 0.5 }} />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </CardActionArea>
    </motion.div>
  );

  const PromoBanner = () => (
    <Card sx={{ borderRadius: 3, background: theme.palette.mode === "dark" ? undefined : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: theme.palette.getContrastText(theme.palette.primary.main) }}>
      <CardContent sx={{ p: 2.25 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <NotificationsActiveIcon />
          <Typography variant="subtitle1" fontWeight={700}>
            Ricordati di attivare le notifiche
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Ricevi promemoria per gli appuntamenti e offerte personalizzate.
        </Typography>
        <Button
          size="small"
          variant="contained"
          sx={{ mt: 1.25, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          onClick={() => navigate("/userprofile")}
        >
          Vai alle impostazioni
        </Button>
      </CardContent>
    </Card>
  );

  const NextBooking = () => (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2.25 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <EventNoteIcon />
          <Typography variant="subtitle1" fontWeight={800}>Prossimo appuntamento</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          Nessuna prenotazione imminente. Prenota ora il tuo prossimo servizio!
        </Typography>
        <Button
          fullWidth
          startIcon={<CalendarMonthIcon />}
          sx={{ mt: 1.25, borderRadius: 2, height: 44, textTransform: "none", fontWeight: 700 }}
          variant="contained"
          onClick={() => navigate("/booking")}
        >
          Prenota adesso
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ pb: 10, px: 2, pt: 2 }}> {/* pb per non sovrapporsi alla NavMobile */}
      {/* HERO */}
      <Hero />

      {/* ACTIONS */}
      <Stack spacing={2} sx={{ mt: 2 }}>
        <QuickAction
          icon={<CalendarMonthIcon />}
          title="Prenota"
          subtitle="Scegli servizio e orario"
          onClick={() => navigate("/booking")}
        />
        <QuickAction
          icon={<EventNoteIcon />}
          title="Le mie prenotazioni"
          subtitle="Vedi e gestisci appuntamenti"
          onClick={() => navigate("/bookinglistuser")}
        />
        <QuickAction
          title="I nostri prodotti"
          subtitle="Scopri tutti i nostri prodotti presenti nel negozio"
          onClick={() => navigate("/shop")}
        />
      </Stack>

      {/* SEPARATOR */}
      <Divider sx={{ my: 2.5 }} />

      {/* PROMO + NEXT BOOKING */}
      <Stack spacing={2}>
        <PromoBanner />
        <NextBooking />
      </Stack>

      {/* Spazio per NavMobile se presente */}
      <Box sx={{ height: 70 }} />
    </Box>
  );
}
