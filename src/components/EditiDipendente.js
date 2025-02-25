import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography, FormControlLabel, Checkbox, Grid } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"; // Importa l'icona
import { db } from "../firebase-config";
import { doc, updateDoc, getDoc, query, collection, where, getDocs, Timestamp } from "firebase/firestore";
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import moment from "moment";
import { notifyErrorAddCliente, successUpdateCliente, notifyErrorAddUsername } from "./Notify";

export function EditiDipendente({ customerId, onClose, fetchemployee }) {
  const [gender, setGender] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [showOptionalFields, setShowOptionalFields] = useState(false); // Campi facoltativi
  const [showWorkHours, setShowWorkHours] = useState(false); // Sezione Orari di Lavoro
  const [showFerie, setShowFerie] = useState(false); // Sezione Ferie

  // Stato per gli orari di lavoro per ogni giorno della settimana
  const [orariDiLavoro, setOrariDiLavoro] = useState({
    lunedi: { inizio: "09:00", fine: "19:00", chiuso: false },
    martedi: { inizio: "09:00", fine: "19:00", chiuso: false },
    mercoledi: { inizio: "09:00", fine: "19:00", chiuso: false },
    giovedi: { inizio: "09:00", fine: "19:00", chiuso: false },
    venerdi: { inizio: "09:00", fine: "19:00", chiuso: false },
    sabato: { inizio: "09:00", fine: "19:00", chiuso: false },
    domenica: { inizio: "09:00", fine: "19:00", chiuso: true }
  });

  // Stato per le ferie (singolo periodo con data inizio e fine)
  const [ferie, setFerie] = useState({ inizio: "", fine: "" });

  // Array dei giorni per iterare la sezione orari
  const giorniSettimana = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"];

  useEffect(() => {
    const fetchEmployee = async () => {
      const customerDoc = await getDoc(doc(db, "employee", customerId));
      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        setUsername(customerData.username);
        setPassword(customerData.password);
        setNome(customerData.nome);
        setCognome(customerData.cognome);
        setGender(customerData.gender);
        setTelefono(customerData.telefono);
        setEmail(customerData.email);
        if (customerData.orariDiLavoro) {
          setOrariDiLavoro(customerData.orariDiLavoro);
        }
        if (customerData.ferie) {
          setFerie(customerData.ferie);
        }
      }
    };

    fetchEmployee();
  }, [customerId]);

  const handleOrariChange = (giorno, tipo, valore) => {
    setOrariDiLavoro(prev => ({
      ...prev,
      [giorno]: { 
        ...prev[giorno],
        [tipo]: valore ? valore.format("HH:mm") : null
      }
    }));
  };

  const handleChiusoChange = (giorno) => {
    setOrariDiLavoro(prev => ({
      ...prev,
      [giorno]: {
        inizio: null,
        fine: null,
        chiuso: !prev[giorno].chiuso
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await updateDoc(doc(db, "employee", customerId), {
        password,
        nome,
        cognome,
        gender,
        telefono,
        email,
        orariDiLavoro, // Aggiorna gli orari di lavoro
        ferie,         // Aggiorna le ferie
        dataCreazione: Timestamp.fromDate(new Date()),
      });
      successUpdateCliente();
      fetchemployee();
      onClose();
    } catch (error) {
      console.error("Errore nell'aggiornamento del dipendente: ", error);
    }
  };

  const checkUsernameExists = async (username) => {
    const q = query(collection(db, 'employee'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const capitalizeWords = (str) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="container-fluid">
        <h4>{username}</h4>
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Username e Password */}
            <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
              <TextField className="w-100" required label="Username" variant="outlined" value={username} disabled />
            </div>
            <div className="d-flex mt-4 col-lg-4 col-md-6 col-sm-12">
              <TextField className="w-100" required label="Password" variant="outlined" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {/* Sezione Campi Facoltativi */}
            <div className="mt-4 col-lg-12">
              <Typography variant="h6" onClick={() => setShowOptionalFields(!showOptionalFields)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                Campi Facoltativi
                {showOptionalFields ? <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon style={{ marginLeft: '8px' }} />}
              </Typography>
              <Collapse in={showOptionalFields}>
                <div className="row">
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField className="w-100" label="Email" variant="outlined" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField className="w-100" label="Nome" variant="outlined" value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField className="w-100" label="Cognome" variant="outlined" value={cognome} onChange={(e) => setCognome(e.target.value)} />
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <TextField className="w-100" label="Numero di Telefono" variant="outlined" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                  </div>
                  <div className="mt-4 col-lg-4 col-md-6 col-sm-12">
                    <FormControl fullWidth>
                      <InputLabel id="gender-select-label">Genere</InputLabel>
                      <Select labelId="gender-select-label" id="gender-select" value={gender} label="Genere" onChange={(e) => setGender(e.target.value)}>
                        <MenuItem value="maschio">Maschio</MenuItem>
                        <MenuItem value="femmina">Femmina</MenuItem>
                      </Select>
                    </FormControl>
                  </div>
                </div>
              </Collapse>
            </div>

            {/* Sezione Orari di Lavoro */}
            <div className="mt-5 col-lg-12">
              <Typography variant="h5" onClick={() => setShowWorkHours(!showWorkHours)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                Orari di Lavoro
                {showWorkHours ? <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon style={{ marginLeft: '8px' }} />}
              </Typography>
              <Collapse in={showWorkHours}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <div className="mt-2">
                    {giorniSettimana.map((giorno) => (
                      <Grid container spacing={2} key={giorno} alignItems="center" className="mt-2">
                        <Grid item xs={12} sm={3}>
                          <FormControlLabel
                            control={<Checkbox checked={orariDiLavoro[giorno].chiuso} onChange={() => handleChiusoChange(giorno)} />}
                            label={`${giorno.charAt(0).toUpperCase() + giorno.slice(1)} (${orariDiLavoro[giorno].chiuso ? "Chiuso" : "Aperto"})`}
                          />
                        </Grid>
                        {!orariDiLavoro[giorno].chiuso && (
                          <>
                            <Grid item xs={6} sm={3}>
                              <TimePicker
                                label="Inizio"
                                value={orariDiLavoro[giorno].inizio ? dayjs(orariDiLavoro[giorno].inizio, "HH:mm") : null}
                                onChange={(newValue) => handleOrariChange(giorno, 'inizio', newValue)}
                                renderInput={(params) => <TextField {...params} />}
                                ampm={false}
                              />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <TimePicker
                                label="Fine"
                                value={orariDiLavoro[giorno].fine ? dayjs(orariDiLavoro[giorno].fine, "HH:mm") : null}
                                onChange={(newValue) => handleOrariChange(giorno, 'fine', newValue)}
                                renderInput={(params) => <TextField {...params} />}
                                ampm={false}
                              />
                            </Grid>
                          </>
                        )}
                      </Grid>
                    ))}
                  </div>
                </LocalizationProvider>
              </Collapse>
            </div>

            {/* Sezione Ferie */}
            <div className="mt-5 col-lg-12">
              <Typography variant="h5" onClick={() => setShowFerie(!showFerie)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                Ferie
                {showFerie ? <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> : <ExpandMoreIcon style={{ marginLeft: '8px' }} />}
              </Typography>
              <Collapse in={showFerie}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <div className="mt-2">
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6} sm={3}>
                        <DatePicker
                          label="Data Inizio Ferie"
                          inputFormat="DD-MM-YYYY"
                          value={ferie.inizio ? dayjs(ferie.inizio, "DD-MM-YYYY") : null}
                          onChange={(newValue) =>
                            setFerie(prev => ({ ...prev, inizio: newValue ? newValue.format("DD-MM-YYYY") : "" }))
                          }
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <DatePicker
                          label="Data Fine Ferie"
                          inputFormat="DD-MM-YYYY"
                          value={ferie.fine ? dayjs(ferie.fine, "DD-MM-YYYY") : null}
                          onChange={(newValue) =>
                            setFerie(prev => ({ ...prev, fine: newValue ? newValue.format("DD-MM-YYYY") : "" }))
                          }
                          renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                      </Grid>
                    </Grid>
                  </div>
                </LocalizationProvider>
              </Collapse>
            </div>
          </div>
          <Button className="mt-4" type="submit" variant="contained">
            Aggiorna Dipendente
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
