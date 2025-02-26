import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { db } from '../firebase-config';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { errorNoty, successNoty } from '../components/Notify';
import { Autocomplete } from '@mui/material';

export function EditService({ serviceId, onClose, fetchservizi }) {
  // Stati per il servizio
  const [servizio, setServizio] = useState('');
  const [durata, setDurata] = useState(30);
  const [prezzo, setPrezzo] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [dipendentiAssegnati, setDipendentiAssegnati] = useState([]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Stato per la lista dei dipendenti (per l'Autocomplete)
  const [employee, setEmployee] = useState([]);

  // Funzione di utilità per capitalizzare le parole
  const capitalizeWords = (str) => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Fetch dei dati del servizio da modificare
  useEffect(() => {
    const fetchService = async () => {
      try {
        const serviceDoc = await getDoc(doc(db, "service", serviceId));
        if (serviceDoc.exists()) {
          const data = serviceDoc.data();
          setServizio(data.servizio);
          setDurata(data.durata);
          setPrezzo(data.prezzo);
          setDescrizione(data.descrizione);
          if (data.dipendentiAssegnati === "Tutti") {
            setDipendentiAssegnati([{ id: "all", username: "Tutti" }]);
          } else if (Array.isArray(data.dipendentiAssegnati)) {
            // Assume che sia un array di username
            const selezionati = data.dipendentiAssegnati.map((uname) => ({ id: uname, username: uname }));
            setDipendentiAssegnati(selezionati);
          }
        }
      } catch (error) {
        console.error("Errore nel recupero del servizio: ", error);
      }
    };

    fetchService();
  }, [serviceId]);

  // Fetch della lista dei dipendenti per l'Autocomplete
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const employeeCollection = collection(db, "employee");
        const employeeQuery = query(employeeCollection);
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
    fetchEmployee();
  }, []);

  // Crea l'array delle opzioni per l'Autocomplete includendo "Tutti"
  const employeeOptions = [{ id: "all", username: "Tutti" }, ...employee];

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const serviceRef = doc(db, "service", serviceId);
      // Se la selezione include "Tutti", salviamo come stringa "Tutti",
      // altrimenti salviamo l'array di username.
      const dipendentiDaSalvare = dipendentiAssegnati.some(emp => emp.id === "all")
        ? "Tutti"
        : dipendentiAssegnati.map(emp => emp.username);

      await updateDoc(serviceRef, {
        servizio,
        durata,
        prezzo,
        descrizione,
        dipendentiAssegnati: dipendentiDaSalvare,
        // Non aggiorniamo dataCreazione per modifica, oppure la lasciamo invariata
      });
      successNoty("Servizio aggiornato con successo");
      fetchservizi();
      onClose();
    } catch (error) {
      console.error("Errore nell'aggiornamento del servizio: ", error);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
      <div className="container-fluid">
        <h2>{servizio}</h2>
        <form onSubmit={handleSubmit}>
          <div className="row">
            {/* Campo Servizio */}
            <div className="mt-4 col-lg-6 col-md-6 col-sm-12">
              <TextField
                className="w-100"
                required
                label="Servizio"
                variant="outlined"
                value={servizio}
                onChange={(e) => setServizio(capitalizeWords(e.target.value))}
              />
            </div>
            {/* Campo Durata */}
            <div className="mt-4 col-lg-6 col-md-6 col-sm-12">
              <FormControl className="w-100" variant="outlined">
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
            {/* Autocomplete per Dipendenti Assegnati */}
            <div className="mt-4 col-lg-12 col-md-12">
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

          <div className="mt-5 col-lg-12">
            <Typography
              variant="h5"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              Campi Facoltativi
              <ExpandMoreIcon style={{ marginLeft: '8px', transform: showOptionalFields ? 'rotate(180deg)' : 'none' }} />
            </Typography>
            <Collapse in={showOptionalFields}>
              <div className="row">
                {/* Descrizione e Prezzo */}
                <div className="mt-4 col-lg-6 col-md-12">
                  <TextField
                    className="w-100"
                    label="Descrizione"
                    multiline
                    rows={3}
                    variant="outlined"
                    value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                  />
                </div>
                <div className="mt-4 col-lg-2 col-md-6 col-sm-12">
                  <TextField
                    className="w-100"
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

          <div className="d-flex justify-content-center mt-5">
            <Button style={{ height: "50px", width: "100%" }} type="submit" variant="contained">
              Aggiorna Servizio
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
