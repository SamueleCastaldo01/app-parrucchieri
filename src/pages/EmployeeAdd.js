import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import dropdown icon
import { db } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { errorNoty, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';
import { FormControlLabel, Checkbox, Grid } from "@mui/material";

export function EmployeeAdd() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [nome, setNome] = useState('');
    const [cognome, setCognome] = useState('');
    const [gender, setGender] = useState('');
    const [password, setPassword] = useState('12345678');
    const [orariDiLavoro, setOrariDiLavoro] = useState({
        lunedi: { inizio: "9:00", fine: "19:00", chiuso: false },
        martedi: { inizio: "9:00", fine: "19:00", chiuso: false },
        mercoledi: { inizio: "9:00", fine: "19:00", chiuso: false },
        giovedi: { inizio: "9:00", fine: "19:00", chiuso: false },
        venerdi: { inizio: "9:00", fine: "19:00", chiuso: false },
        sabato: { inizio: "9:00", fine: "19:00", chiuso: false },
        domenica: { inizio: "9:00", fine: "19:00", chiuso: true } // Domenica chiusa di default
    });
    const [ferie, setFerie] = useState([]);
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [showOptionalFields, setShowOptionalFields] = useState(false); // State for optional fields
    const [showWorkHours, setShowWorkHours] = useState(false); // State for work hours collapse

    const handleGenderChange = (event) => {
        setGender(event.target.value);
    };

    const handleReset = () => {
        setPassword("");
        setNome("");
        setCognome("");
        setGender("");
        setTelefono("");
        setEmail("");
    };

    const capitalizeWords = (str) => {
        return str
          .toLowerCase() // Converte l'intera stringa in minuscolo
          .split(' ') // Divide la stringa in parole
          .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizza la prima lettera di ogni parola
          .join(' '); // Riunisce le parole in una stringa
    };

    const handleOrariChange = (giorno, tipo, valore) => {
        setOrariDiLavoro(prev => ({
            ...prev,
            [giorno]: { 
                ...prev[giorno], 
                [tipo]: valore ? valore.format("HH:mm") : null  // Usa "HH:mm" per il formato 24 ore
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
            // Controlla se esiste già un utente con la stessa username
            const userRef = collection(db, "employee");
            const q = query(userRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                errorNoty("Questo username è già registrato. Scegli un'altro username.");
                return;
            }

            await addDoc(userRef, {
                password,
                username,
                nome,
                cognome,
                gender,
                telefono,
                email,
                orariDiLavoro, // Salvo gli orari di lavoro
                dataCreazione: Timestamp.fromDate(new Date()), // Aggiunge la data di creazione
            });

            handleReset();
            navigate("/employeelist");
            successNoty("Dipendente registrato con successo");
        } catch (error) {
            console.error("Errore nell'aggiunta del cliente: ", error);
        }
    };

    const giorniSettimana = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"];

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7 }}
            >
                <div className='container-fluid' style={{ marginTop: "70px" }}>
                    <h2 className='titlePage'>Aggiungi un Dipendente</h2>

                    <form onSubmit={handleSubmit}>
                        <div className='row'>
                            <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                <TextField className='w-100' required label="Username" variant="outlined" color='tertiary' value={username}
                                    onChange={(e) => {
                                        const formattedUsername = capitalizeWords(e.target.value);
                                        setUsername(formattedUsername);
                                    }}
                                />
                            </div>

                            <div className='d-flex mt-4 col-lg-4 col-md-6 col-sm-12'>
                                <TextField className='w-100' required label="Password" variant="outlined" color='tertiary' value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>

                            {/* Orari di Lavoro Section with Collapse */}
                            <div className='mt-5 col-lg-12'>
                                <Typography
                                    variant="h5"
                                    onClick={() => setShowWorkHours(!showWorkHours)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    Orari di Lavoro
                                    {showWorkHours ? 
                                        <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> :
                                        <ExpandMoreIcon style={{ marginLeft: '8px' }} />
                                    }
                                </Typography>
                                <Collapse in={showWorkHours}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <div className="mt-5">
                                            {giorniSettimana.map((giorno) => (
                                                <Grid container spacing={2} key={giorno} alignItems="center" className="mt-2">
                                                    <Grid item xs={12} sm={3}>
                                                        <FormControlLabel
                                                            control={
                                                                <Checkbox
                                                                    checked={orariDiLavoro[giorno].chiuso}
                                                                    onChange={() => handleChiusoChange(giorno)}
                                                                />
                                                            }
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
                                                                    ampm={false} // 24-hour format
                                                                />
                                                            </Grid>
                                                            <Grid item xs={6} sm={3}>
                                                                <TimePicker
                                                                    label="Fine"
                                                                    value={orariDiLavoro[giorno].fine ? dayjs(orariDiLavoro[giorno].fine, "HH:mm") : null}
                                                                    onChange={(newValue) => handleOrariChange(giorno, 'fine', newValue)}
                                                                    renderInput={(params) => <TextField {...params} />}
                                                                    ampm={false} // 24-hour format
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

                            {/* Optional Fields Section */}
                            <div className='mt-5 col-lg-12'>
                                <Typography
                                    variant="h5"
                                    onClick={() => setShowOptionalFields(!showOptionalFields)}
                                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    Campi Facoltativi
                                    {showOptionalFields ? 
                                        <ExpandMoreIcon style={{ marginLeft: '8px', transform: 'rotate(180deg)' }} /> :
                                        <ExpandMoreIcon style={{ marginLeft: '8px' }} />
                                    }
                                </Typography>
                                <Collapse in={showOptionalFields}>
                                    <div className='row'>
                                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                            <TextField className='w-100' label="Nome" variant="outlined" color='tertiary' value={nome}
                                                onChange={(e) => {
                                                    const formattedNome = capitalizeWords(e.target.value);
                                                    setNome(formattedNome);
                                                }}
                                            />
                                        </div>
                                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                            <TextField className='w-100' label="Cognome" variant="outlined" color='tertiary' value={cognome}
                                                onChange={(e) => {
                                                    const formattedCognome = capitalizeWords(e.target.value);
                                                    setCognome(formattedCognome);
                                                }}
                                            />
                                        </div>
                                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                            <TextField className='w-100' label="Email" variant="outlined" color='tertiary' value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                            <FormControl fullWidth color='tertiary'>
                                                <InputLabel id="gender-select-label">Genere</InputLabel>
                                                <Select
                                                    labelId="gender-select-label"
                                                    id="gender-select"
                                                    value={gender}
                                                    label="Genere"
                                                    onChange={handleGenderChange}
                                                >
                                                    <MenuItem value="maschio">Maschio</MenuItem>
                                                    <MenuItem value="femmina">Femmina</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </div>
                                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                            <TextField className='w-100' type='number' label="Numero di Telefono" variant="outlined" color='tertiary' value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                                        </div>
                                    </div>
                                </Collapse>
                            </div>
                        </div>

                        <div className='d-flex justify-content-center mt-5'>
                            <Button style={{ height: "50px", width: "100%" }} type="submit" variant="contained">Aggiungi</Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </>
    );
}
