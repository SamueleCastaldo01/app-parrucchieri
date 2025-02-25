import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import Button from '@mui/material/Button';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase-config"; // Assicurati che il percorso del db sia corretto
import { useNavigate } from "react-router-dom";
import { NavMobile } from "../components/NavMobile";

export function UserHome() {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Ottieni l'username dal Redux store
  const username = useSelector((state) => state.userAuth.userDetails?.username);

  useEffect(() => {
    const fetchNomeCognome = async () => {
      try {
        if (!username) {
          throw new Error("Username non trovato!");
        }

        // Query per ottenere il nome e cognome dalla tabella customersTab
        const customersRef = collection(db, "customersTab");
        const customerQuery = query(customersRef, where("username", "==", username));
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
        setError(err.message);
      }
    };

    fetchNomeCognome();
  }, [username]);

  return (
    <>
     <NavMobile />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        
        <div style={{marginTop: "70px"}}>
          <div className="px-4">
            <h1 className="py-2 rounded rounded-2" style={{ backgroundColor: "#333" }}>Benvenuto {nome} {cognome}</h1>
          </div>
       

        <div style={{marginBottom: "200px"}} className="mt-5 d-flex flex-column gap-5 px-5 align-content-center">
        <Button style={{height: "150px"}} variant="contained" onClick={() => {navigate("/userveicoli")}}>I Tuoi Veicoli</Button>
        <Button style={{height: "150px"}} variant="contained" onClick={() => {navigate("/userschededilavoro")}}>Le tue schede di lavoro</Button>
        <Button style={{height: "150px"}} variant="contained" onClick={() => {navigate("/userprofile")}}>Impostazioni</Button>
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        </div>

      </motion.div>
    </>
  );
}
