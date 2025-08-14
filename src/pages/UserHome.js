import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import Button from '@mui/material/Button';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase-config"; // Assicurati che il percorso del db sia corretto
import { useNavigate } from "react-router-dom";
import SettingsIcon from '@mui/icons-material/Settings';
import { NavMobile } from "../components/NavMobile";
import { IconButton } from "@mui/material";

export function UserHome() {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Ottieni l'username dal Redux store
  const email = useSelector((state) => state.userAuth.userDetails?.email);

  useEffect(() => {
    const fetchNomeCognome = async () => {
      try {

        // Query per ottenere il nome e cognome dalla tabella customersTab
        const customersRef = collection(db, "user");
        const customerQuery = query(customersRef, where("email", "==", email));
        const customerSnapshot = await getDocs(customerQuery);

        if (customerSnapshot.empty) {
          throw new Error("Nessun cliente trovato con questo username.");
        }

        // Prendi il primo documento (perché lo username è univoco)
        const customerData = customerSnapshot.docs[0].data();
        setNome(customerData.nome || "");
        setCognome(customerData.cognome || "");

      } catch (err) {
        console.error("Errore durante il recupero del nome e cognome:", err);
      }
    };

    fetchNomeCognome();
  }, [email]);

  return (
    <>
     {/* <NavMobile /> */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center px-3"
      >
        <div className="d-flex justify-content-between align-items-start">
          <h2 className="text-start primaryColor fw-bold">Ciao Giuseppe Castaldo</h2>
          <IconButton className="p-0">
            <SettingsIcon className="primaryColor" onClick={() => {navigate("/userprofile")}} style={{fontSize: "26px"}} />
          </IconButton>
        </div>
        
        <div className="px-0" style={{marginTop: "70px"}}>
      
        <div className="mt-5 d-flex gap-3 justify-content-center">
          <Button className="w-100" style={{height: "150px"}} variant="contained" onClick={() => {navigate("/booking")}}>Prenota</Button>
          <Button className="w-100" style={{height: "150px"}} variant="contained" onClick={() => {navigate("/bookinglistuser")}}>Le mie Prenotazioni</Button>
        </div>

        </div>

      </motion.div>
    </>
  );
}
