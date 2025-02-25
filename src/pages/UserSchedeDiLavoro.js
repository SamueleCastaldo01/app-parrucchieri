import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase-config";
import { NavMobile } from "../components/NavMobile";
import { Button, TextField } from "@mui/material";
import FindInPageIcon from '@mui/icons-material/FindInPage';
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export function UserSchedeDiLavoro() {
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState("");
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Stato per il termine di ricerca
  const navigate = useNavigate();

  // Ottieni lo username dal Redux store
  const username = useSelector((state) => state.userAuth.userDetails?.username);

  useEffect(() => {
    const fetchSchede = async () => {
      try {
        if (!username) {
          throw new Error("Username non trovato!");
        }

        // 1. Query per ottenere l'ID del cliente da customersTab
        const customersRef = collection(db, "customersTab");
        const customerQuery = query(
          customersRef,
          where("username", "==", username)
        );
        const customerSnapshot = await getDocs(customerQuery);

        if (customerSnapshot.empty) {
          throw new Error("Nessun cliente trovato con questo username.");
        }

        // Assumi che lo username sia univoco, quindi prendi solo il primo documento
        const customerId = customerSnapshot.docs[0].id;
        setCustomerId(customerId);

        // 2. Query per ottenere le schede di lavoro filtrate con idCustomer e limite di 50
        await fetchSchedeByCustomerId(customerId);
      } catch (err) {
        console.error("Errore durante il recupero delle schede di lavoro:", err);
        setError(err.message);
      } finally {
        setLoading(false); // Fine del caricamento
      }
    };
    setSearchTerm(localStorage.getItem("userTarga"));
    localStorage.setItem("userTarga", "");

    fetchSchede();
  }, [username]);

  const fetchSchedeByCustomerId = async (customerId) => {
    const schedaRef = collection(db, "schedaDiLavoroTab");
    const schedaQuery = query(
      schedaRef,
      where("idCustomer", "==", customerId),
      limit(50) // Limita i risultati a 50
    );
    const schedeSnapshot = await getDocs(schedaQuery);

    if (schedeSnapshot.empty) {
      throw new Error("Nessuna scheda di lavoro trovata.");
    }

    // Mappa i dati delle schede di lavoro in un array
    const schedeData = schedeSnapshot.docs.map((doc) => ({
      id: doc.id, // ID del documento
      ...doc.data(),
    }));

    // Ordina le schede in base alla data di creazione, dal più recente al più vecchio
    const sortedSchedeData = schedeData.sort((a, b) => {
      return b.dataCreazione.toDate() - a.dataCreazione.toDate(); // Ordina per data di creazione
    });

    // Imposta i dati nello stato
    setSchede(sortedSchedeData);
  };

  const handleSearch = async () => {
    if (!searchTerm) {
      return; // Se il campo di ricerca è vuoto, non fare nulla
    }

    // Converte il termine di ricerca in maiuscolo
    const upperSearchTerm = searchTerm.toUpperCase();

    try {
      const schedaRef = collection(db, "schedaDiLavoroTab");
      const searchQuery = query(
        schedaRef,
        where("idCustomer", "==", customerId),
        where("targa", "==", upperSearchTerm) // Filtro per targa in maiuscolo
      );
      const searchSnapshot = await getDocs(searchQuery);

      if (searchSnapshot.empty) {
        setSchede([]); // Nessuna scheda trovata
        setError("Nessuna scheda trovata con questa targa.");
        return;
      }

      const schedeData = searchSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Converti le targhe in maiuscolo prima di impostare lo stato
      const formattedSchedeData = schedeData.map((scheda) => ({
        ...scheda,
        targa: scheda.targa.toUpperCase(), // Imposta la targa in maiuscolo
      }));

      // Ordina le schede in base alla data di creazione, dal più recente al più vecchio
      const sortedFormattedSchedeData = formattedSchedeData.sort((a, b) => {
        return b.dataCreazione.toDate() - a.dataCreazione.toDate(); // Ordina per data di creazione
      });

      setSchede(sortedFormattedSchedeData);
      setError(null); // Resetta l'errore se ci sono risultati
    } catch (err) {
      console.error("Errore durante la ricerca:", err);
      setError(err.message);
    }
  };

  const handleCancelSearch = async () => {
    setSearchTerm(""); // Resetta il campo di ricerca
    setError(null); // Resetta l'errore
    await fetchSchedeByCustomerId(customerId); // Ricarica tutte le schede
  };

  // Gestisce l'input del campo di ricerca e converte il valore in maiuscolo
  const handleInputChange = (e) => {
    const upperValue = e.target.value.toUpperCase();
    setSearchTerm(upperValue);
  };

  return (
    <>
      <NavMobile />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div className="mainMobileUser text-center px-4" style={{ marginTop: "70px", marginBottom: "100px" }}>
            <div >
            <h1 className="py-2 rounded rounded-2" style={{ backgroundColor: "#333" }}>Schede di lavoro <FindInPageIcon style={{fontSize: "40px"}}/></h1>
            <TextField
            label="Cerca per Targa"
            variant="outlined"
            value={searchTerm}
            onChange={handleInputChange} // Aggiorna il valore del campo
            style={{ marginBottom: "20px", width: "300px", marginTop: "20px" }}
          />
          <div>
            <Button variant="contained" onClick={handleSearch} style={{ marginRight: "10px" }}>
              Cerca
            </Button>
            <Button variant="outlined" onClick={handleCancelSearch}>
              Annulla
            </Button>
          </div>
            </div>
       
          {loading && <p>Caricamento in corso...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && schede.length === 0 && <p>Nessuna scheda di lavoro trovata.</p>}

        <div className="px-3">
          {!loading && schede.length > 0 && (
            <>
              {schede.map((scheda) => (
                <div key={scheda.id} className="mt-4">
                  <Button
                    variant="contained"
                    className="w-100"
                    style={{ height: "120px", fontSize: "16px" }}
                    onClick={() => { navigate("/userscheda/" + customerId + "/" + scheda.id); }} // Naviga alla scheda
                  >
                    {/* Converte la data usando moment */}
                    Data: {moment(scheda.dataCreazione.toDate()).format("DD/MM/YYYY")} <br />
                    Targa: {scheda.targa.toUpperCase()} <br /> {/* Mostra la targa in maiuscolo */}
                    Veicolo: {scheda.veicolo} <br />
                    Km : {scheda.chilometraggio} Km
                  </Button>
                </div>
              ))}
              
            </>
          )}
        </div>
        </div>
      </motion.div>
    </>
  );
}
