import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { NavMobile } from "../components/NavMobile";
import { HorizontalCalendar } from "../components/HorizontalCalendar";

export function BookingUser() {
  const [nome, setNome] = useState("");
  const [cognome, setCognome] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();

  const email = useSelector((state) => state.userAuth.userDetails?.email);

  useEffect(() => {
    // Qui recuperi nome e cognome dal database (già implementato)
  }, [email]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    // Qui potresti eseguire una query per recuperare i dipendenti disponibili per la data selezionata
  };

  return (
    <>
      <NavMobile />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-center"
      >
        <div className="px-3" style={{ marginTop: "70px" }}>
          <div className="py-2" style={{ backgroundColor: "#333" }}>
            <h1 className="rounded rounded-2">Prenotazione</h1>
            <h2>{nome} {cognome}</h2>
          </div>
          {/* Calendario orizzontale con scrollbar nascosta */}
          <HorizontalCalendar onDateSelect={handleDateSelect} />
          {/* Qui sotto puoi mostrare i dipendenti disponibili per la data selezionata */}
          <div style={{ marginTop: "20px" }}>
            {selectedDate && (
              <p>Prenotazioni per: {selectedDate.format("DD-MM-YYYY")}</p>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
