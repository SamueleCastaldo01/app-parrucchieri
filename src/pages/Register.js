import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { FormControl, InputLabel, MenuItem, Select, Collapse, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'; // Import dropdown icon
import { db, auth } from '../firebase-config';
import { collection, addDoc, query, where, getDocs, Timestamp  } from 'firebase/firestore';
import moment from 'moment';
import {createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import CodiceFiscale from 'codice-fiscale-js';
import { errorNoty, successNoty } from '../components/Notify';
import { NavMobile } from '../components/NavMobile';



export function Register() {
    const navigate = useNavigate();
    const [gender, setGender] = useState('');
    const [password, setPassword] = useState('');
    const [nome, setNome] = useState('');
    const [cognome, setCognome] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [showOptionalFields, setShowOptionalFields] = useState(false); // State for optional fields

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


        {/** 
      const handleSubmit = async (event) => {
        event.preventDefault();
    
        try {
            // Controlla se esiste già un utente con la stessa email
            const userRef = collection(db, "user");
            const q = query(userRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
    
            if (!querySnapshot.empty) {
                errorNoty("L'email è già registrata. Scegli un'altra email.");
                return;
            }
    
            await addDoc(userRef, {
                password,
                nome,
                cognome,
                gender,
                telefono,
                email,
                dataCreazione: Timestamp.fromDate(new Date()), // Aggiunge la data di creazione
            });
    
            handleReset();
            navigate("/login");
            successNoty("Utente registrato successo");
        } catch (error) {
            console.error("Errore nell'aggiunta del cliente: ", error);
        }
    };
    */}


    const registerUser = async (event) => {
        event.preventDefault();
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
      
          // Salva informazioni aggiuntive in Firestore
          await setDoc(doc(db, "users", user.uid), {
            nome,
            cognome,
            gender,
            telefono,
            email,
            ruolo: "user",
            dataCreazione: new Date(),
          });
          successNoty("Utente registrato con successo");
          navigate("/login");
        } catch (error) {
          errorNoty("Errore durante la registrazione");
          console.error("Errore durante la registrazione:", error);
        }
      };


    return (
        <>
        <NavMobile />
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7 }}
        >
            <div className='container-fluid d-flex flex-column align-items-center' style={{ marginTop: "70px" }}>
                <h2 className='titlePage'>Registrati</h2>

                <form onSubmit={registerUser}>
                    <div className='row'>
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
                        <div className='mt-4 col-lg-4 col-md-6 col-sm-12'>
                                <TextField className='w-100' required label="Email" variant="outlined" color='tertiary' value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div className='d-flex mt-4 col-lg-4 col-md-6 col-sm-12'>
                            <TextField className='w-100' required label="Password" variant="outlined" color='tertiary' value={password} onChange={(e) => setPassword(e.target.value)} />  
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
                                        <TextField className='w-100' type='number' label="Numero di Telefono" variant="outlined" color='tertiary' value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                                    </div>
                                </div>
                            </Collapse>
                        </div>
                    </div>
                    <div className='d-flex justify-content-center mt-5'>
                        <Button    style={{ height: "50px", width: "100%" }} type="submit" variant="contained">Registrati</Button>
                    </div>   
                </form>

                <div className="mt-5 text-center">
                    <h6>Hai già un account?</h6>
                    <h6 onClick={() => {navigate("/login")}} className='text-decoration-underline'>Accedi</h6>
                </div>
            </div>
        </motion.div>
        </>
    );
}
