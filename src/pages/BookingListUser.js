import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Avatar,
  useTheme,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import "moment/locale/it";
import { errorNoty } from "../components/Notify";

moment.locale("it");

export function BookingListUser() {
  const theme = useTheme();
  const [bookings, setBookings] = useState([]);
  const [employeeRoles, setEmployeeRoles] = useState({});
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const navigate = useNavigate();

  const email = useSelector((state) => state.userAuth.userDetails?.email);

  const fetchEmployeeRole = async (employeeId) => {
    try {
      const employeeRef = doc(db, "employee", employeeId);
      const employeeDoc = await getDoc(employeeRef);
      return employeeDoc.exists() ? employeeDoc.data().nomeRuolo : "Professionista";
    } catch {
      return "Professionista";
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsRef = collection(db, "bookings");
        const bookingsQuery = query(
          bookingsRef,
          where("userEmail", "==", email),
          orderBy("createdAt", "desc")
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);

        if (bookingsSnapshot.empty) {
          setBookings([]);
          return;
        }

        const bookingsData = bookingsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setBookings(bookingsData);

        const roles = {};
        for (const b of bookingsData) {
          if (!roles[b.employeeId]) {
            roles[b.employeeId] = await fetchEmployeeRole(b.employeeId);
          }
        }
        setEmployeeRoles(roles);
      } catch (err) {
        setError("Errore durante il recupero delle prenotazioni.");
      }
    };
    fetchBookings();
  }, [email]);

  const handleDeleteBooking = async () => {
    try {
      await deleteDoc(doc(db, "bookings", selectedBookingId));
      setBookings((prev) => prev.filter((b) => b.id !== selectedBookingId));
      setConfirmOpen(false);
      errorNoty("Prenotazione cancellata");
    } catch {
      setError("Errore durante la cancellazione della prenotazione.");
    }
  };

  const isBookingPast = (date, startTime) => {
    const bookingDateTime = moment(`${date} ${startTime}`, "DD-MM-YYYY HH:mm");
    return bookingDateTime.isBefore(moment());
  };

  // split upcoming vs past for migliore UX
  const { upcoming, past } = useMemo(() => {
    const up = [];
    const pa = [];
    for (const b of bookings) {
      (isBookingPast(b.date, b.startTime) ? pa : up).push(b);
    }
    return { upcoming: up, past: pa };
  }, [bookings]);

  const Header = () => (
    <Box sx={{ position: "relative", mb: 2 }}>
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.light}22, ${theme.palette.secondary.light}22)`,
        }}
      />
      <Card elevation={0} sx={{ borderRadius: 3, position: "relative" }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton className="p-0" onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={800}>Le mie Prenotazioni</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Visualizza, gestisci e cancella i tuoi appuntamenti.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  const BookingCard = ({ b }) => (
    <motion.div whileHover={{ scale: 1.01 }}>
      <Card sx={{ borderRadius: 4, boxShadow: 3, overflow: "hidden", background: theme.palette.mode === "dark" ? undefined : `linear-gradient(180deg, ${theme.palette.background.paper}, ${theme.palette.background.paper})` }}>
        <CardContent sx={{ p: 2.25 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
              <CalendarMonthIcon />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                <Typography variant="h6" fontWeight={800} noWrap title={b.service}>{b.service}</Typography>
                <Chip size="small" color={isBookingPast(b.date, b.startTime) ? "default" : "success"} label={isBookingPast(b.date, b.startTime) ? "Passata" : "Confermata"} />
              </Stack>
              <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                <Typography variant="body2" color="text.secondary">
                  <EventIcon fontSize="small" style={{ marginRight: 6, verticalAlign: -3 }} />
                  {b.date}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <AccessTimeIcon fontSize="small" style={{ marginRight: 6, verticalAlign: -3 }} />
                  {b.startTime} – {b.endTime}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <PersonIcon fontSize="small" style={{ marginRight: 6, verticalAlign: -3 }} />
                  {employeeRoles[b.employeeId] || "Professionista"}: {b.employeeUsername}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {/* ACTIONS */}
          {!isBookingPast(b.date, b.startTime) ? (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="error"
                startIcon={<DeleteForeverIcon />}
                sx={{ borderRadius: 2, textTransform: "none", height: 44 }}
                onClick={() => { setSelectedBookingId(b.id); setConfirmOpen(true); }}
              >
                Cancella
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<InfoOutlinedIcon />}
                sx={{ borderRadius: 2, textTransform: "none", height: 44 }}
                onClick={() => {/* in futuro: dettagli/recap */}}
              >
                Dettagli
              </Button>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
              Appuntamento passato
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ px: 2, pt: 2, pb: 8 }}>
      <Header />

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
      )}

      {/* UPCOMING */}
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Prossimi</Typography>
          <Divider flexItem sx={{ flexGrow: 1 }} />
          <Chip size="small" label={upcoming.length} />
        </Stack>
        {upcoming.length === 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Nessuna prenotazione imminente.</Typography>
              <Button sx={{ mt: 1.25, borderRadius: 2 }} variant="contained" onClick={() => navigate("/booking")}>Prenota ora</Button>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2} alignItems="center">
            {upcoming.map((b) => (
              <Box key={b.id} sx={{ width: "100%", maxWidth: 480 }}>
                <BookingCard b={b} />
              </Box>
            ))}
          </Stack>
        )}
      </Stack>

      {/* PAST */}
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Storico</Typography>
          <Divider flexItem sx={{ flexGrow: 1 }} />
          <Chip size="small" label={past.length} />
        </Stack>
        {past.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nessuna prenotazione passata.</Typography>
        ) : (
          <Stack spacing={2} alignItems="center">
          {past.map((b) => (
            <Box key={b.id} sx={{ width: "100%", maxWidth: 480 }}>
              <BookingCard b={b} />
            </Box>
          ))}
          </Stack>
        )}
      </Stack>

      {/* CONFIRM DIALOG */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Cancella Prenotazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler cancellare questa prenotazione?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Annulla</Button>
          <Button variant="contained" onClick={handleDeleteBooking} color="error">
            Cancella
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
