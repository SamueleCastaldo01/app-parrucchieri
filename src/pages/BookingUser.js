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
        <div className="px-3" style={{ marginTop: "70px" }}>
          <div className="py-2" style={{ backgroundColor: "#333", color: "#fff" }}>
            <h1 className="rounded rounded-2">Prenotazione</h1>
          </div>

          {/* Calendario orizzontale */}
          <HorizontalCalendar onDateSelect={handleDateSelect} />

          {/* Selezione dei dipendenti */}
          {selectedDate && (
            <div style={{ marginTop: "20px", textAlign: "left" }}>
              <Typography variant="h6">Dipendenti disponibili il {selectedDate.format("DD-MM-YYYY")}</Typography>

              <Box
                sx={{
                  display: "flex",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  py: 2,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {employee.map((emp) => {
                  const isUnavailable = isOnVacation(emp, selectedDate);
                  const workHours = getWorkingHours(emp, selectedDate);

                  return (
                    <Card key={emp.id} sx={{ minWidth: 200, mr: 2, flexShrink: 0, textAlign: "center" }}>
                      <CardContent>
                        <Typography variant="h6">{emp.username}</Typography>

                        {isUnavailable ? (
                          <Typography variant="body2" color="error">
                            In ferie
                          </Typography>
                        ) : workHours.length > 0 ? (
                          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 1 }}>
                            {workHours.map((time) => (
                              <Button key={time} variant="outlined" size="small" sx={{ mb: 1, width: "80px" }}>
                                {time}
                              </Button>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Chiuso
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
