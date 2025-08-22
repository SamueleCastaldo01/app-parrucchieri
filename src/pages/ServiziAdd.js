import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  Box,
  Container,
  Card,
  CardHeader,
  CardContent,
  Grid,
  Stack,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Collapse,
  Divider,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Chip,
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { Autocomplete } from '@mui/material';

import { db } from '../firebase-config';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  doc,
  updateDoc,
} from 'firebase/firestore';

import { errorNoty, successNoty } from '../components/Notify';

const PRIMARY = '#3a51b0';

export function ServiziAdd() {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState([]);
  const [servizio, setServizio] = useState('');
  const [durata, setDurata] = useState(30);
  const [prezzo, setPrezzo] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [descrizione, setDescrizione] = useState('');

  // di default seleziono "Tutti"
  const [dipendentiAssegnati, setDipendentiAssegnati] = useState([{ id: 'all', username: 'Tutti' }]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const handleReset = () => {
    setServizio('');
    setDurata(30);
    setPrezzo('');
    setDescrizione('');
    setDipendentiAssegnati([{ id: 'all', username: 'Tutti' }]);
    setIsDefault(false);
  };

  const fetchEmployee = async () => {
    try {
      const employeeCollection = collection(db, 'employee');
      const employeeQuery = query(employeeCollection, orderBy('dataCreazione', 'desc'), limit(100));
      const employeeSnapshot = await getDocs(employeeQuery);
      const employeeList = employeeSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEmployee(employeeList);
    } catch (error) {
      console.error('Errore nel recupero dei dipendenti: ', error);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  const capitalizeWords = (str) =>
    str
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const serviceRef = collection(db, 'service');

      // Nome servizio univoco
      const q = query(serviceRef, where('servizio', '==', servizio));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        errorNoty('Questo servizio è già registrato. Scegli un altro nome.');
        return;
      }

      // Se isDefault: true → togli default al precedente
      if (isDefault) {
        const defaultQuery = query(serviceRef, where('isDefault', '==', true));
        const defaultSnapshot = await getDocs(defaultQuery);
        if (!defaultSnapshot.empty) {
          const defaultDoc = defaultSnapshot.docs[0];
          await updateDoc(doc(db, 'service', defaultDoc.id), { isDefault: false });
        }
      }

      // Prepara lista dipendenti
      const dipendentiDaSalvare = dipendentiAssegnati.some((emp) => emp.id === 'all')
        ? 'Tutti'
        : dipendentiAssegnati.map((emp) => emp.username);

      // Salva
      await addDoc(serviceRef, {
        servizio,
        durata,
        prezzo,
        descrizione,
        isDefault,
        dipendentiAssegnati: dipendentiDaSalvare,
        dataCreazione: Timestamp.fromDate(new Date()),
      });

      successNoty('Servizio aggiunto con successo');
      handleReset();
      navigate('/servizilist');
    } catch (error) {
      console.error("Errore nell'aggiunta del servizio: ", error);
      errorNoty('Errore durante il salvataggio.');
    }
  };

  // Opzioni per Autocomplete (includo "Tutti" in testa)
  const employeeOptions = [{ id: 'all', username: 'Tutti' }, ...employee];

  // gestione "Tutti": se selezioni "Tutti", ignora le altre scelte; se togli "Tutti", puoi scegliere multi
  const handleChangeDipendenti = (event, newValue) => {
    const hasAll = newValue.some((v) => v.id === 'all');
    if (hasAll) {
      setDipendentiAssegnati([{ id: 'all', username: 'Tutti' }]);
    } else {
      setDipendentiAssegnati(newValue);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
      <Container maxWidth="lg" sx={{ pt: 3, pb: 4 }}>
        {/* Header pagina */}
        <Box
          sx={{
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: 'rgba(58,81,176,0.1)',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ContentCutIcon htmlColor={PRIMARY} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: PRIMARY }}>
              Aggiungi Servizio
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate('/servizilist')}>
              Annulla
            </Button>
            <Button
              type="submit"
              form="form-servizio"
              variant="contained"
              sx={{ bgcolor: PRIMARY, '&:hover': { bgcolor: '#2f4098' } }}
            >
              Salva
            </Button>
          </Stack>
        </Box>

        {/* Card form */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <CardHeader
            title={
              <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY }}>
                Dettagli servizio
              </Typography>
            }
            subheader="Compila le informazioni principali del servizio."
          />
          <Divider />

          <CardContent>
            <Box component="form" id="form-servizio" onSubmit={handleSubmit}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} md={5}>
                  <TextField
                    fullWidth
                    label="Nome servizio"
                    value={servizio}
                    onChange={(e) => setServizio(capitalizeWords(e.target.value))}
                    required
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Durata</InputLabel>
                    <Select
                      label="Durata"
                      value={durata}
                      onChange={(e) => setDurata(e.target.value)}
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
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    multiple
                    options={employeeOptions}
                    getOptionLabel={(option) => option.username}
                    value={dipendentiAssegnati}
                    onChange={handleChangeDipendenti}
                    renderOption={(props, option) => (
                      <li {...props}>
                        {option.id === 'all' ? (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <DoneAllIcon fontSize="small" />
                            <span>Tutti</span>
                          </Stack>
                        ) : (
                          option.username
                        )}
                      </li>
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          label={option.username}
                          color={option.id === 'all' ? 'primary' : 'default'}
                          variant={option.id === 'all' ? 'filled' : 'outlined'}
                          sx={{ mr: 0.5 }}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Dipendenti assegnati" placeholder="Seleziona…" />
                    )}
                  />
                </Grid>

                <Grid item xs={12} md={12}>
                  <FormControl component="fieldset" variant="standard">
                    <FormLabel component="legend">Imposta come predefinito?</FormLabel>
                    <RadioGroup
                      row
                      value={isDefault}
                      onChange={(e) => setIsDefault(e.target.value === 'true')}
                    >
                      <FormControlLabel value="true" control={<Radio />} label="Sì" />
                      <FormControlLabel value="false" control={<Radio />} label="No" />
                    </RadioGroup>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Facoltativi */}
              <Divider sx={{ my: 3 }} />
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                onClick={() => setShowOptionalFields((v) => !v)}
                sx={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, color: PRIMARY }}>
                  Campi facoltativi
                </Typography>
                <ExpandMoreIcon
                  sx={{
                    transition: 'transform .2s',
                    transform: showOptionalFields ? 'rotate(180deg)' : 'none',
                    color: PRIMARY,
                  }}
                />
              </Stack>

              <Collapse in={showOptionalFields} unmountOnExit>
                <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
                  <Grid item xs={12} md={7}>
                    <TextField
                      fullWidth
                      label="Descrizione"
                      multiline
                      rows={3}
                      value={descrizione}
                      onChange={(e) => setDescrizione(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      label="Prezzo"
                      type="number"
                      value={prezzo}
                      onChange={(e) => setPrezzo(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">€</InputAdornment>,
                        inputProps: { step: '0.01', min: 0 },
                      }}
                    />
                  </Grid>
                </Grid>
              </Collapse>

              {/* Azioni */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => navigate('/servizilist')}>
                  Annulla
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{ bgcolor: PRIMARY, '&:hover': { bgcolor: '#2f4098' } }}
                >
                  Aggiungi
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </motion.div>
  );
}
