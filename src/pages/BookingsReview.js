// pages/BookingsReview.jsx
import { ThemeProvider } from "@mui/material/styles";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Paper,
  Stack,
  Typography,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Snackbar,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Tooltip,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from "@mui/icons-material/Refresh";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import { useState, useEffect } from "react";
import { db } from "../firebase-config";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";

import { StyledDataGrid, theme, PRIMARY } from "../components/StyledDataGrid";
import { itIT } from "@mui/x-data-grid/locales";
import dayjs from "dayjs";

export function BookingsReview() {
  // Stato per la lista completa del giorno e quella filtrata
  const [allBookings, setAllBookings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Filtri
  const [searchDate, setSearchDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [selectedEmployee, setSelectedEmployee] = useState("Tutti");

  // Fetch per data
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsCollection = collection(db, "bookings");
      const formattedDate = dayjs(searchDate).format("DD-MM-YYYY");

      const q = query(bookingsCollection, where("date", "==", formattedDate));
      const snap = await getDocs(q);

      let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Ordina per orario (HH:mm)
      list.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

      setAllBookings(list);
      setBookings(
        selectedEmployee !== "Tutti"
          ? list.filter((b) => b.employeeUsername === selectedEmployee)
          : list
      );
    } catch (e) {
      console.error("Errore nel recupero delle prenotazioni:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch quando cambia la data
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchDate]);

  // Filtra quando cambia il dipendente
  useEffect(() => {
    if (selectedEmployee !== "Tutti") {
      setBookings(allBookings.filter((b) => b.employeeUsername === selectedEmployee));
    } else {
      setBookings(allBookings);
    }
  }, [selectedEmployee, allBookings]);

  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedBookingIds.map((id) => deleteDoc(doc(db, "bookings", id)))
      );
      setBookings((prev) => prev.filter((b) => !selectedBookingIds.includes(b.id)));
      setSnackbarOpen(true);
    } catch (e) {
      console.error("Errore durante l'eliminazione delle prenotazioni:", e);
    } finally {
      setConfirmOpen(false);
      setSelectedBookingIds([]);
    }
  };

  const handleConfirmDelete = () => setConfirmOpen(true);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleRowSelectionChange = (model) => setSelectedBookingIds(model);

  const uniqueEmployees = Array.from(
    new Set(allBookings.map((b) => b.employeeUsername).filter(Boolean))
  ).sort();

  const columns = [
    { field: "date", headerName: "Data", width: 110 },
    { field: "startTime", headerName: "Ore", width: 100 },
    { field: "service", headerName: "Servizio", minWidth: 220, flex: 1 },
    { field: "employeeUsername", headerName: "Dipendente", minWidth: 160 },
    { field: "userName", headerName: "Nome Cliente", minWidth: 160 },
    { field: "userSurname", headerName: "Cognome Cliente", minWidth: 160 },
    { field: "userEmail", headerName: "Email Cliente", minWidth: 240, flex: 1 },
  ];

  const resetFilters = () => {
    setSelectedEmployee("Tutti");
    setSearchDate(dayjs().format("YYYY-MM-DD"));
    fetchBookings();
  };

  return (
    <ThemeProvider theme={theme}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
        <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
          {/* Header */}
          <Box
            sx={{
              mb: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background: "rgba(58,81,176,0.1)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CalendarMonthIcon htmlColor={PRIMARY} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>
                Prenotazioni
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Ricarica">
                <IconButton onClick={resetFilters}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                color="error"
                variant="outlined"
                onClick={handleConfirmDelete}
                disabled={selectedBookingIds.length === 0}
              >
                Cancella {selectedBookingIds.length > 0 && `(${selectedBookingIds.length})`}
              </Button>
            </Stack>
          </Box>

          {/* Filtri */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              mb: 2,
            }}
          >
            <Box
              component="form"
              onSubmit={handleSearch}
              sx={{
                display: "flex",        // ✅ cambio da grid a flex
                flexWrap: "wrap",
                gap: 1.5,
                alignItems: "center",
              }}
            >
              <TextField
                type="date"
                label="Seleziona Data"
                value={searchDate}
                onChange={(e) => {
                  setSearchDate(e.target.value);
                  setSelectedEmployee("Tutti");
                }}
                InputLabelProps={{ shrink: true }}
                size="small"
                sx={{ width: "auto", minWidth: 160 }}   // ✅ solo lo spazio che serve
              />

              <TextField
                select
                label="Dipendente"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                size="small"
                sx={{ width: "auto", minWidth: 180 }}   // ✅ idem qui
              >
                <MenuItem value="Tutti">Tutti</MenuItem>
                {uniqueEmployees.map((emp) => (
                  <MenuItem key={emp} value={emp}>
                    {emp}
                  </MenuItem>
                ))}
              </TextField>

              <Button type="submit" variant="outlined">
                Cerca
              </Button>
              <Button variant="text" onClick={resetFilters}>
                Reset
              </Button>
            </Box>
          </Paper>


          {/* Tabella */}
          <Paper
            sx={{
              height: "65vh",
              borderRadius: 3,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", height: "100%" }}>
                <CircularProgress />
              </Box>
            ) : (
              <StyledDataGrid
                rows={bookings}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={setSelectedBookingIds}
                localeText={itIT.components.MuiDataGrid.defaultProps.localeText}
              />
            )}
          </Paper>

          {/* Snackbar */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={2000}
            onClose={() => setSnackbarOpen(false)}
            message="Prenotazione eliminata!"
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          />

          {/* Dialog conferma */}
          <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Cancella Prenotazione</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Sei sicuro di voler cancellare {selectedBookingIds.length} prenotazione
                {selectedBookingIds.length > 1 ? "i" : ""} selezionata
                {selectedBookingIds.length > 1 ? "e" : ""}?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmOpen(false)}>Annulla</Button>
              <Button variant="contained" onClick={handleDelete} color="error">
                Cancella
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </motion.div>
    </ThemeProvider>
  );
}
