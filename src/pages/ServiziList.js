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



{/*
    "nome": "Taglio Uomo",
    "durata": 30,
    "prezzo": 20,
    "descrizione": "Taglio classico per uomo",
    "dipendentiAssegnati": ["dipendenteId1", "dipendenteId2"],
    "dataCreazione": "2025-02-25T10:00:00Z"
  */}

export function ServiziList() {
  const [employee, setEmployee] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const [editCustomerId, setEditCustomerId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [searchPhone, setSearchPhone] = useState(''); 
  const [searchNome, setSearchNome] = useState('');  
  const [searchCognome, setSearchCognome] = useState(''); 
  const [searchType, setSearhType] = useState('nome'); 

  const handleEdit = (customerId) => {
    setEditCustomerId(customerId);
    setEditOpen(true);
  };

  const fetchemployee = async (searchType) => {
    try {
      setLoading(true); // Inizia il caricamento
      const customerCollection = collection(db, "service");
  
      let customerQuery;
      const lowerCaseNome = searchNome ? searchNome.toLowerCase() : null;
      const lowerCaseCognome = searchCognome ? searchCognome.toLowerCase() : null;
      if (searchPhone && searchType == "phone") {
        // Filtro per numero di telefono
        customerQuery = query(customerCollection, where("telefono", "==", searchPhone));
      } else if(searchNome && searchType == "nome") {
        customerQuery = query(customerCollection, where("nome", "==", searchNome));
      } else if(searchCognome && searchType == "cognome") {
        customerQuery = query(customerCollection, where("cognome", "==", searchCognome));
      }
      else {
        // Crea una query per ordinare per dataCreazione in ordine decrescente se non c'è il filtro
        customerQuery = query(customerCollection, orderBy("dataCreazione", "desc"), limit(100));
      }
  
      const employeenapshot = await getDocs(customerQuery);
      const customerList = employeenapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setEmployee(customerList);
    } catch (error) {
      console.error("Errore nel recupero dei dati dei clienti: ", error);
    } finally {
      setLoading(false); // Termina il caricamento
    }
  };
  

  useEffect(() => {
    fetchemployee();
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
        // Elimina il dipendente dalla collezione "employee"
        await deleteDoc(doc(db, "employee", id));

      } catch (error) {
        console.error("Errore durante l'eliminazione del dipendente o dei veicoli:", error);
      }
    });
  
    try {
      await Promise.all(deletePromises);
  
      // Rimuovi i dipendenti eliminati dallo stato
      setEmployee(employee.filter((customer) => !selectedCustomerIds.includes(customer.id)));
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
    fetchemployee("phone");
  };

  const handleSearchNome = (e) => {
    e.preventDefault();
    fetchemployee("nome");
  };

  const handleSearchCognome = (e) => {
    e.preventDefault();
    fetchemployee("cognome");
  };


  const handleResetSearch = () => {
    setSearchCognome("");
    setSearchNome("");
    setSearchPhone("");
  }
 
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "username",
      headerName: "Username",
      width: 130,
      renderCell: (params) => (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            width: "100%",
          }}
        >
          <span
            style={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => {navigate("/dashboardcustomer/" + params.row.id)}}
          >
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "password",
      headerName: "Password",
      width: 200,
      renderCell: (params) => {
        const isPasswordVisible = showPassword[params.row.id];
        return (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span>{isPasswordVisible ? params.value : "*********"}</span>
            <div>
              <IconButton
                onClick={() => handleTogglePassword(params.row.id)}
                aria-label="toggle password visibility"
                size="small"
                sx={{ padding: 0 }}
              >
                {isPasswordVisible ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </IconButton>
            </div>
          </div>
        );
      },
    },
    { field: "nome", headerName: "Nome", width: 130 },
    { field: "cognome", headerName: "Cognome", width: 130 },
    {
      field: "telefono",
      headerName: "Telefono",
      width: 150,
      renderCell: (params) => (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <span>{params.value}</span>
        </div>
      ),
    },
    { field: "email", headerName: "Email", width: 130 },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="container-fluid">
        <h2 className='titlePage'>Servizi</h2>
        <div className='d-flex justify-content-between align-items-center mt-4'>
          <div className='d-flex flex-column  gap-2'>
            <div className='d-flex align-items-center gap-2'>
              <p className='mb-0'><strong>Ricerca per:</strong></p>
              <p className={`pSearch ${searchType === "nome" ? "active" : ""}`}  onClick={() => {setSearhType("nome")}}>Nome</p> 
              <p className={`pSearch ${searchType === "cognome" ? "active" : ""}`} onClick={() => {setSearhType("cognome")}}>Cognome</p>
              <p className={`pSearch ${searchType === "telefono" ? "active" : ""}`} onClick={() => {setSearhType("telefono")}}>Telefono</p>
            </div>
          {searchType == "telefono" &&
          <form className="d-flex align-items-center" onSubmit={handleSearch}>
            <TextField
              style={{width: "180px"}}
              label="Cerca per Telefono"
              variant="outlined"
              className="me-2"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)} // Aggiorna lo stato con il valore inserito
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
          {searchType == "nome" &&
          <form className="d-flex align-items-center" onSubmit={handleSearchNome}>
            <TextField
              style={{width: "180px"}}
              label="Cerca per Nome"
              variant="outlined"
              className="me-2"
              value={searchNome}
              onChange={(e) => {
                const formattedName = capitalizeWords(e.target.value); // Capitalizza il valore inserito
                setSearchNome(formattedName); // Aggiorna lo stato con il valore formattato
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
          {searchType == "cognome" &&
          <form className="d-flex align-items-center" onSubmit={handleSearchCognome}>
            <TextField
              style={{width: "180px"}}
              label="Cerca per Cognome"
              variant="outlined"
              className="me-2"
              value={searchCognome}
              onChange={(e) => {
                const formattedCognome = capitalizeWords(e.target.value); // Capitalizza il valore inserito
                setSearchCognome(formattedCognome); // Aggiorna lo stato con il valore formattato
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
            <IconButton variant="contained" onClick={() => {fetchemployee(""); handleResetSearch()}}>
              <RefreshIcon/>
            </IconButton>
            <Button
              variant="contained"
              color='primary'
              className='me-2'
              onClick={() => navigate("/employeeadd")}
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
                rows={employee}
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
              Sei sicuro di voler eliminare {selectedCustomerIds.length} cliente{i => (selectedCustomerIds.length > 1 ? 'i' : '')} selezionato{i => (selectedCustomerIds.length > 1 ? 'i' : '')}?
            </DialogContentText>
          </DialogContent >
          <DialogActions style={{backgroundColor: "#1E1E1E" }}>
            <Button onClick={() => setConfirmOpen(false)} color="primary">Annulla</Button>
            <Button onClick={handleDelete} color="error">Elimina</Button>
          </DialogActions>
        </Dialog>

        <Dialog maxWidth="md" open={editOpen} onClose={() => setEditOpen(false)}>
          <DialogTitle style={{backgroundColor: "#1E1E1E" }}>Modifica Dipendente</DialogTitle>
          <DialogContent style={{backgroundColor: "#1E1E1E" }}>
              <EditiDipendente fetchemployee={fetchemployee} customerId={editCustomerId} onClose={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );
}
