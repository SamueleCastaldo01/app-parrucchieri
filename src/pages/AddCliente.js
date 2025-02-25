import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import dropdown icon
import { db } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, Timestamp  } from 'firebase/firestore';
import moment from 'moment';
import CodiceFiscale from 'codice-fiscale-js';
import { notifyErrorAddCliente, notifyErrorAddUsername, successAddCliente } from '../components/Notify';

export function AddCliente() {
    const navigate = useNavigate();
    const [gender, setGender] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('12345678');
    const [nome, setNome] = useState('');
    const [cognome, setCognome] = useState('');
    const [dataNascita, setDataNascita] = useState('');
    const [cittaNascita, setCittaNascita] = useState('');
    const [provinciaNascita, setProvinciaNascita] = useState('');
    const [codiceFiscale, setCodiceFiscale] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [showOptionalFields, setShowOptionalFields] = useState(false); // State for optional fields

    const handleGenderChange = (event) => {
        setGender(event.target.value);
    };

    const handleReset = () => {
        setUsername("");
        setPassword("");
        setNome("");
        setCognome("");
        setGender("");
        setDataNascita("");
        setCittaNascita("");
        setProvinciaNascita("");
        setCodiceFiscale("");
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        const usernameExists = await checkUsernameExists(username);
        if (usernameExists) {
            notifyErrorAddUsername();
            return;
        }
    
        if (telefono.length <= 9) {
            notifyErrorAddCliente("Inserisci correttamente il numero di telefono");
            return;
        }
    
        const formattedDataNascita = moment(dataNascita).format('DD-MM-YYYY');
    
        try {
            await addDoc(collection(db, 'customersTab'), {
                username,
                password,
                nome,
                cognome,
                gender,
                dataNascita: formattedDataNascita,
                cittaNascita,
                provinciaNascita,
                codiceFiscale,
                telefono,
                email,
                dataCreazione: Timestamp.fromDate(new Date()), // Aggiungi la data di creazione
            });
            handleReset();
            navigate("/customerlist");
            successAddCliente();
        } catch (error) {
            console.error('Errore nell\'aggiunta del cliente: ', error);
        }
    };

    const checkUsernameExists = async (username) => {
        const q = query(collection(db, 'customersTab'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    };

    const generateCodiceFiscale = (nome, cognome, dataNascita, sesso, comune) => {
        const cf = CodiceFiscale.fromData({
            nome,
            cognome,
            data: dataNascita,
            sesso,
            comune: {
                nome: comune.nome,
                codice: comune.codice
            }
        });
        return cf;
    };

    const handleCf = () => {
        const sesso = gender === "maschio" ? "M" : "F";
        const comune = {
            nome: cittaNascita,
            codice: 'F104'
        };

        try {
            const cf = generateCodiceFiscale(nome, cognome, dataNascita, sesso, comune);
            setCodiceFiscale(cf);
        } catch (error) {
            console.error('Errore nella generazione del codice fiscale: ', error);
        }
    };

    const handleGeneratePassword = () => {
        const length = 10;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        const upperCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numberCharset = "0123456789";

        let password = "";
        password += upperCharset.charAt(Math.floor(Math.random() * upperCharset.length));
        password += numberCharset.charAt(Math.floor(Math.random() * numberCharset.length));

        for (let i = 2; i < length; i++) {
            password += charset.charAt(Math.floor(Math.random() * charset.length));
        }

        password = password.split('').sort(() => Math.random() - 0.5).join('');
        
        setPassword(password);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
        >
            <div className='container-fluid'>
                <h2 className='titlePage'>Aggiungi un nuovo Cliente</h2>

                <form onSubmit={handleSubmit}>
                    <div className='row'>
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' required label="Username" variant="outlined" color='tertiary' value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
                        </div>
                        <div className='d-flex mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' required label="Password" variant="outlined" color='tertiary' value={password} onChange={(e) => setPassword(e.target.value)} />
                            <Button onClick={handleGeneratePassword} variant="contained">Genera</Button>    
                        </div>
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' type='number' required label="Numero di Telefono" variant="outlined" color='tertiary' value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                        </div>
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' required label="Nome" variant="outlined" color='tertiary' value={nome}   
                                onChange={(e) => {
                                const formattedNome = capitalizeWords(e.target.value); 
                                setNome(formattedNome); }}  
                            />
                        </div>
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' required label="Cognome" variant="outlined" color='tertiary' value={cognome} 
                                onChange={(e) => {
                                const formattedCognome = capitalizeWords(e.target.value); 
                                setCognome(formattedCognome); }}   
                            />
                        </div>

                        {/* Optional Fields Section */}
                        <div className='mt-4 col-lg-12'>
                            <Typography 
                                variant="h6" 
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
                                        <TextField className='w-100' type='date' label="Data di nascita" variant="outlined" color='tertiary' value={dataNascita} onChange={(e) => setDataNascita(e.target.value)} InputLabelProps={{ shrink: true }} />
                                    </div>
                                    <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                        <TextField className='w-100' label="Città di nascita" variant="outlined" color='tertiary' value={cittaNascita} onChange={(e) => setCittaNascita(e.target.value)} />
                                    </div>
                                    <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                        <TextField className='w-100' label="Provincia di nascita" variant="outlined" color='tertiary' value={provinciaNascita} onChange={(e) => setProvinciaNascita(e.target.value)} />
                                    </div>
                                    <div className='d-flex mt-4 col-lg-4 col-md-6 col-sm-12'>
                                        <TextField className='w-100' label="Codice Fiscale" variant="outlined" color='tertiary' value={codiceFiscale} onChange={(e) => setCodiceFiscale(e.target.value)} />
                                        <Button onClick={handleCf} variant="contained">Genera</Button>    
                                    </div>
                                    <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                        <TextField className='w-100' label="Email" variant="outlined" color='tertiary' value={email} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                </div>
                            </Collapse>
                        </div>
                    </div>
                    <Button className='mt-4' type="submit" variant="contained">Aggiungi Cliente</Button>
                </form>
            </div>
        </motion.div>
    );
}
