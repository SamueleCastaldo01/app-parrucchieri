import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "../firebase-config"; // Assicurati che il percorso sia corretto
import { useSelector } from "react-redux";
import moment from "moment";
import { motion } from "framer-motion";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress'; // Importa CircularProgress
import { NavMobile } from "../components/NavMobile";
import CarRepairIcon from '@mui/icons-material/CarRepair';
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionSummary, AccordionDetails, TextField } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { successNoty } from "../components/Notify";

export function UserVeicoli() {
  const [veicoli, setVeicoli] = useState([]);
  const [loading, setLoading] = useState(true); // Aggiungi stato per il caricamento
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [scadenze, setScadenze] = useState({});

  const [revisione, setRevisione] = useState({ dataEffettuata: "", dataScadenza: "", conferma: false });
  const [tassaCircolazione, setTassaCircolazione] = useState({ dataEffettuata: "", dataScadenza: "" });
  const [tagliando, setTagliando] = useState({ dataEffettuata: "", dataScadenza: "", conferma: false });
  const [gpl, setGpl] = useState({ dataEffettuata: "", dataScadenza: "" });
  const [metano, setMetano] = useState({ dataEffettuata: "", dataScadenza: "" });
  const [assicurazione, setAssicurazione] = useState({ dataEffettuata: "", dataScadenza: "" });

  // Ottieni l'username dal Redux store
  const username = useSelector((state) => state.userAuth.userDetails?.username);


  useEffect(() => {
    const fetchVeicoli = async () => {
      try {
        if (!username) {
          throw new Error("Username non trovato!");
        }
  
        const customersRef = collection(db, "customersTab");
        const customerQuery = query(customersRef, where("username", "==", username));
        const customerSnapshot = await getDocs(customerQuery);
  
        if (customerSnapshot.empty) {
          throw new Error("Nessun cliente trovato con questo username.");
        }
  
        const customerId = customerSnapshot.docs[0].id;
  
        const veicoliRef = collection(db, "veicoloTab");
        const veicoliQuery = query(veicoliRef, where("idCustomer", "==", customerId));
        const veicoliSnapshot = await getDocs(veicoliQuery);
  
        if (veicoliSnapshot.empty) {
          throw new Error("Nessun veicolo associato trovato.");
        }
  
        const veicoliData = veicoliSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Converti timestamp in stringhe formattate per le date
          scadenzario: Object.fromEntries(
            Object.entries(doc.data().scadenzario || {}).map(([key, value]) => [
              key,
              {
                ...value,
                dataScadenza: value.dataScadenza
                  ? moment(value.dataScadenza.toDate()).format("YYYY-MM-DD")
                  : "",
                dataEffettuata: value.dataEffettuata
                  ? moment(value.dataEffettuata.toDate()).format("YYYY-MM-DD")
                  : "",
              },
            ])
          ),
        }));
  
        setVeicoli(veicoliData);
  
        // Imposta le scadenze iniziali per ogni veicolo
        const initialScadenze = veicoliData.reduce((acc, veicolo) => {
          acc[veicolo.id] = veicolo.scadenzario;
          return acc;
        }, {});
  
        setScadenze(initialScadenze);
      } catch (err) {
        console.error("Errore durante il recupero dei veicoli:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchVeicoli();
  }, [username]);


  useEffect(() => {
    if (veicoli.length > 0) {
      const initialScadenze = veicoli.reduce((acc, veicolo) => {
        acc[veicolo.id] = veicolo.scadenzario; // memorizza le scadenze per ogni veicolo
        return acc;
      }, {});
      setScadenze(initialScadenze); // imposta lo stato con le scadenze iniziali
    }
  }, [veicoli]);


  const handleInputChange = (veicoloId, tipoScadenza, field, value) => {
    setScadenze((prevScadenze) => ({
      ...prevScadenze,
      [veicoloId]: {
        ...prevScadenze[veicoloId],
        [tipoScadenza]: {
          ...prevScadenze[veicoloId][tipoScadenza],
          [field]: value, // Imposta il nuovo valore
          // Resetta "conferma" a false quando viene modificata "dataScadenza"
          ...(field === "dataScadenza" ? { conferma: false } : {}),
        },
      },
    }));
  };


  const handleSaveScadenze = async (veicoloId) => {
    try {
      const veicoloDocRef = doc(db, "veicoloTab", veicoloId);
      const updatedScadenze = {
        scadenzario: Object.fromEntries(
          Object.entries(scadenze[veicoloId]).map(([key, value]) => [
            key,
            {
              ...value,
              dataScadenza: value.dataScadenza ? Timestamp.fromDate(new Date(value.dataScadenza)) : null,
              dataEffettuata: value.dataEffettuata ? Timestamp.fromDate(new Date(value.dataEffettuata)) : null,
            },
          ])
        ),
      };
  
      await updateDoc(veicoloDocRef, updatedScadenze);
      successNoty("Scadenze aggiornate con successo");
    } catch (error) {
      console.error("Errore durante l'aggiornamento delle scadenze:", error);
      alert("Errore durante l'aggiornamento delle scadenze.");
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
        <div style={{ marginTop: "70px", marginBottom: "100px" }} className="mainMobileUser px-4 text-center">
          <h1 className="py-2 rounded rounded-2" style={{ backgroundColor: "#333" }}>
            I tuoi Veicoli <CarRepairIcon style={{fontSize: "40px"}}/>
          </h1>

          {loading && (
            <div style={{ marginTop: "20px" }}>
              <CircularProgress /> {/* Mostra la progress bar durante il caricamento */}
            </div>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}

          {!loading && !error && veicoli.length === 0 && (
            <p>Nessun veicolo trovato per questo utente.</p>
          )}

          <div className="px-3">
            {!loading && veicoli.length > 0 && (
              <>
                {veicoli.map((veicolo) => (
                  <div key={veicolo.id} className="mt-4">
                    <Button
                      onClick={() => {navigate("/userschededilavoro"); localStorage.setItem("userTarga", veicolo.targa)}}
                      className="w-100"
                      style={{ height: "100px", fontSize: "15px" }}
                      variant="contained"
                    >
                      Targa: {veicolo.targa} <br />
                      {veicolo.marca} {veicolo.nomeModello}
                    </Button>

                    {/* Aggiungi il menu a tendina per mostrare le scadenze */}
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <h5>Visualizza Scadenze</h5>
                      </AccordionSummary>
                      <AccordionDetails>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveScadenze(veicolo.id); }}>
                          <div className="row text-start">

                            <div className="col-lg-6 col-md-6 col-sm-12 mt-3 mt-md-0">
                              <h6 className="p-1" style={{backgroundColor: "#333"}}>Revisione</h6>
                            <TextField
                              color="tertiary"
                              className="w-100"
                              label="Revisione - Data Scadenza"
                              variant="outlined"
                              type="date"
                              InputLabelProps={{ shrink: true }}
                              value={scadenze[veicolo.id]?.revisione?.dataScadenza || ""}
                              onChange={(e) => handleInputChange(veicolo.id, "revisione", "dataScadenza", e.target.value)}
                            />
                           </div>
                         
                              
                              <div className="col-lg-6 col-md-6 col-sm-12 mt-3 mt-md-0">
                                <h6 className="p-1" style={{backgroundColor: "#333"}}>Tassa Circolazione</h6>
                                <TextField
                                    color="tertiary"
                                    className="w-100"
                                    label="Tassa Circolazione - Data Scadenza"
                                    variant="outlined"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={scadenze[veicolo.id]?.tassaCircolazione?.dataScadenza || ""}
                                    onChange={(e) => handleInputChange(veicolo.id, "tassaCircolazione", "dataScadenza", e.target.value)}
                                />
                                </div>
                       
              
                                <div className="col-lg-6 col-md-6 col-sm-12 mt-3 mt-md-3">
                                <h6 className="p-1" style={{backgroundColor: "#333"}}> Tagliando</h6>
                                  <TextField
                                      color="tertiary"
                                      className="w-100"
                                      label="Tagliando - Data Scadenza"
                                      variant="outlined"
                                      type="date"
                                      InputLabelProps={{ shrink: true }}
                                      value={scadenze[veicolo.id]?.tagliando?.dataScadenza || ""}
                                      onChange={(e) => handleInputChange(veicolo.id, "tagliando", "dataScadenza", e.target.value)}
                                  />
                                  </div>
                          
          
                              <div className="col-lg-6 col-md-6 col-sm-12 mt-3 mt-md-3">
                                <h6 className="p-1" style={{backgroundColor: "#333"}}>Serbatoio Gpl</h6>
                                  <TextField
                                      color="tertiary"
                                      className="w-100"
                                      label="Serbatoio Gpl - Data Scadenza"
                                      variant="outlined"
                                      type="date"
                                      InputLabelProps={{ shrink: true }}
                                      value={scadenze[veicolo.id]?.gpl?.dataScadenza || ""}
                                      onChange={(e) => handleInputChange(veicolo.id, "gpl", "dataScadenza", e.target.value)}
                                  />
                              </div>
                   
           
                              <div className="col-lg-6 col-md-6 col-sm-12 mt-3 mt-md-3">
                              <h6 className="p-1" style={{backgroundColor: "#333"}}>Bombolea Metano</h6>
                                  <TextField
                                      color="tertiary"
                                      className="w-100"
                                      label="Bombola Metano - Data Scadenza"
                                      variant="outlined"
                                      type="date"
                                      InputLabelProps={{ shrink: true }}
                                      value={scadenze[veicolo.id]?.metano?.dataScadenza || ""}
                                      onChange={(e) => handleInputChange(veicolo.id, "metano", "dataScadenza", e.target.value)}
                                  />
               
                                </div>
                             
         
                              <div className="col-lg-6 col-md-6 col-sm-12 mt-3 mt-md-3">
                              <h6 className="p-1" style={{backgroundColor: "#333"}}>Assicurazione</h6>
                                  <TextField
                                      color="tertiary"
                                      className="w-100"
                                      label="Assicurazione - Data Scadenza"
                                      variant="outlined"
                                      type="date"
                                      InputLabelProps={{ shrink: true }}
                                      value={scadenze[veicolo.id]?.assicurazione?.dataScadenza || ""}
                                      onChange={(e) => handleInputChange(veicolo.id, "assicurazione", "dataScadenza", e.target.value)}
                                  />
                 
                              </div>
                          </div>
                        
                          <Button className="mt-4" type="submit" variant="contained">Salva</Button>
                        </form>
                        
                      </AccordionDetails>
                    </Accordion>
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
