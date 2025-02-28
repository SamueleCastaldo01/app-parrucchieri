import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { Button, Card, CardContent, Typography, Grid, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, getDoc } from "firebase/firestore";
import { db } from "../firebase-config"; // Assicurati che il percorso del db sia corretto
import { useNavigate } from "react-router-dom";
import { NavMobile } from "../components/NavMobile";
import moment from 'moment'; // Import Moment.js
import { errorNoty } from "../components/Notify";

export function BookingListUser() {
  const [bookings, setBookings] = useState([]);
  const [employeeRoles, setEmployeeRoles] = useState({}); // Stato per memorizzare i nomi dei ruoli
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);  // Stato per aprire/chiudere il dialog di conferma
  const [selectedBookingId, setSelectedBookingId] = useState(null); // Stato per tenere traccia della prenotazione selezionata
  const navigate = useNavigate();

  // Ottieni l'email dal Redux store
  const email = useSelector((state) => state.userAuth.userDetails?.email);

  // Funzione per recuperare il ruolo dell'impiegato usando l'employeeId
  const fetchEmployeeRole = async (employeeId) => {
    try {
      const employeeRef = doc(db, "employee", employeeId);
      const employeeDoc = await getDoc(employeeRef);
      
      if (employeeDoc.exists()) {
        return employeeDoc.data().nomeRuolo;
      } else {
        console.log("Employee not found");
        return "Ruolo non disponibile";
      }
    } catch (err) {
      console.error("Errore nel recupero del ruolo dell'impiegato:", err);
      return "Errore nel recupero ruolo";
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Query per ottenere tutte le prenotazioni per l'email dell'utente, ordinate per createdAt
        const bookingsRef = collection(db, "bookings");
        const bookingsQuery = query(
          bookingsRef,
          where("userEmail", "==", email),
          orderBy("createdAt", "desc") // Ordinamento per data di creazione
        );
        const bookingsSnapshot = await getDocs(bookingsQuery);

        if (bookingsSnapshot.empty) {
          setError("Nessuna prenotazione trovata.");
          return;
        }

        const bookingsData = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));

        setBookings(bookingsData);

        // Recupero i ruoli dei dipendenti per ogni prenotazione
        const roles = {};
        for (const booking of bookingsData) {
          if (!roles[booking.employeeId]) {
            const role = await fetchEmployeeRole(booking.employeeId);
            roles[booking.employeeId] = role;
          }
        }
        setEmployeeRoles(roles);

      } catch (err) {
        console.error("Errore durante il recupero delle prenotazioni:", err);
        setError("Si è verificato un errore durante il recupero delle prenotazioni.");
      }
    };

    fetchBookings();
  }, [email]);

  // Funzione per cancellare la prenotazione
  const handleDeleteBooking = async () => {
    try {
      // Cancella la prenotazione da Firestore
      await deleteDoc(doc(db, "bookings", selectedBookingId));
      
      // Rimuovi la prenotazione dalla lista locale
      setBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== selectedBookingId));
      setConfirmOpen(false); // Chiudi il dialog di conferma dopo aver cancellato
      errorNoty("Prenotazione cancellata")
    } catch (err) {
      console.error("Errore durante la cancellazione della prenotazione:", err);
      setError("Si è verificato un errore durante la cancellazione della prenotazione.");
    }
  };

  // Funzione per formattare la data con Moment.js
  const formatDate = (dateString) => {
    return moment(dateString).format('DD-MM-YYYY'); // Usa Moment per formattare la data
  };

  const isBookingPast = (dateString, startTimeString) => {
    // Converto la data e l'orario della prenotazione in un oggetto moment
    const bookingDateTime = moment(`${dateString} ${startTimeString}`, 'DD-MM-YYYY HH:mm');
    const currentDateTime = moment();
  
    // Confronto la data e l'orario
    return bookingDateTime.isBefore(currentDateTime); // Se la prenotazione è passata, restituisce true
  };

  // Funzione per aprire il dialog di conferma
  const handleOpenConfirmDialog = (bookingId) => {
    setSelectedBookingId(bookingId);
    setConfirmOpen(true);
  };

  return (
    <>
      <NavMobile />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <div className="px-3" style={{ marginTop: "50px", marginBottom: "40px" }}>
          <div className="py-2" style={{ backgroundColor: "#333" }}>
            <h1 className="rounded rounded-2">Le mie Prenotazioni</h1>
          </div>

          <div className="py-4">
            {error && <Typography color="error">{error}</Typography>}

            {bookings.length === 0 ? (
              <Typography variant="h6">Non hai prenotazioni al momento.</Typography>
            ) : (
              <Grid container spacing={3}>
                {bookings.map((booking) => (
                  <Grid item xs={12} sm={6} md={4} key={booking.id}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6">{booking.service}</Typography>
                        <Typography color="textSecondary">Data Prenotazione: <span className="text-white">{booking.date}</span></Typography>
                        <Typography color="textSecondary">
                            <span className="text-white">Orario:</span> {booking.startTime} - {booking.endTime}
                        </Typography>
                        <Typography color="textSecondary">{employeeRoles[booking.employeeId]}: <span className="text-white">{booking.employeeUsername}</span></Typography>

                        {/* Condizione per nascondere il pulsante se la prenotazione è passata (data + orario) */}
                        {!isBookingPast(booking.date, booking.startTime) && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleOpenConfirmDialog(booking.id)}  // Apri il dialog di conferma quando clicchi su "Annulla"
                            fullWidth
                            style={{ marginTop: "10px" }}
                        >
                            Cancella Prenotazione
                        </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </div>
        </div>
      </motion.div>

      {/* Dialog di conferma per l'eliminazione della prenotazione */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle style={{ backgroundColor: "#1E1E1E" }}>Cancella Prenotazione</DialogTitle>
        <DialogContent style={{ backgroundColor: "#1E1E1E" }}>
          <DialogContentText>
            Sei sicuro di voler cancellare questa prenotazione?
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#1E1E1E" }}>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Annulla
          </Button>
          <Button variant="contained" onClick={handleDeleteBooking} color="error">
            Cancella
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
