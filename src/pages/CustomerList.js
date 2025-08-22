// pages/CustomerList.jsx
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
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt"; // ✅ icona clienti

import { useState, useEffect } from "react";
import { db } from "../firebase-config";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

import { StyledDataGrid, theme, PRIMARY } from "../components/StyledDataGrid";
import { itIT } from "@mui/x-data-grid/locales";

export function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState([]);

  // search state
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

  const fetchCustomers = async (type) => {
    try {
      setLoading(true);
      const customerCollection = collection(db, "user");

      let q;
      if (searchPhone && (type === "phone" || searchType === "telefono")) {
        q = query(customerCollection, where("telefono", "==", searchPhone));
      } else if (searchNome && (type === "nome" || searchType === "nome")) {
        q = query(customerCollection, where("nome", "==", searchNome));
      } else if (searchCognome && (type === "cognome" || searchType === "cognome")) {
        q = query(customerCollection, where("cognome", "==", searchCognome));
      } else {
        q = query(customerCollection, orderBy("dataCreazione", "desc"), limit(200));
      }

      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCustomers(list);
    } catch (error) {
      console.error("Errore nel recupero dei clienti:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRowSelectionChange = (model) => setSelectedCustomerIds(model);

  const handleResetSearch = () => {
    setSearchCognome("");
    setSearchNome("");
    setSearchPhone("");
    fetchCustomers("");
  };

  const columns = [
    { field: "id", headerName: "ID", width: 80 },
    { field: "email", headerName: "Email", width: 220 },
    { field: "nome", headerName: "Nome", width: 160 },
    { field: "cognome", headerName: "Cognome", width: 160 },
    { field: "telefono", headerName: "Telefono", minWidth: 160, flex: 1 },
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
                  borderRadius: 2,
                  background: "rgba(58,81,176,0.1)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <PeopleAltIcon htmlColor={PRIMARY} /> {/* ✅ sostituita qui */}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>
                Anagrafica Clienti
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Ricarica">
                <IconButton onClick={handleResetSearch}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
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
                  if (searchType === "telefono") return fetchCustomers("phone");
                  if (searchType === "nome") return fetchCustomers("nome");
                  if (searchType === "cognome") return fetchCustomers("cognome");
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
            {loading ? (
              <Box sx={{ display: "grid", placeItems: "center", height: "100%" }}>
                <CircularProgress />
              </Box>
            ) : (
              <StyledDataGrid
                rows={customers}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                onRowSelectionModelChange={setSelectedCustomerIds}
                localeText={itIT.components.MuiDataGrid.defaultProps.localeText}
              />
            )}
          </Paper>

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={2000}
            onClose={() => setSnackbarOpen(false)}
            message="Azione completata!"
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          />
        </Container>
      </motion.div>
    </ThemeProvider>
  );
}
