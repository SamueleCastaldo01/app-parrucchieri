import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { NavMobile } from "../components/NavMobile";
import { HorizontalCalendar } from "../components/HorizontalCalendar";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import { db } from "../firebase-config";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import moment from "moment";
import "moment/locale/it";
import { EmployeeSelection } from "../components/EmployeeSelection";
moment.locale("it");

export function BookingUser() {
  const [employee, setEmployee] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();
  const email = useSelector((state) => state.userAuth.userDetails?.email);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const employeeCollection = collection(db, "employee");
        const employeeQuery = query(employeeCollection, orderBy("dataCreazione", "desc"), limit(100));
        const employeeSnapshot = await getDocs(employeeQuery);
        const employeeList = employeeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
  
        console.log("Dati dipendenti ricevuti:", employeeList); // <-- LOG DEI DATI
        setEmployee(employeeList);
      } catch (error) {
        console.error("Errore nel recupero dei dipendenti: ", error);
      }
    };
  
    fetchEmployee();
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const isOnVacation = (employee, date) => {
    if (!employee.ferie) return false;
    const start = moment(employee.ferie.inizio, "DD-MM-YYYY");
    const end = moment(employee.ferie.fine, "DD-MM-YYYY");
    return date.isBetween(start, end, "day", "[]");
  };

  const giorniSettimana = {
    domenica: "domenica",
    lunedì: "lunedi",
    martedì: "martedi",
    mercoledì: "mercoledi",
    giovedì: "giovedi",
    venerdì: "venerdi",
    sabato: "sabato",
  };

  const getWorkingHours = (employee, date) => {
    const dayOfWeek = date.format("dddd"); // Ottieni il giorno della settimana in italiano
    console.log("Nome giorno in italiano:", dayOfWeek);
  
    const normalizedDay = giorniSettimana[dayOfWeek]; // Converti in formato senza accenti
    console.log("Nome giorno normalizzato:", normalizedDay);
  
    if (!normalizedDay) return [];
  
    const workHours = employee.orariDiLavoro?.[normalizedDay];
  
    if (!workHours) {
      console.warn(`Nessun orario di lavoro trovato per ${employee.username} il ${normalizedDay}`);
      return [];
    }
  
    if (!workHours.chiuso) {
      const start = moment(workHours.inizio, "HH:mm");
      const end = moment(workHours.fine, "HH:mm");
      const times = [];
  
      while (start.isBefore(end)) {
        times.push(start.format("HH:mm"));
        start.add(1, "hour");
      }
  
      return times;
    }
  
    return [];
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
        <div className="px-2" style={{ marginTop: "70px" }}>
          <div className="py-2" style={{ backgroundColor: "#333", color: "#fff" }}>
            <h1 className="rounded rounded-2">Prenotazione</h1>
          </div>

          {/* Calendario orizzontale */}
          <HorizontalCalendar onDateSelect={handleDateSelect} />

          {selectedDate && (
            <EmployeeSelection
              employees={employee}
              selectedDate={selectedDate}
              isOnVacation={isOnVacation}
              getWorkingHours={getWorkingHours}
            />
          )}
 
        </div>
      </motion.div>
    </>
  );
}
