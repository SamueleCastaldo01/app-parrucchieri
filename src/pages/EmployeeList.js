// pages/EmployeeList.jsx
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
  Snackbar,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Tooltip,
  Switch,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import Diversity3Icon from "@mui/icons-material/Diversity3";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../firebase-config";
import { collection, getDocs, deleteDoc, doc, orderBy, query, where, limit } from "firebase/firestore";

import { StyledDataGrid, theme, PRIMARY } from "../components/StyledDataGrid";
import { itIT } from "@mui/x-data-grid/locales";
import { EditiDipendente } from "../components/EditiDipendente";

export function EmployeeList() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // search
  const [searchPhone, setSearchPhone] = useState("");
  const [searchNome, setSearchNome] = useState("");
  const [searchCognome, setSearchCognome] = useState("");
  const [searchType, setSearchType] = useState("nome");

  const capitalizeWords = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const fetchemployee = async (type) => {
    try {
      setLoading(true);
      const col = collection(db, "employee");

      let q;
      if (searchPhone && (type === "phone" || searchType === "telefono")) {
        q = query(col, where("telefono", "==", searchPhone));
      } else if (searchNome && (type === "nome" || searchType === "nome")) {
        q = query(col, where("nome", "==", searchNome));
      } else if (searchCognome && (type === "cognome" || searchType === "cognome")) {
        q = query(col, where("cognome", "==", searchCognome));
      } else {
        q = query(col, orderBy("dataCreazione", "desc"), limit(200));
      }

      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEmployee(list);
    } catch (e) {
      console.error("Errore nel recupero dipendenti:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchemployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRowSelectionChange = (model) => setSelectedIds(model);

  const handleEdit = () => {
    if (selectedIds.length === 1) {
      setEditId(selectedIds[0]);
      setEditOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      await Promise.all(selectedIds.map((id) => deleteDoc(doc(db, "employee", id))));
      setEmployee((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
      setSnackbarOpen(true);
    } catch (e) {
      console.error("Errore eliminazione dipendenti:", e);
    } finally {
      setConfirmOpen(false);
      setSelectedIds([]);
    }
  };

  const handleResetSearch = () => {
    setSearchCognome("");
    setSearchNome("");
    setSearchPhone("");
    fetchemployee("");
  };

  const handleTogglePassword = (id) =>
    setShowPassword((prev) => ({ ...prev, [id]: !prev[id] }));

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    {
      field: "username",
      headerName: "Username",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
          <Button
            variant="text"
            size="small"
            sx={{ textTransform: "none", px: 0 }}
            onClick={() => navigate("/dashboardcustomer/" + params.row.id)}
          >
            {params.value}
          </Button>
        </Box>
      ),
    },
    {
      field: "password",
      headerName: "Password",
      width: 180,
      renderCell: (params) => {
        const visible = !!showPassword[params.row.id];
        return (
          <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{visible ? params.value : "*********"}</span>
            <IconButton
              onClick={() => handleTogglePassword(params.row.id)}
              size="small"
              sx={{ p: 0 }}
            >
              {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </Box>
        );
      },
      sortable: false,
      filterable: false,
    },
    { field: "nome", headerName: "Nome", width: 160 },
    { field: "cognome", headerName: "Cognome", width: 160 },
    { field: "email", headerName: "Email", width: 220 },
    {
      field: "telefono",
      headerName: "Telefono",
      minWidth: 160,
      flex: 1, // riempie lo spazio -> niente filler a destra
    },
  ];

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
                  borderRadius: 1,
                  background: "rgba(58,81,176,0.1)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Diversity3Icon htmlColor={PRIMARY} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>
                Anagrafica Dipendenti
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Ricarica">
                <IconButton onClick={handleResetSearch}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: "#2f4098" } }}
                onClick={() => navigate("/employeeadd")}
              >
                Aggiungi
              </Button>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                disabled={selectedIds.length !== 1}
              >
                Modifica
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmOpen(true)}
                disabled={selectedIds.length === 0}
              >
                Elimina {selectedIds.length > 0 && `(${selectedIds.length})`}
              </Button>
            </Stack>
          </Box>

          {/* Ricerca */}
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
              mb: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Typography variant="subtitle2" sx={{ minWidth: 120, color: "text.secondary" }}>
                Ricerca per:
              </Typography>

              <Button
                size="small"
                variant={searchType === "nome" ? "contained" : "outlined"}
                onClick={() => setSearchType("nome")}
                sx={{ textTransform: "none" }}
              >
                Nome
              </Button>
              <Button
                size="small"
                variant={searchType === "cognome" ? "contained" : "outlined"}
                onClick={() => setSearchType("cognome")}
                sx={{ textTransform: "none" }}
              >
                Cognome
              </Button>
              <Button
                size="small"
                variant={searchType === "telefono" ? "contained" : "outlined"}
                onClick={() => setSearchType("telefono")}
                sx={{ textTransform: "none" }}
              >
                Telefono
              </Button>

              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchType === "telefono") return fetchemployee("phone");
                  if (searchType === "nome") return fetchemployee("nome");
                  if (searchType === "cognome") return fetchemployee("cognome");
                }}
                sx={{ display: "flex", gap: 1, flexGrow: 1 }}
              >
                {searchType === "telefono" && (
                  <TextField
                    size="small"
                    label="Cerca per telefono"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    sx={{ maxWidth: 260 }}
                  />
                )}

                {searchType === "nome" && (
                  <TextField
                    size="small"
                    label="Cerca per nome"
                    value={searchNome}
                    onChange={(e) => setSearchNome(capitalizeWords(e.target.value))}
                    sx={{ maxWidth: 260 }}
                  />
                )}

                {searchType === "cognome" && (
                  <TextField
                    size="small"
                    label="Cerca per cognome"
                    value={searchCognome}
                    onChange={(e) => setSearchCognome(capitalizeWords(e.target.value))}
                    sx={{ maxWidth: 260 }}
                  />
                )}

                <Button type="submit" variant="outlined" startIcon={<SearchIcon />}>
                  Cerca
                </Button>
                <Button variant="text" onClick={handleResetSearch}>
                  Reset
                </Button>
              </Box>
            </Stack>
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
            <StyledDataGrid
              rows={employee}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={setSelectedIds}
              loading={loading}
              localeText={itIT.components.MuiDataGrid.defaultProps.localeText}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </Paper>

          {/* Snackbar */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={2000}
            onClose={() => setSnackbarOpen(false)}
            message="Dipendente eliminato!"
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          />

          {/* Dialog conferma eliminazione */}
          <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {`Sei sicuro di voler eliminare ${selectedIds.length} dipendente${
                  selectedIds.length > 1 ? "i" : ""
                } selezionato${selectedIds.length > 1 ? "i" : ""}?`}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmOpen(false)}>Annulla</Button>
              <Button onClick={handleDelete} color="error">
                Elimina
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog modifica */}
          <Dialog maxWidth="md" fullWidth open={editOpen} onClose={() => setEditOpen(false)}>
            <DialogTitle>Modifica Dipendente</DialogTitle>
            <DialogContent dividers>
              <EditiDipendente
                fetchemployee={fetchemployee}
                customerId={editId}
                onClose={() => setEditOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </Container>
      </motion.div>
    </ThemeProvider>
  );
}
