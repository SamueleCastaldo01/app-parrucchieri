import React, { useState } from "react";
import { motion } from "framer-motion";
import { NavMobile } from "../components/NavMobile";
import { useDispatch, useSelector } from "react-redux";
import { db } from "../firebase-config"; // Assicurati di avere il percorso corretto
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore"; 
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { TextField, Button, Typography } from "@mui/material"; // Importa i componenti Material-UI
import { logoutUser } from "../redux/reducers/userAuthSlice";

export function UserProfile() {
  const dispatch = useDispatch();
  const username = useSelector((state) => state.userAuth.userDetails?.username);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const auth = getAuth();
  
  const handleChangePassword = async (event) => {
    event.preventDefault();

    // Controlla se la nuova password e la conferma corrispondono
    if (newPassword !== confirmPassword) {
      setMessage("Le password non corrispondono.");
      return;
    }

    try {
      // Query per cercare l'utente nel customersTab
      const usersRef = collection(db, "customersTab");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage("Utente non trovato.");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Controlla se la password vecchia è corretta
      if (userData.password !== oldPassword) {
        setMessage("La password vecchia non è corretta.");
        return;
      }

      // Aggiorna la password nel database
      const userRef = doc(db, "customersTab", userDoc.id);
      await updateDoc(userRef, { password: newPassword });

      setMessage("Password aggiornata con successo!");
      // Resetta i campi
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Errore durante l'aggiornamento della password: ", error);
      setMessage("Si è verificato un errore. Riprova.");
    }
  };

  const signUserOut = () => {
    signOut(auth).then(() => {
      dispatch(logoutUser());  //logout per l'utente
    });
  };

  return (
    <>
      <NavMobile />F
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div style={{ marginTop: "70px", marginBottom: "100px" }} className="mainMobileUser px-4 text-center">
          <h1 className="py-2 rounded rounded-2" style={{ backgroundColor: "#333" }}>Impostazioni</h1>

        <div className="px-3">
          <form onSubmit={handleChangePassword} style={{ marginTop: "30px" }}>
            <h3 className="text-start">Cambia Password</h3>
            <TextField
              label="Password Vecchia"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <TextField
              label="Nuova Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <TextField
              label="Conferma Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Button
              className="mt-3"
              style={{ height: "50px", width: "100%" }}
              variant="contained"
              color="primary"
              type="submit"
            >
              Cambia Password
            </Button>
          </form>
          <h3 className="text-start mt-5">Esci</h3>
          <Button
              className="mt-3"
              style={{ height: "50px", width: "100%" }}
              variant="contained"
              color="error"
              onClick={() => {signUserOut()}}
            >
              Esci
            </Button>
        </div>
          {message && <Typography variant="body1" style={{ marginTop: "20px" }}>{message}</Typography>}
        </div>
      </motion.div>
    </>
  );
}
