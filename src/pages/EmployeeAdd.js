// pages/EmployeeAdd.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Grid,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Collapse,
  Stack,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tooltip,
} from "@mui/material";

import BadgeIcon from "@mui/icons-material/Badge";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RefreshIcon from "@mui/icons-material/Refresh";

import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import { db } from "../firebase-config";
import { collection, addDoc, query, where, getDocs, Timestamp } from "firebase/firestore";
import { errorNoty, successNoty } from "../components/Notify";

const PRIMARY = "#3a51b0";

export function EmployeeAdd() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [avatar, setAvatar] = useState("");
  const [nomeRuolo, setNomeRuolo] = useState("Barbiere");
  const [gender, setGender] = useState("");
  const [password, setPassword] = useState("12345678");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  const [showOptional, setShowOptional] = useState(false);
  const [showWorkHours, setShowWorkHours] = useState(false);

  const [orariDiLavoro, setOrariDiLavoro] = useState({
    lunedi: { inizio: "09:00", fine: "19:00", chiuso: false },
    martedi: { inizio: "09:00", fine: "19:00", chiuso: false },
    mercoledi: { inizio: "09:00", fine: "19:00", chiuso: false },
    giovedi: { inizio: "09:00", fine: "19:00", chiuso: false },
    venerdi: { inizio: "09:00", fine: "19:00", chiuso: false },
    sabato: { inizio: "09:00", fine: "19:00", chiuso: false },
    domenica: { inizio: "09:00", fine: "19:00", chiuso: true },
  });

  // opzionale se in futuro userai ferie a persona
  const [ferie] = useState([]);

  const giorniSettimana = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"];
  const labelGiorno = (g) => g.charAt(0).toUpperCase() + g.slice(1);

  const capitalizeWords = (str) =>
    str
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Carica config store per precompilare orari se presente
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configRef = collection(db, "configstore");
        const snap = await getDocs(configRef);
        if (!snap.empty) {
          const data = snap.docs[0].data();
          if (data.orariDiLavoro) setOrariDiLavoro(data.orariDiLavoro);
        }
      } catch (e) {
        console.error("Errore nel recupero di configStore:", e);
      }
    };
    fetchConfig();
  }, []);

  const handleOrariChange = (giorno, tipo, valore) => {
    setOrariDiLavoro((prev) => ({
      ...prev,
      [giorno]: { ...prev[giorno], [tipo]: valore ? valore.format("HH:mm") : null },
    }));
  };

  const handleChiusoChange = (giorno) => {
    setOrariDiLavoro((prev) => ({
      ...prev,
      [giorno]: {
        inizio: null,
        fine: null,
        chiuso: !prev[giorno].chiuso,
      },
    }));
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setNome("");
    setCognome("");
    setGender("");
    setTelefono("");
    setEmail("");
    setAvatar("");
    setNomeRuolo("Barbiere");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // controllo univocità username
      const userRef = collection(db, "employee");
      const q = query(userRef, where("username", "==", username));
      const exists = await getDocs(q);
      if (!username.trim()) {
        errorNoty("Inserisci un username.");
        return;
      }
      if (!exists.empty) {
        errorNoty("Questo username è già registrato. Scegli un altro username.");
        return;
      }

      await addDoc(userRef, {
        username,
        password,
        nome,
        cognome,
        nomeRuolo,
        avatar,
        gender,
        telefono,
        email,
        orariDiLavoro,
        dataCreazione: Timestamp.fromDate(new Date()),
      });

      successNoty("Dipendente registrato con successo");
      resetForm();
      navigate("/employeelist");
    } catch (error) {
      console.error("Errore nell'aggiunta del dipendente: ", error);
      errorNoty("Errore durante il salvataggio.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        {/* Header pagina */}
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
              <BadgeIcon htmlColor={PRIMARY} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>
              Aggiungi Dipendente
            </Typography>
          </Stack>

          <Tooltip title="Reimposta campi">
            <IconButton onClick={resetForm}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={3}>
            {/* Card: Dati principali */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
                <CardHeader
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY }}>
                      Dati principali
                    </Typography>
                  }
                  subheader="Compila le informazioni essenziali del dipendente"
                />
                <Divider />
                <CardContent>
                  <Box component="form" onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="Username"
                          value={username}
                          onChange={(e) => setUsername(capitalizeWords(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          required
                          label="Nome ruolo"
                          value={nomeRuolo}
                          onChange={(e) => setNomeRuolo(capitalizeWords(e.target.value))}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="URL immagine profilo"
                          value={avatar}
                          onChange={(e) => setAvatar(e.target.value)}
                        />
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card: Campi facoltativi (collapse) */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
                <CardHeader
                  title={
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ cursor: "pointer" }}
                      onClick={() => setShowOptional((s) => !s)}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY }}>
                          Campi facoltativi
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Nome, cognome, genere e telefono (opzionali)
                        </Typography>
                      </Box>
                      <ExpandMoreIcon
                        sx={{
                          transition: "transform .2s",
                          transform: showOptional ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </Stack>
                  }
                />
                <Collapse in={showOptional} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Nome"
                          value={nome}
                          onChange={(e) => setNome(capitalizeWords(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Cognome"
                          value={cognome}
                          onChange={(e) => setCognome(capitalizeWords(e.target.value))}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel id="gender-label">Genere</InputLabel>
                          <Select
                            labelId="gender-label"
                            label="Genere"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                          >
                            <MenuItem value="maschio">Maschio</MenuItem>
                            <MenuItem value="femmina">Femmina</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          type="number"
                          label="Telefono"
                          value={telefono}
                          onChange={(e) => setTelefono(e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Collapse>
              </Card>
            </Grid>

            {/* Card: Orari di lavoro (collapse) */}
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
                <CardHeader
                  avatar={<AccessTimeIcon htmlColor={PRIMARY} />}
                  title={
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ cursor: "pointer" }}
                      onClick={() => setShowWorkHours((s) => !s)}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY }}>
                          Orari di lavoro
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Imposta gli orari per ciascun giorno
                        </Typography>
                      </Box>
                      <ExpandMoreIcon
                        sx={{
                          transition: "transform .2s",
                          transform: showWorkHours ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    </Stack>
                  }
                />
                <Collapse in={showWorkHours} timeout="auto" unmountOnExit>
                  <Divider />
                  <CardContent sx={{ pt: 2 }}>
                    <Stack spacing={1.25}>
                      {giorniSettimana.map((giorno) => {
                        const g = orariDiLavoro[giorno];
                        const isClosed = g.chiuso;
                        return (
                          <Box
                            key={giorno}
                            sx={{
                              p: 1.25,
                              borderRadius: 2,
                              border: "1px solid #eef0f6",
                              display: "flex",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 1.25,
                            }}
                          >
                            {/* Giorno + stato */}
                            <Box sx={{ minWidth: 160 }}>
                              <Typography sx={{ fontWeight: 700 }}>{labelGiorno(giorno)}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {isClosed ? "Chiuso" : "Aperto"}
                              </Typography>
                            </Box>

                            {/* Switch Chiuso */}
                            <FormControlLabel
                              control={
                                <Checkbox checked={isClosed} onChange={() => handleChiusoChange(giorno)} />
                              }
                              label="Chiuso"
                              sx={{ mr: 1 }}
                            />

                            {/* Orari */}
                            <Grid container spacing={1.25} sx={{ flex: 1, minWidth: 320 }}>
                              <Grid item xs={6} sm={3} md={2.5}>
                                <TimePicker
                                  label="Inizio"
                                  value={g.inizio ? dayjs(g.inizio, "HH:mm") : null}
                                  onChange={(v) => handleOrariChange(giorno, "inizio", v)}
                                  ampm={false}
                                  disabled={isClosed}
                                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                                />
                              </Grid>
                              <Grid item xs={6} sm={3} md={2.5}>
                                <TimePicker
                                  label="Fine"
                                  value={g.fine ? dayjs(g.fine, "HH:mm") : null}
                                  onChange={(v) => handleOrariChange(giorno, "fine", v)}
                                  ampm={false}
                                  disabled={isClosed}
                                  slotProps={{ textField: { size: "small", fullWidth: true } }}
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Collapse>
              </Card>
            </Grid>

            {/* Azioni */}
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate("/employeelist")}>
                  Annulla
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: "#2f4098" } }}
                >
                  Aggiungi
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Container>
    </motion.div>
  );
}
