import React, { useState } from "react";
import { motion } from "framer-motion";
import { TextField, Button, Typography, IconButton, InputAdornment } from "@mui/material";
import { db, auth } from "../firebase-config"; // Assicurati di avere il percorso corretto
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { loginUser } from "../redux/reducers/userAuthSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutU } from "../redux/reducers/authSlice";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { NavMobile } from "../components/NavMobile";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export function LoginUser() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Stato per gestire la visibilità della password
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();

  {/* 
  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      // Query per cercare l'utente nel customersTab
      const usersRef = collection(db, "user");
      const q = query(
        usersRef,
        where("email", "==", email),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage("Credenziali non valide. Riprova.");
      } else {
        const userData = querySnapshot.docs[0].data(); // Ottieni i dati dell'utente
        setMessage("Login effettuato con successo!");
        
        // Dispatch per impostare l'utente come autenticato
        dispatch(loginUser({ email: userData.email, ...userData })); // Puoi aggiungere altri dettagli se necessario
        dispatch(logoutU()); //in caso in cui sono loggato come supervisore, mi disconetto
        navigate("/userhome");
      }
    } catch (error) {
      console.error("Errore durante il login: ", error);
      setMessage("Si è verificato un errore. Riprova.");
    }
  };*/}

  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage(""); // Reset messaggio di errore
  
    try {
      // Effettua l'accesso con Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      setMessage("Login effettuato con successo!");
      
      // Recupera informazioni aggiuntive dell'utente da Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        
        // Dispatch per Redux (salva i dati dell'utente nello stato globale)
        dispatch(loginUser({ email: user.email, ...userData }));
        dispatch(logoutU()); // Se eri loggato come supervisore, esegui il logout
        
        navigate("/userhome"); // Reindirizza alla homepage utente
      } else {
        setMessage("Errore: dati utente non trovati in Firestore.");
      }
  
    } catch (error) {
      console.error("Errore durante il login:", error);
      setMessage("Email o password errati. Riprova.");
    }
  };

  // Funzione per alternare la visibilità della password
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  

  return (
    <>
      <NavMobile />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="text-center px-3" style={{ marginTop: "70px" }}>
          <h2 className="mt-5">Accedi</h2>
          <img style={{width: "200px"}} src=""/>
          <form onSubmit={handleLogin}>
            <TextField
              className="transparentInput"
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
            />
            
            {/* Campo password con pulsante per mostrare/nascondere */}
            <TextField
              label="Password"
              className="transparentInput"
              type={showPassword ? "text" : "password"} // Cambia il tipo di input tra 'text' e 'password'
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              className="mt-3"
              style={{ height: "50px", width: "100%" }}
              variant="contained"
              color="primary"
              type="submit"
            >
              Accedi
            </Button>
          </form>
          {message && <Typography variant="body1">{message}</Typography>}

          <div className="mt-5 text-start d-flex gap-1">
            <p>Non sei registrato?</p>
            <p onClick={() => {navigate("/register")}} className="text-decoration-underline">Registrati</p>
          </div>
        
        </div>
      </motion.div>
    </>
  );
}
