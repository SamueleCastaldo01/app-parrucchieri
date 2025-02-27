import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { FormControlLabel, Checkbox, Grid, Typography, Collapse } from "@mui/material";
import { DatePicker, LocalizationProvider, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { db } from '../firebase-config';
import { collection, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import dayjs from "dayjs";
import { errorNoty, successNoty } from '../components/Notify';

export function ConfigStore() {
    const navigate = useNavigate();
    const [orariDiLavoro, setOrariDiLavoro] = useState({
        lunedi: { inizio: "9:00", fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
        martedi: { inizio: "9:00", fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
        mercoledi: { inizio: "9:00", fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
        giovedi: { inizio: "9:00", fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
        venerdi: { inizio: "9:00", fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
        sabato: { inizio: "9:00", fine: "19:00", chiuso: false, pausaPranzo: { inizio: "13:00", fine: "14:00" } },
        domenica: { inizio: "9:00", fine: "19:00", chiuso: true, pausaPranzo: { inizio: null, fine: null } }
    });
    const [ferie, setFerie] = useState({ inizio: null, fine: null });
    const [showWorkHours, setShowWorkHours] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const configDocRef = doc(db, "configstore", "storeConfig");
                const docSnap = await getDoc(configDocRef);
    
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOrariDiLavoro(prev => {
                        return Object.keys(prev).reduce((acc, giorno) => {
                            acc[giorno] = {
                                ...prev[giorno],
                                ...data.orariDiLavoro?.[giorno],
                                pausaPranzo: {
                                    inizio: data.orariDiLavoro?.[giorno]?.pausaPranzo?.inizio || prev[giorno].pausaPranzo.inizio,
                                    fine: data.orariDiLavoro?.[giorno]?.pausaPranzo?.fine || prev[giorno].pausaPranzo.fine
                                }
                            };
                            return acc;
                        }, {});
                    });
                    setFerie(data.ferie || ferie);
                }
            } catch (error) {
                console.error("Errore nel recupero della configurazione:", error);
                errorNoty("Errore nel caricamento della configurazione.");
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);
    

    const handlePausaPranzoChange = (giorno, tipo, valore) => {
        setOrariDiLavoro(prev => ({
            ...prev,
            [giorno]: {
                ...prev[giorno],
                pausaPranzo: {
                    ...prev[giorno].pausaPranzo,
                    [tipo]: valore ? valore.format("HH:mm") : null
                }
            }
        }));
    };

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

    const handleFerieChange = (campo, valore) => {
        setFerie(prev => ({
            ...prev,
            [campo]: valore ? valore.format("DD-MM-YYYY") : null
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        try {
            const configDocRef = doc(db, "configstore", "storeConfig");
            const newData = {
                orariDiLavoro,
                ferie,
                dataUltimaModifica: Timestamp.fromDate(new Date()),
            };
    
            await setDoc(configDocRef, newData, { merge: true });
    
            successNoty("Configurazione salvata con successo!");
        } catch (error) {
            console.error("Errore nella modifica della configurazione: ", error);
            errorNoty("Errore nella modifica della configurazione.");
        }
    };
    

    if (loading) {
        return <Typography>Caricamento in corso...</Typography>;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
        >
            <div className='container-fluid' style={{ marginTop: "70px" }}>
                <h2 className='titlePage'>Configura il tuo Store</h2>

                <form onSubmit={handleSubmit}>
                    <div className='row'>
                        <div className='mt-5 col-lg-12'>
                            <Typography
                                variant="h5"
                                onClick={() => setShowWorkHours(!showWorkHours)}
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                Orari di Lavoro
                                <ExpandMoreIcon style={{ marginLeft: '8px', transform: showWorkHours ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                            </Typography>
                            <Collapse in={showWorkHours}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <div className="">
                                    {["lunedi", "martedi", "mercoledi", "giovedi", "venerdi", "sabato", "domenica"].map((giorno) => (
                                            <div  key={giorno} alignItems="center" className="row mt-2 d-flex">
                                                <div  className='col-2'>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                checked={orariDiLavoro[giorno].chiuso}
                                                                onChange={() => handleChiusoChange(giorno)}
                                                            />
                                                        }
                                                        label={`${giorno.charAt(0).toUpperCase() + giorno.slice(1)} (${orariDiLavoro[giorno].chiuso ? "Chiuso" : "Aperto"})`}
                                                    />
                                                </div>
                                                {!orariDiLavoro[giorno].chiuso && (
                                                    <>
                                                    <div className='col d-flex align-items-center gap-3 mb-4'>
                                                        <div className='' style={{width: "120px"}}>
                                                        <TimePicker 
                                                            label="Inizio"
                                                            value={orariDiLavoro[giorno].inizio ? dayjs(orariDiLavoro[giorno].inizio, "HH:mm") : null}
                                                            onChange={(newValue) => handleOrariChange(giorno, 'inizio', newValue)}
                                                            ampm={false}
                                                            slotProps={{
                                                                textField: {
                                                                    InputProps: {
                                                                        sx: {
                                                                            '& .MuiInputBase-input': { color: 'green' }, // Cambia il colore del testo
                                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'green !important' }, // Cambia il colore del bordo
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'green' }, // Cambia il colore al passaggio del mouse
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'green' } // Cambia il colore quando il campo è selezionato
                                                                        }
                                                                    },
                                                                }
                                                            }}
                                                        />

                                                        </div>
                                                        <div className='' style={{width: "120px"}}>
                                                        <TimePicker
                                                            label="Pausa Pranzo Inizio"
                                                            value={orariDiLavoro[giorno].pausaPranzo.inizio ? dayjs(orariDiLavoro[giorno].pausaPranzo.inizio, "HH:mm") : null}
                                                            onChange={(newValue) => handlePausaPranzoChange(giorno, 'inizio', newValue)}
                                                            ampm={false}
                                                            slotProps={{
                                                                textField: {
                                                                    InputProps: {
                                                                        sx: {
                                                                            '& .MuiInputBase-input': { color: 'orange' }, // Cambia il colore del testo a arancione
                                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'orange !important' }, // Cambia il colore del bordo a arancione
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'orange' }, // Cambia il colore del bordo al passaggio del mouse
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'orange' } // Cambia il colore del bordo quando il campo è selezionato
                                                                        }
                                                                    },
                                                                }
                                                            }}
                                                        />
                                                        </div>
                                                        <div className='' style={{width: "120px"}}>
                                                            <TimePicker
                                                                label="Pausa Pranzo Fine"
                                                                value={orariDiLavoro[giorno].pausaPranzo.fine ? dayjs(orariDiLavoro[giorno].pausaPranzo.fine, "HH:mm") : null}
                                                                onChange={(newValue) => handlePausaPranzoChange(giorno, 'fine', newValue)}
                                                                ampm={false}
                                                            />
                                                        </div>
                                                        <div className='' style={{width: "120px"}}>
                                                        <TimePicker
                                                            label="Fine"
                                                            value={orariDiLavoro[giorno].fine ? dayjs(orariDiLavoro[giorno].fine, "HH:mm") : null}
                                                            onChange={(newValue) => handleOrariChange(giorno, 'fine', newValue)}
                                                            ampm={false}
                                                            slotProps={{
                                                                textField: {
                                                                    InputProps: {
                                                                        sx: {
                                                                            '& .MuiInputBase-input': { color: 'red' }, // Cambia il colore del testo a rosso
                                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'red !important' }, // Cambia il colore del bordo a rosso
                                                                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'red' }, // Cambia il colore del bordo al passaggio del mouse
                                                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'red' } // Cambia il colore del bordo quando il campo è selezionato
                                                                        }
                                                                    },
                                                                }
                                                            }}
                                                        />
                                                        </div>
                                                    </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </LocalizationProvider>
                            </Collapse>
                        </div>

                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <div className="mt-4">
                                <h4>Ferie</h4>
                                <div className='d-flex gap-4'>
                                    <DatePicker
                                        label="Data Inizio Ferie"
                                        value={ferie.inizio ? dayjs(ferie.inizio, "DD-MM-YYYY") : null}
                                        onChange={(newValue) => handleFerieChange("inizio", newValue)}
                                    />
                                    <DatePicker
                                        label="Data Fine Ferie"
                                        value={ferie.fine ? dayjs(ferie.fine, "DD-MM-YYYY") : null}
                                        onChange={(newValue) => handleFerieChange("fine", newValue)}
                                    />
                                </div>
                            </div>
                        </LocalizationProvider>
                    </div>

                    <div className='d-flex justify-content-center mt-5'>
                        <Button style={{ height: "50px", width: "100%" }} type="submit" variant="contained">Salva</Button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
