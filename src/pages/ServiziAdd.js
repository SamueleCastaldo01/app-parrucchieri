import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { db } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';
import { errorNoty, successNoty } from '../components/Notify';
import { Autocomplete } from '@mui/material';

export function ServiziAdd() {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState([]);
  const [servizio, setServizio] = useState('');
  const [durata, setDurata] = useState(30);
  const [prezzo, setPrezzo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  // Stato per gestire più dipendenti: array vuoto di default.
  const [dipendentiAssegnati, setDipendentiAssegnati] = useState([{ id: "all", username: "Tutti" }]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const handleReset = () => {
    setServizio("");
    setDurata("");
    setPrezzo("");
    setDescrizione("");
    setDipendentiAssegnati([]);
  };

  const fetchEmployee = async () => {
    try {
      const employeeCollection = collection(db, "employee");
      const employeeQuery = query(employeeCollection, orderBy("dataCreazione", "desc"), limit(100));
      const employeeSnapshot = await getDocs(employeeQuery);
      const employeeList = employeeSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployee(employeeList);
    } catch (error) {
      console.error("Errore nel recupero dei dipendenti: ", error);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  const capitalizeWords = (str) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const serviceRef = collection(db, "service");
      const q = query(serviceRef, where("servizio", "==", servizio));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        errorNoty("Questo servizio è già registrato. Scegli un altro nome.");
        return;
      }

      // Se la selezione include l'opzione "Tutti", salviamo come stringa "Tutti"
      const dipendentiDaSalvare = dipendentiAssegnati.some(emp => emp.id === "all")
        ? "Tutti"
        : dipendentiAssegnati.map(emp => emp.username);

      await addDoc(serviceRef, {
        servizio,
        durata,
        prezzo,
        descrizione,
        dipendentiAssegnati: dipendentiDaSalvare,
        dataCreazione: Timestamp.fromDate(new Date()),
      });

      handleReset();
      navigate("/servizilist");
      successNoty("Servizio aggiunto con successo");
    } catch (error) {
      console.error("Errore nell'aggiunta del servizio: ", error);
    }
  };

  // Crea l'array delle opzioni per l'Autocomplete, includendo l'opzione "Tutti"
  const employeeOptions = [{ id: "all", username: "Tutti" }, ...employee];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className='container-fluid' style={{ marginTop: "70px" }}>
        <h2 className='titlePage'>Aggiungi un Servizio</h2>

        <form onSubmit={handleSubmit}>
          <div className='row'>
            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
              <TextField
                className='w-100'
                label="Servizio"
                variant="outlined"
                value={servizio}
                onChange={(e) => setServizio(capitalizeWords(e.target.value))}
                required
              />
            </div>
            <div className='mt-4 col-lg-2 col-md-6 col-sm-12'>
              <FormControl className='w-100' variant="outlined">
                <InputLabel>Durata</InputLabel>
                <Select
                  value={durata}
                  onChange={(e) => setDurata(e.target.value)}
                  label="Durata"
                  required
                >
                  <MenuItem value={15}>15 min</MenuItem>
                  <MenuItem value={30}>30 min</MenuItem>
                  <MenuItem value={45}>45 min</MenuItem>
                  <MenuItem value={60}>1 ora</MenuItem>
                  <MenuItem value={75}>1 ora e 15 min</MenuItem>
                  <MenuItem value={90}>1 ora e 30 min</MenuItem>
                </Select>
              </FormControl>
            </div>
            <div className='mt-4 col-lg-4 col-md-12'>
              <Autocomplete
                multiple
                options={employeeOptions}
                getOptionLabel={(option) => option.username}
                value={dipendentiAssegnati}
                onChange={(event, newValue) => setDipendentiAssegnati(newValue)}
                renderInput={(params) => <TextField {...params} label="Dipendenti Assegnati" variant="outlined" />}
              />
            </div>
          </div>

          <div className='mt-5 col-lg-12'>
            <Typography
              variant="h5"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              Campi Facoltativi
              <ExpandMoreIcon style={{ marginLeft: '8px', transform: showOptionalFields ? 'rotate(180deg)' : 'none' }} />
            </Typography>
            <Collapse in={showOptionalFields}>
              <div className='row'>
                <div className='mt-4 col-lg-6 col-md-12'>
                  <TextField
                    className='w-100'
                    label="Descrizione"
                    multiline
                    rows={3}
                    variant="outlined"
                    value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                  />
                </div>
                <div className='mt-4 col-lg-2 col-md-6 col-sm-12'>
                  <TextField
                    className='w-100'
                    label="Prezzo (€)"
                    type="number"
                    variant="outlined"
                    value={prezzo}
                    onChange={(e) => setPrezzo(e.target.value)}
                  />
                </div>
              </div>
            </Collapse>
          </div>

          <div className='d-flex justify-content-center mt-5'>
            <Button style={{ height: "50px", width: "100%" }} type="submit" variant="contained">Aggiungi</Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
