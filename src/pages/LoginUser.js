import React, { useState } from "react";
import { motion } from "framer-motion";
import { TextField, Button, Typography, IconButton, InputAdornment } from "@mui/material";
import { db } from "../firebase-config"; // Assicurati di avere il percorso corretto
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Stato per gestire la visibilità della password
  const [message, setMessage] = useState("");
  const dispatch = useDispatch();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      // Query per cercare l'utente nel customersTab
      const usersRef = collection(db, "customersTab");
      const q = query(
        usersRef,
        where("username", "==", username),
        where("password", "==", password)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage("Credenziali non valide. Riprova.");
      } else {
        const userData = querySnapshot.docs[0].data(); // Ottieni i dati dell'utente
        setMessage("Login effettuato con successo!");
        
        // Dispatch per impostare l'utente come autenticato
        dispatch(loginUser({ username: userData.username, ...userData })); // Puoi aggiungere altri dettagli se necessario
        dispatch(logoutU()); //in caso in cui sono loggato come supervisore, mi disconetto
        navigate("/userhome");
      }
    } catch (error) {
      console.error("Errore durante il login: ", error);
      setMessage("Si è verificato un errore. Riprova.");
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
        <div className="text-center px-5" style={{ marginTop: "70px" }}>
          <h2 className="mt-5">Accedi</h2>
          <img style={{width: "200px"}} src="logo-marzano.jpg"/>
          <form onSubmit={handleLogin}>
            <TextField
              className="transparentInput"
              label="Username"
              variant="outlined"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
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

          <div style={{ marginTop: "100px" }} className="text-start">
            <h2>Contattaci</h2>
            <h6><WhatsAppIcon /> Numero: </h6>
          </div>

          <div className="text-start" style={{marginTop: "100px"}}>
            <a href="/login">Accedi come supervisore</a>
          </div>
        </div>
      </motion.div>
    </>
  );
}
