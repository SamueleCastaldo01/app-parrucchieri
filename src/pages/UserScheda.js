import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase-config";
import { NavMobile } from "../components/NavMobile";
import { motion } from "framer-motion";
import moment from "moment";

export function UserScheda() {
  const { idcustomer, idscheda } = useParams(); // Prendi i parametri dall'URL
  const [scheda, setScheda] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScheda = async () => {
      try {
        // Recupera il documento della scheda di lavoro con l'ID fornito
        const schedaRef = doc(db, "schedaDiLavoroTab", idscheda);
        const schedaSnap = await getDoc(schedaRef);

        if (!schedaSnap.exists()) {
          throw new Error("Scheda di lavoro non trovata.");
        }

        const schedaData = schedaSnap.data();

        // Verifica se l'idCustomer nel documento è uguale a quello passato tramite URL
        if (schedaData.idCustomer !== idcustomer) {
          throw new Error("Non autorizzato a visualizzare questa scheda.");
        }

        // Imposta i dati della scheda nello stato
        setScheda(schedaData);
      } catch (err) {
        console.error("Errore:", err);
        setError(err.message);
      } finally {
        setLoading(false); // Fine del caricamento
      }
    };

    fetchScheda();
  }, [idcustomer, idscheda]);

  return (
    <>
      <NavMobile /> {/* La navbar rimane sempre visibile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
      >
        <div style={{ marginTop: "70px", marginBottom: "100px" }} className="px-4">
          {loading && <p>Caricamento in corso...</p>} {/* Messaggio di caricamento solo qui */}
          {error && <p style={{ color: "red" }}>{error}</p>} {/* Messaggio di errore */}

          {!loading && scheda && ( // Verifica che non sia in caricamento e che ci sia una scheda
            <div className="text-center">
              <h2>Scheda di lavoro del {moment(scheda.dataCreazione.toDate()).format("DD/MM/YYYY")}</h2>
              <h5 style={{ backgroundColor: "#224072" }}><strong>Targa:</strong> {scheda.targa}</h5>
              <h5>{scheda.veicolo}</h5>
            </div>
          )}

          {/* Ciclo sui dati dell'array "dataScheda" */}
          {!loading && scheda && ( // Mostra i dati della scheda se non è in caricamento e la scheda esiste
            <div className="mt-5">
              <div className="row rounded-2 rounded-bottom-0" style={{ backgroundColor: "#224072" }}>
                <div className="col-10 ps-1"><h5 className="mt-2"><strong>Descrizione</strong></h5></div>
                <div className="col-2 ps-1"><h5 className="mt-2">Qt:</h5></div>
              </div>

              {scheda.dataScheda.map((item, index) => (
                <div className="row" key={index}>
                  <div className="col-10 border border-1"><p className="mb-0 py-2">{item.descrizione}</p></div>
                  <div className="col-2 border border-1 text-center"><p className="mb-0 py-2">{item.qt}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
