import { styled, ThemeProvider } from '@mui/material/styles';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { itIT } from "@mui/x-data-grid/locales";
import CircularProgress from '@mui/material/CircularProgress';
import { Paper, IconButton, Snackbar, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useState, useEffect } from "react";
import { db } from "../firebase-config";
import { collection, getDocs, deleteDoc, doc, orderBy, query, where, limit } from "firebase/firestore";
import RefreshIcon from '@mui/icons-material/Refresh';
import { StyledDataGrid, theme } from '../components/StyledDataGrid';
import dayjs from 'dayjs';

export function BookingsReview() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedBookingIds, setSelectedBookingIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const [searchUserEmail, setSearchUserEmail] = useState('');
  const [searchDate, setSearchDate] = useState(dayjs().format("YYYY-MM-DD")); // Formato dell'input

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const bookingsCollection = collection(db, "bookings");
      const formattedDate = dayjs(searchDate).format("DD-MM-YYYY");
  
      let bookingsQuery = query(bookingsCollection, where("date", "==", formattedDate));
  
      if (searchUserEmail) {
        bookingsQuery = query(
          bookingsCollection,
          where("date", "==", formattedDate),
          where("userEmail", "==", searchUserEmail)
        );
      }
  
      const bookingsSnapshot = await getDocs(bookingsQuery);
      let bookingsList = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // 🔹 Ordinamento interno per orario (formato HH:mm)
      bookingsList.sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
  
      setBookings(bookingsList);
    } catch (error) {
      console.error("Errore nel recupero delle prenotazioni: ", error);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchBookings();
  }, [searchDate]); // Aggiorna automaticamente quando cambia la data

  const handleDelete = async () => {
    const deletePromises = selectedBookingIds.map(async (id) => {
      try {
        await deleteDoc(doc(db, "bookings", id));
      } catch (error) {
        console.error("Errore durante l'eliminazione della prenotazione:", error);
      }
    });

    try {
      await Promise.all(deletePromises);
      setBookings(bookings.filter((booking) => !selectedBookingIds.includes(booking.id)));
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Errore durante l'eliminazione delle prenotazioni:", error);
    } finally {
      setConfirmOpen(false);
      setSelectedBookingIds([]);
    }
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleRowSelectionChange = (newSelection) => {
    setSelectedBookingIds(newSelection);
  };

  const columns = [
    { field: "date", headerName: "Data", width: 95 },
    { field: "startTime", headerName: "Ore", width: 80 },
    { field: "service", headerName: "Servizio", width: 200 },
    { field: "employeeUsername", headerName: "Dipendente", width: 150 },
    { field: "userName", headerName: "Nome Cliente", width: 150 },
    { field: "userSurname", headerName: "Cognome Cliente", width: 150 },
    { field: "userEmail", headerName: "Email Cliente", width: 250 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="container-fluid">
        <h2 className='titlePage'>Prenotazioni</h2>
        <div className='d-flex justify-content-between align-items-center mt-4'>
          <form className="d-flex align-items-center" onSubmit={handleSearch}>
            <TextField
              type="date"
              label="Seleziona Data"
              variant="outlined"
              className="me-2"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              style={{ width: "180px" }}
              InputLabelProps={{ shrink: true }}
              sx={{
                "& input": {
                  color: "white", // Colore del testo bianco
                },
                "& label": {
                  color: "white", // Colore dell'etichetta bianca
                },
                "& input[type='date']::-webkit-calendar-picker-indicator": {
                  filter: "invert(1)", // Inverte il colore dell'icona (bianca su sfondo scuro)
                },
              }}
            />

            <TextField
              style={{ width: "200px" }}
              label="Cerca per Email Cliente"
              variant="outlined"
              className="me-2"
              value={searchUserEmail}
              onChange={(e) => setSearchUserEmail(e.target.value)}
            />
            <Button type="submit" color="primary" variant="contained">
              Cerca
            </Button>
          </form>
          <div>
            <IconButton onClick={() => { 
              fetchBookings(); 
              setSearchUserEmail(''); 
              setSearchDate(dayjs().format("YYYY-MM-DD")); 
            }}>
              <RefreshIcon />
            </IconButton>
            <Button color='error' variant="contained" onClick={handleConfirmDelete} disabled={selectedBookingIds.length === 0}>
              Cancella {selectedBookingIds.length > 0 && `(${selectedBookingIds.length})`}
            </Button>
          </div>
        </div>
        <ThemeProvider theme={theme}>
          <Paper className='mt-4' sx={{ height: "50vh", borderRadius: '8px', overflowX: "auto" }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </div>
            ) : (
              <StyledDataGrid
                rows={bookings}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={handleRowSelectionChange}
                localeText={itIT.components.MuiDataGrid.defaultProps.localeText}
              />
            )}
          </Paper>
        </ThemeProvider>
        <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} message="Prenotazione eliminata!" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Cancella Prenotazione</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Sei sicuro di voler cancellare {selectedBookingIds.length} prenotazione{selectedBookingIds.length > 1 ? 'i' : ''} selezionata{selectedBookingIds.length > 1 ? 'e' : ''}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} color="primary">Annulla</Button>
            <Button variant='contained' onClick={handleDelete} color="error">Cancella</Button>
          </DialogActions>
        </Dialog>
      </div>
    </motion.div>
  );
}
