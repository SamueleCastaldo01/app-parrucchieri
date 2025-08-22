import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Switch,
  FormControlLabel,
  Stack,
  Chip,
  Tooltip,
} from "@mui/material";
import SaveIcon from '@mui/icons-material/Save';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CircularProgress from "@mui/material/CircularProgress";
import { db } from '../firebase-config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import dayjs from "dayjs";
import { errorNoty, successNoty } from '../components/Notify';

const PRIMARY = "#3a51b0";

export function ConfigStore() {
  const [orariDiLavoro, setOrariDiLavoro] = useState({
    lunedi:    { inizio: "9:00",  fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
    martedi:   { inizio: "9:00",  fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
    mercoledi: { inizio: "9:00",  fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
    giovedi:   { inizio: "9:00",  fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
    venerdi:   { inizio: "9:00",  fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
    sabato:    { inizio: "9:00",  fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
    domenica:  { inizio: "9:00",  fine: "19:00", chiuso: true,  pausaPranzo: { inizio: null,   fine: null    } },
  });
  const [ferie, setFerie] = useState({ inizio: null, fine: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const configDocRef = doc(db, "configstore", "storeConfig");
        const snap = await getDoc(configDocRef);
        if (snap.exists()) {
          const data = snap.data();
          setOrariDiLavoro(prev =>
            Object.keys(prev).reduce((acc, g) => {
              acc[g] = {
                ...prev[g],
                ...data.orariDiLavoro?.[g],
                pausaPranzo: {
                  inizio: data.orariDiLavoro?.[g]?.pausaPranzo?.inizio ?? prev[g].pausaPranzo.inizio,
                  fine:   data.orariDiLavoro?.[g]?.pausaPranzo?.fine   ?? prev[g].pausaPranzo.fine,
                },
              };
              return acc;
            }, {})
          );
          setFerie(data.ferie || ferie);
        }
      } catch (e) {
        console.error(e);
        errorNoty("Errore nel caricamento della configurazione.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePausaPranzoChange = (giorno, tipo, valore) => {
    setOrariDiLavoro(prev => ({
      ...prev,
      [giorno]: {
        ...prev[giorno],
        pausaPranzo: { ...prev[giorno].pausaPranzo, [tipo]: valore ? valore.format("HH:mm") : null },
      },
    }));
  };

  const handleOrariChange = (giorno, tipo, valore) => {
    setOrariDiLavoro(prev => ({
      ...prev,
      [giorno]: { ...prev[giorno], [tipo]: valore ? valore.format("HH:mm") : null },
    }));
  };

  const handleChiusoChange = (giorno) => {
    setOrariDiLavoro(prev => ({
      ...prev,
      [giorno]: {
        ...prev[giorno],
        chiuso: !prev[giorno].chiuso,
        // se chiuso, azzero gli orari per chiarezza
        ...(prev[giorno].chiuso
          ? {}
          : { inizio: null, fine: null, pausaPranzo: { inizio: null, fine: null } }),
      },
    }));
  };

  const handleFerieChange = (campo, valore) => {
    setFerie(prev => ({ ...prev, [campo]: valore ? valore.format("DD-MM-YYYY") : null }));
  };

  const validateOrari = () => {
    for (const giorno in orariDiLavoro) {
      const cfg = orariDiLavoro[giorno];
      if (!cfg.chiuso) {
        const inizio = dayjs(cfg.inizio, "HH:mm");
        const fine = dayjs(cfg.fine, "HH:mm");
        const pausaInizio = dayjs(cfg.pausaPranzo.inizio, "HH:mm");
        const pausaFine = dayjs(cfg.pausaPranzo.fine, "HH:mm");

        if (!inizio.isValid() || !fine.isValid()) {
          errorNoty(`Orario di inizio o fine non valido per ${giorno}`);
          return false;
        }
        if (!fine.isAfter(inizio)) {
          errorNoty(`L'orario di fine deve essere maggiore dell'inizio per ${giorno}`);
          return false;
        }
        if (pausaInizio.isValid() && pausaFine.isValid()) {
          if (pausaInizio.isBefore(inizio) || pausaFine.isAfter(fine)) {
            errorNoty(`La pausa pranzo deve essere compresa tra inizio e fine per ${giorno}`);
            return false;
          }
          if (pausaFine.isBefore(pausaInizio)) {
            errorNoty(`La fine della pausa non può essere minore dell'inizio per ${giorno}`);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateOrari()) return;
    try {
      const ref = doc(db, "configstore", "storeConfig");
      await setDoc(ref, {
        orariDiLavoro,
        ferie,
        dataUltimaModifica: Timestamp.fromDate(new Date()),
      }, { merge: true });
      successNoty("Configurazione salvata con successo!");
    } catch (e) {
      console.error(e);
      errorNoty("Errore nella modifica della configurazione.");
    }
  };

  if (loading) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <CircularProgress color="primary" />
    </Box>
  );
}

  const giorni = ["lunedi","martedi","mercoledi","giovedi","venerdi","sabato","domenica"];
  const nice = (g) => g.charAt(0).toUpperCase() + g.slice(1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
      <Container maxWidth="xl" sx={{ pt: 3, pb: 4 }}>
        {/* Header sticky azioni */}
        <Box 
          sx={{
            position: "sticky",
            top: 64, // sotto l’AppBar
            zIndex: 1,
            backdropFilter: "blur(6px)",
            background: "rgba(255,255,255,0.7)",
            borderRadius: 2,
            px: 2,
            py: 1.5,
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 800, color: PRIMARY }}>
            Configura il tuo Store
          </Typography>
          <Button
            onClick={handleSubmit}
            startIcon={<SaveIcon />}
            variant="contained"
            sx={{ bgcolor: PRIMARY, "&:hover": { bgcolor: "#2f4098" }, borderRadius: 2, px: 2.5 }}
          >
            Salva
          </Button>
        </Box>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={3}>
            {/* Orari di lavoro */}
            <Grid item xs={12} md={9}>
              <Card sx={{ borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
                <CardHeader
                  avatar={<AccessTimeIcon htmlColor={PRIMARY} />}
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY }}>
                      Orari di lavoro negozio
                    </Typography>
                  }
                  subheader="Imposta orari e pause per ciascun giorno"
                />
                <Divider />
                <CardContent sx={{ pt: 2 }}>
                  <Stack spacing={1.5}>
                    {giorni.map((giorno) => {
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
                                gap: 1,
                            }}
                            >
                            {/* Nome giorno + stato */}
                            <Box sx={{ minWidth: 120 /* <- prima 160 */ }}>
                                <Typography sx={{ fontWeight: 700 }}>{nice(giorno)}</Typography>
                                <Chip
                                size="small"
                                label={isClosed ? "Chiuso" : "Aperto"}
                                color={isClosed ? "default" : "success"}
                                variant={isClosed ? "outlined" : "filled"}
                                sx={{ mt: 0.5 }}
                                />
                            </Box>

                            {/* Switch chiuso/aperto compatto */}
                            <FormControlLabel
                                sx={{ mr: 1, ml: 0 }}     // <- meno spazio
                                control={
                                <Switch
                                    size="small"           // <- compatto
                                    checked={g.chiuso}
                                    onChange={() => handleChiusoChange(giorno)}
                                />
                                }
                                label="Chiuso"
                            />

                            {/* Orari (disabilitati se chiuso) */}
                            <Grid container spacing={1} sx={{ flex: 1, minWidth: 360 }}>
                                <Grid item xs={6} md={3}>
                                <TimePicker
                                    label="Inizio"
                                    value={g.inizio ? dayjs(g.inizio, "HH:mm") : null}
                                    onChange={(v) => handleOrariChange(giorno, "inizio", v)}
                                    ampm={false}
                                    disabled={isClosed}
                                    slotProps={{ textField: { size: "small", fullWidth: true } }}
                                />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                <TimePicker
                                    label="Pausa inizio"
                                    value={g.pausaPranzo.inizio ? dayjs(g.pausaPranzo.inizio, "HH:mm") : null}
                                    onChange={(v) => handlePausaPranzoChange(giorno, "inizio", v)}
                                    ampm={false}
                                    disabled={isClosed}
                                    slotProps={{ textField: { size: "small", fullWidth: true } }}
                                />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                <TimePicker
                                    label="Pausa fine"
                                    value={g.pausaPranzo.fine ? dayjs(g.pausaPranzo.fine, "HH:mm") : null}
                                    onChange={(v) => handlePausaPranzoChange(giorno, "fine", v)}
                                    ampm={false}
                                    disabled={isClosed}
                                    slotProps={{ textField: { size: "small", fullWidth: true } }}
                                />
                                </Grid>
                                <Grid item xs={6} md={3}>
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

                            {/* Suggerimento inline */}
                            {!isClosed && (
                                <Tooltip title="La pausa (se impostata) deve essere all’interno degli orari di apertura." placement="top">
                                <Chip size="small" label="Suggerimento" variant="outlined" />
                                </Tooltip>
                            )}
                            </Box>

                      );
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Ferie */}
            <Grid item xs={12} md={3}>
              <Card sx={{ borderRadius: 3, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}>
                <CardHeader
                  avatar={<BeachAccessIcon htmlColor={PRIMARY} />}
                  title={
                    <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY }}>
                      Ferie / Chiusure
                    </Typography>
                  }
                  subheader="Imposta un intervallo di chiusura"
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12}>
                      <DatePicker
                        label="Data inizio ferie"
                        value={ferie.inizio ? dayjs(ferie.inizio, "DD-MM-YYYY") : null}
                        onChange={(v) => handleFerieChange("inizio", v)}
                        slotProps={{ textField: { fullWidth: true, size: "small" } }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DatePicker
                        label="Data fine ferie"
                        value={ferie.fine ? dayjs(ferie.fine, "DD-MM-YYYY") : null}
                        onChange={(v) => handleFerieChange("fine", v)}
                        slotProps={{ textField: { fullWidth: true, size: "small" } }}
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Se imposti ferie, il sistema considera questi giorni come non prenotabili.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Container>
    </motion.div>
  );
}
