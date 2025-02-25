import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, deleteDoc, doc, limit, query, where, getDoc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase-config"; 
import { Paper, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, IconButton, TextField, CircularProgress, Switch, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import RefreshIcon from '@mui/icons-material/Refresh';
import { StyledDataGrid, theme } from "../components/StyledDataGrid";
import { ThemeProvider } from "@mui/material/styles";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { itIT } from "@mui/x-data-grid/locales";

export function ScadenzarioTagliando() {
  const navigate = useNavigate();
  const [scadRev, setScadRev] = useState([]);
  const [selectedScadRevIds, setSelectedScadRevIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filtroConferma, setFiltroConferma] = useState(1); //0 tutte, 1 confermate, 2 non confermate
  const today = moment();
  const [filtroMese, setFiltroMese] = useState(today.format("M"));
  const [filtroAnno, setFiltroAnno] = useState(today.format("YYYY"));
  const [loading, setLoading] = useState(false); // Stato per il caricamento


  const handleWhatsApp = (telefono) => {
    const message = 'Scadenza tagliando imminente! Controlla la tua data di scadenza tagliando';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };


  const handleChange = (event) => {
    setFiltroConferma(event.target.value);
    };

    const handleChangeMese = (event) => {
        setFiltroMese(event.target.value);
    };

const handleSearch = (e) => {
    e.preventDefault();
    fetchscadTagl(); 
  };

//fetch per prendere i dati del cliente
  const fetchCustomerData = async (customerId) => {
    try {
        const customerDoc = await getDoc(doc(db, "customersTab", customerId));
        if (customerDoc.exists()) {
            return { id: customerDoc.id, ...customerDoc.data() };
        } else {
            console.error("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error fetching customer data: ", error);
        return null;
    }
};

//fetch per prendere i dati del tagliando
const fetchscadTagl = async () => {
    setLoading(true); // Inizia il caricamento
    try {
        const scadRevCollection = collection(db, "veicoloTab");
        let scadRevQuery;

        const startOfMonth = moment(`${filtroAnno}-${filtroMese}-01`).startOf('month').toDate();
        const endOfMonth = moment(`${filtroAnno}-${filtroMese}-01`).endOf('month').toDate();

        if (filtroConferma === 1) { // Non confermate
            scadRevQuery = query(
                scadRevCollection,
                where("scadenzario.tagliando.dataScadenza", ">=", startOfMonth),
                where("scadenzario.tagliando.dataScadenza", "<=", endOfMonth),
                where("scadenzario.tagliando.conferma", "==", false),
                orderBy("scadenzario.tagliando.dataScadenza", "asc"),
                limit(100)
            );
        } else if (filtroConferma === 2) { // Confermate
            scadRevQuery = query(
                scadRevCollection,
                where("scadenzario.tagliando.dataScadenza", ">=", startOfMonth),
                where("scadenzario.tagliando.dataScadenza", "<=", endOfMonth),
                where("scadenzario.tagliando.conferma", "==", true),
                orderBy("scadenzario.tagliando.dataScadenza", "asc"),
                limit(100)
            );
        } else if (filtroConferma === 0) { // Tutte
            scadRevQuery = query(
                scadRevCollection,
                where("scadenzario.tagliando.dataScadenza", ">=", startOfMonth),
                where("scadenzario.tagliando.dataScadenza", "<=", endOfMonth),
                orderBy("scadenzario.tagliando.dataScadenza", "asc"),
                limit(100)
            );
        }

        const scadRevnapshot = await getDocs(scadRevQuery);
        const workCardList = await Promise.all(
            scadRevnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const customerData = await fetchCustomerData(data.idCustomer);
                return {
                    id: doc.id,
                    ...data,
                    dataScadenzaTagliando: data.scadenzario.tagliando.dataScadenza,
                    username: customerData.username,
                    telefono: customerData.telefono,
                    conferma: data.scadenzario.tagliando.conferma, 
                    customerData,
                };
            })
        );
        setScadRev(workCardList);
    } catch (error) {
        console.error("Errore nel recupero dei tagliandi: ", error);
    } finally {
        setLoading(false); // Ferma il caricamento
    }
};


  useEffect(() => {
    fetchscadTagl(); // Fetch iniziale senza ricerca
  }, []);
//--------------------------------------------------

  const handleRowSelectionChange = (newSelection) => {
    setSelectedScadRevIds(newSelection);
  };


  const handleRowClick = (id) => {
    navigate(`/aggiungischeda1/${id}`);
  };


  //columns-----------------------------------------------------------------------------------
const columns = [
    {
        field: "id",
        headerName: "ID",
        width: 70,
        renderCell: (params) => (
            <span
                className="p-1 rounded-4"
                style={{ cursor: "pointer", backgroundColor: "#224072" }}
                onClick={() => handleRowClick(params.row.id)}
            >
                {params.row.id}
            </span>
        ),
    },
    { field: "targa", headerName: "Targa", width: 130 },
    { field: "nomeModello", headerName: "Veicolo", width: 130 },
    {
        field: "username",
        headerName: "Username",
        width: 130,
        renderCell: (params) => (
            <span
                className="p-1 rounded-4"
                style={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={() => {
                    navigate("/dashboardcustomer/" + params.row.idCustomer);
                }}
            >
                {params.row.username}
            </span>
        ),
    },
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
                <IconButton
                    onClick={() => handleWhatsApp(params.value)}
                    aria-label="send WhatsApp message"
                    size="small"
                    sx={{ padding: 0 }}
                >
                    <WhatsAppIcon />
                </IconButton>
            </div>
        ),
    },
    {
        field: "dataScadenzaTagliando",
        headerName: "Data di Scadenza",
        width: 130,
        renderCell: (params) => {
            const date = params.value ? moment(params.value.toDate()) : null;
            return date && date.isValid() ? date.format("DD/MM/YYYY") : "N/A";
        },
    },
    {
        field: "conferma",
        headerName: "Conferma",
        width: 130,
        renderCell: (params) => (
            <Switch
                checked={params.value}
                color="success"
                inputProps={{ 'aria-label': 'controlled' }}
                onChange={(event) => handleConfermaChange(params.row.id, event.target.checked)}
            />
        ),
    }
];
//----------------------------------------------------------------------------------------
const handleConfermaChange = async (id, newValue) => {
    try {
        const scadRevDoc = doc(db, "veicoloTab", id);
        await updateDoc(scadRevDoc, {
            "scadenzario.tagliando.conferma": newValue,
        });
        setScadRev((prevScadRev) =>
            prevScadRev.map((item) =>
                item.id === id ? { ...item, conferma: newValue } : item
            )
        );
    } catch (error) {
        console.error("Errore durante l'aggiornamento della conferma: ", error);
    }
};

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0 titlePage">Scadenzario Tagliando</h2>
          </div>

          <div className="d-flex align-items-center justify-content-between mt-4">
            <div
              className="d-flex align-items-center"
            >
            <FormControl fullWidth variant="outlined" style={{width: "200px", marginRight: "10px"}}>
                <InputLabel id="dropdown-label">Confermate</InputLabel>
                <Select
                    labelId="dropdown-label"
                    id="dropdown"
                    value={filtroConferma}
                    onChange={handleChange}
                    label="Seleziona un valore"
                >
                    {/* Lista dei valori predefiniti */}
                    <MenuItem value={0}>Tutte</MenuItem>
                    <MenuItem value={1}>Non Confermate</MenuItem>
                    <MenuItem value={2}>Confermate</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth variant="outlined" style={{width: "150px", marginRight: "10px"}}>
                <InputLabel id="dropdown-label">Mese</InputLabel>
                <Select
                    labelId="dropdown-label"
                    id="dropdown"
                    value={filtroMese}
                    onChange={handleChangeMese}
                    label="Seleziona un valore"
                >
                    <MenuItem value={1}>1|Gennaio</MenuItem>
                    <MenuItem value={2}>2|Febbraio</MenuItem>
                    <MenuItem value={3}>3|Marzo</MenuItem>
                    <MenuItem value={4}>4|Aprile</MenuItem>
                    <MenuItem value={5}>5|Maggio</MenuItem>
                    <MenuItem value={6}>6|Giugno</MenuItem>
                    <MenuItem value={7}>7|Luglio</MenuItem>
                    <MenuItem value={8}>8|Agosto</MenuItem>
                    <MenuItem value={9}>9|Settembre</MenuItem>
                    <MenuItem value={10}>10|Ottobre</MenuItem>
                    <MenuItem value={11}>11|Novembre</MenuItem>
                    <MenuItem value={12}>12|Dicembre</MenuItem>
                </Select>
            </FormControl>
            <TextField
                label="Anno"
                variant="outlined"
                value={filtroAnno}
                onChange={(e) => setFiltroAnno(e.target.value)}
                className="me-2"
                style={{width: "100px"}}
            />
              <Button
                className="me-2"
                onClick={handleSearch}
                color="primary"
                variant="contained"
              >
                Cerca
              </Button>
            </div>
            <div className="d-flex align-items-center">
              <IconButton variant="contained" onClick={() => {fetchscadTagl()}}>
                <RefreshIcon/>
              </IconButton>
            </div>
          </div>

          <ThemeProvider theme={theme}>
            <Paper
              className="mt-4"
              sx={{ height: "50vh", borderRadius: "8px", overflowX: "auto" }}
            >
              {loading ? ( // Mostra il caricamento se loading è true
                <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                  <CircularProgress />
                </div>
              ) : (
                <StyledDataGrid
                  rows={scadRev}
                  columns={columns}
                  checkboxSelection
                  disableRowSelectionOnClick
                  onRowSelectionModelChange={handleRowSelectionChange}
                  localeText={itIT.components.MuiDataGrid.defaultProps.localeText}
                />
              )}
            </Paper>
          </ThemeProvider>
        </div>
      </motion.div>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle style={{ backgroundColor: "#1E1E1E" }}>
          Conferma Eliminazione
        </DialogTitle>
        <DialogContent style={{ backgroundColor: "#1E1E1E" }}>
          <DialogContentText>
            Sei sicuro di voler eliminare {selectedScadRevIds.length} scheda
            {selectedScadRevIds.length > 1 ? "e" : ""} selezionata
            {selectedScadRevIds.length > 1 ? "e" : ""}?
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ backgroundColor: "#1E1E1E" }}>
          <Button onClick={() => setConfirmOpen(false)} color="primary">
            Annulla
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
}
