import { styled, ThemeProvider } from '@mui/material/styles';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { itIT } from "@mui/x-data-grid/locales";
import CircularProgress from '@mui/material/CircularProgress';
import { Paper, IconButton, Snackbar, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useState, useEffect } from "react";
import { db } from "../firebase-config";
import { collection, getDocs, deleteDoc, doc, orderBy, query, where, getDoc, limit, updateDoc } from "firebase/firestore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ShareIcon from "@mui/icons-material/Share";
import RefreshIcon from '@mui/icons-material/Refresh';
import { StyledDataGrid, theme } from '../components/StyledDataGrid';
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { EditiDipendente } from '../components/EditiDipendente';
import { EditService } from '../components/EditService';


export function ServiziList() {
  const [servizi, setServizi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [searchServizio, setSearchServizio] = useState('');  
  const [searchType, setSearhType] = useState('servizio'); 

  const handleEdit = (customerId) => {
    setEditCustomerId(customerId);
    setEditOpen(true);
  };

  const fetchservizi = async (searchType) => {
    try {
      setLoading(true); // Inizia il caricamento
      const customerCollection = collection(db, "service");
  
      let customerQuery;
      const lowerCaseservizio = searchServizio ? searchServizio.toLowerCase() : null;
      if(searchServizio && searchType == "servizio") {
        customerQuery = query(customerCollection, where("servizio", "==", searchServizio));
      } else {
        // Crea una query per ordinare per dataCreazione in ordine decrescente se non c'è il filtro
        customerQuery = query(customerCollection, orderBy("dataCreazione", "desc"), limit(100));
      }
  
      const servizinapshot = await getDocs(customerQuery);
      const customerList = servizinapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setServizi(customerList);
    } catch (error) {
      console.error("Errore nel recupero dei dati dei clienti: ", error);
    } finally {
      setLoading(false); // Termina il caricamento
    }
  };
  
  useEffect(() => {
    fetchservizi();
  }, []);

  const capitalizeWords = (str) => {
    return str
      .toLowerCase() // Converte l'intera stringa in minuscolo
      .split(' ') // Divide la stringa in parole
      .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizza la prima lettera di ogni parola
      .join(' '); // Riunisce le parole in una stringa
  };

  const handleTogglePassword = (id) => {
    setShowPassword((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };


  const handleRowSelectionChange = (newSelection) => {
    console.log("Selected Customer IDs:", newSelection);
    setSelectedCustomerIds(newSelection);
  };

  const handleDelete = async () => {
    const deletePromises = selectedCustomerIds.map(async (id) => {
      try {
        // Elimina il dipendente dalla collezione "servizi"
        await deleteDoc(doc(db, "servizi", id));

      } catch (error) {
        console.error("Errore durante l'eliminazione del dipendente o dei veicoli:", error);
      }
    });
  
    try {
      await Promise.all(deletePromises);
  
      // Rimuovi i dipendenti eliminati dallo stato
      setServizi(servizi.filter((customer) => !selectedCustomerIds.includes(customer.id)));
      setSnackbarOpen(true); // Mostra un messaggio di successo
    } catch (error) {
      console.error("Errore durante l'eliminazione dei dipendenti:", error);
    } finally {
      // Chiudi la finestra di conferma e resetta la selezione
      setConfirmOpen(false);
      setSelectedCustomerIds([]);
    }
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchservizi("phone");
  };

  const handlesearchServizio = (e) => {
    e.preventDefault();
    fetchservizi("servizio");
  };

  const handleResetSearch = () => {
    setSearchServizio("");
  }
 
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "servizio", headerName: "Servizio", width: 220 },
    { field: "durata", headerName: "Durata (min)", width: 100 },
    { field: "prezzo", headerName: "Prezzo (€)", width: 100 },
    { 
      field: "dipendentiAssegnati", 
      headerName: "Dipendenti Assegnati", 
      width: 250,
      renderCell: (params) => {
        const value = params.value;
        // Se è un array, uniscili con una virgola, altrimenti lo visualizza direttamente.
        const display = Array.isArray(value) ? value.join(", ") : value;
        return (
          <div style={{ maxHeight: 50, overflowY: "auto", whiteSpace: "pre-wrap" }}>
            {display}
          </div>
        );
      }
    }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="container-fluid">
        <h2 className='titlePage'>Servizi</h2>
        <div className='d-flex justify-content-between align-items-center mt-4'>
          <div className='d-flex flex-column  gap-2'>
            <div className='d-flex align-items-center gap-2'>
              <p className='mb-0'><strong>Ricerca per:</strong></p>
              <p className={`pSearch ${searchType === "servizio" ? "active" : ""}`}  onClick={() => {setSearhType("servizio")}}>servizio</p> 
            </div>
          {searchType == "servizio" &&
          <form className="d-flex align-items-center" onSubmit={handlesearchServizio}>
            <TextField
              style={{width: "180px"}}
              label="Cerca per servizio"
              variant="outlined"
              className="me-2"
              value={searchServizio}
              onChange={(e) => {
                const formattedName = capitalizeWords(e.target.value); // Capitalizza il valore inserito
                setSearchServizio(formattedName); // Aggiorna lo stato con il valore formattato
              }}  // Aggiorna lo stato con il valore inserito
            />
            <Button
              className="me-2"
              type="submit"
              color="primary"
              variant="contained"
            >
              Cerca
            </Button>
          </form>
          }
          </div>
          <div>
            <IconButton variant="contained" onClick={() => {fetchservizi(""); handleResetSearch()}}>
              <RefreshIcon/>
            </IconButton>
            <Button
              variant="contained"
              color='primary'
              className='me-2'
              onClick={() => navigate("/serviziadd")}
            >
              Aggiungi Servizio
            </Button>
            <Button
              variant="contained"
              color='primary'
              className='me-2'
              onClick={() => handleEdit(selectedCustomerIds[0])}
              disabled={selectedCustomerIds.length !== 1}
            >
              Modifica
            </Button>
            <Button color='error' variant="contained" onClick={handleConfirmDelete} disabled={selectedCustomerIds.length === 0}>
              Elimina {selectedCustomerIds.length > 0 && `(${selectedCustomerIds.length})`}
            </Button>
          </div>
        </div>
        <ThemeProvider theme={theme}>
          <Paper className='mt-4' sx={{ height: "50vh", borderRadius: '8px', overflowX: "auto", position: "relative" }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </div>
            ) : (
              <StyledDataGrid
                onCellClick={() => {}}
                rows={servizi}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={handleRowSelectionChange}
                localeText={itIT.components.MuiDataGrid.defaultProps.localeText}
              />
            )}
          </Paper>
        </ThemeProvider>
        <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} message="Cliente eliminato!" anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle style={{backgroundColor: "#1E1E1E" }}>Conferma Eliminazione</DialogTitle>
          <DialogContent style={{backgroundColor: "#1E1E1E" }}>
            <DialogContentText>
              Sei sicuro di voler eliminare {selectedCustomerIds.length} questo servizio{i => (selectedCustomerIds.length > 1 ? 'i' : '')} selezionato{i => (selectedCustomerIds.length > 1 ? 'i' : '')}?
            </DialogContentText>
          </DialogContent >
          <DialogActions style={{backgroundColor: "#1E1E1E" }}>
            <Button onClick={() => setConfirmOpen(false)} color="primary">Annulla</Button>
            <Button onClick={handleDelete} color="error">Elimina</Button>
          </DialogActions>
        </Dialog>

        <Dialog maxWidth="md" open={editOpen} onClose={() => setEditOpen(false)}>
          <DialogTitle style={{backgroundColor: "#1E1E1E" }}>Modifica Servizio</DialogTitle>
          <DialogContent style={{backgroundColor: "#1E1E1E" }}>
              <EditService fetchservizi={fetchservizi} serviceId={editCustomerId} onClose={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
