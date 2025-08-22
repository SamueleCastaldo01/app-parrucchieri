// pages/ServiziList.jsx
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
import ContentCutIcon from "@mui/icons-material/ContentCut";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { db } from "../firebase-config";
import { collection, getDocs, deleteDoc, doc, orderBy, query, where, limit, updateDoc } from "firebase/firestore";

import { StyledDataGrid, theme, PRIMARY } from "../components/StyledDataGrid";
import { EditService } from "../components/EditService";

export function ServiziList() {
  const navigate = useNavigate();

  const [servizi, setServizi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const [searchServizio, setSearchServizio] = useState("");
  const [searchType, setSearchType] = useState("servizio");

  const capitalizeWords = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  const fetchServizi = async (type) => {
    try {
      setLoading(true);
      const colRef = collection(db, "service");

      let q;
      if (searchServizio && (type === "servizio" || searchType === "servizio")) {
        // match esatto sul campo "servizio"
        q = query(colRef, where("servizio", "==", searchServizio));
      } else {
        q = query(colRef, orderBy("dataCreazione", "desc"), limit(200));
      }

      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setServizi(list);
    } catch (e) {
      console.error("Errore nel recupero servizi:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServizi();
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
      await Promise.all(selectedIds.map((id) => deleteDoc(doc(db, "service", id))));
      setServizi((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
      setSnackbarOpen(true);
    } catch (e) {
      console.error("Errore eliminazione servizi:", e);
    } finally {
      setConfirmOpen(false);
      setSelectedIds([]);
    }
  };

  const handleToggleDefault = async (id) => {
    try {
      const current = servizi.find((s) => s.id === id);
      if (current?.isDefault) return;

      const previous = servizi.find((s) => s.isDefault);
      if (previous) {
        await updateDoc(doc(db, "service", previous.id), { isDefault: false });
      }
      await updateDoc(doc(db, "service", id), { isDefault: true });

      setServizi((prev) =>
        prev.map((s) => ({ ...s, isDefault: s.id === id }))
      );
    } catch (e) {
      console.error("Errore toggle default:", e);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    {
      field: "isDefault",
      headerName: "Predefinito",
      width: 130,
      renderCell: (params) => (
        <Switch
          checked={!!params.value}
          onChange={() => handleToggleDefault(params.id)}
          color="primary"
          size="small"
        />
      ),
      sortable: false,
      filterable: false,
    },
    { field: "servizio", headerName: "Servizio", width: 240 },
    { field: "durata", headerName: "Durata (min)", width: 130 },
    { field: "prezzo", headerName: "Prezzo (€)", width: 120 },
    {
      field: "dipendentiAssegnati",
      headerName: "Dipendenti Assegnati",
      flex: 1,
      minWidth: 220,
      renderCell: (params) => {
        const v = params.value;
        const display = Array.isArray(v) ? v.join(", ") : v || "—";
        return (
          <Box sx={{ maxHeight: 48, overflowY: "auto", whiteSpace: "pre-wrap" }}>
            {display}
          </Box>
        );
      },
      sortable: false,
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
                  <ContentCutIcon htmlColor={PRIMARY} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>
                  Servizi
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1}>
                <Tooltip title="Ricarica">
                  <IconButton onClick={() => { fetchServizi(""); setSearchServizio(""); }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: "#2f4098" } }}
                  onClick={() => navigate("/serviziadd")}
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
                variant={searchType === "servizio" ? "contained" : "outlined"}
                onClick={() => setSearchType("servizio")}
                sx={{ textTransform: "none" }}
              >
                Servizio
              </Button>

              <Box component="form" onSubmit={(e) => { e.preventDefault(); fetchServizi("servizio"); }} sx={{ display: "flex", gap: 1, flexGrow: 1 }}>
                <TextField
                  size="small"
                  label="Cerca per servizio"
                  value={searchServizio}
                  onChange={(e) => setSearchServizio(capitalizeWords(e.target.value))}
                  sx={{ maxWidth: 260 }}
                />
                <Button
                  type="submit"
                  variant="outlined"
                  startIcon={<SearchIcon />}
                >
                  Cerca
                </Button>
                <Button
                  variant="text"
                  onClick={() => { setSearchServizio(""); fetchServizi(""); }}
                >
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
              rows={servizi}
              columns={columns}
              checkboxSelection
              disableRowSelectionOnClick
              onRowSelectionModelChange={setSelectedIds}
              loading={loading}
              localeText={{
                // italiano base
                noRowsLabel: "Nessun dato",
                footerRowSelected: (count) => `${count.toLocaleString()} selezionate`,
              }}
              // opzionale: pagina + dimensioni
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
            message="Servizio eliminato!"
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          />

          {/* Dialog conferma */}
          <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
            <DialogTitle>Conferma Eliminazione</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {`Sei sicuro di voler eliminare ${selectedIds.length} servizio${selectedIds.length > 1 ? "i" : ""} selezionato${selectedIds.length > 1 ? "i" : ""}?`}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmOpen(false)}>Annulla</Button>
              <Button onClick={handleDelete} color="error">Elimina</Button>
            </DialogActions>
          </Dialog>

          {/* Dialog modifica */}
          <Dialog maxWidth="md" fullWidth open={editOpen} onClose={() => setEditOpen(false)}>
            <DialogTitle>Modifica Servizio</DialogTitle>
            <DialogContent dividers>
              <EditService
                fetchservizi={fetchServizi}
                serviceId={editId}
                onClose={() => setEditOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </Container>
      </motion.div>
    </ThemeProvider>
  );
}
