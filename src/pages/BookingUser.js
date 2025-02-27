import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { NavMobile } from "../components/NavMobile";
import { HorizontalCalendar } from "../components/HorizontalCalendar";
import { EmployeeSelection } from "../components/EmployeeSelection";
import { ServiceSelection } from "../components/ServiceSelection";
import { Box } from "@mui/material";
import { db } from "../firebase-config";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import moment from "moment";
import "moment/locale/it";
moment.locale("it");

export function BookingUser() {
  const [employee, setEmployee] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  // Stato per la configurazione dello store
  const [storeConfig, setStoreConfig] = useState(null);
  const navigate = useNavigate();
  const email = useSelector(
    (state) => state.userAuth.userDetails?.email
  );

  // Fetch dei dipendenti
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const employeeCollection = collection(db, "employee");
        const employeeQuery = query(
          employeeCollection,
          orderBy("dataCreazione", "desc"),
          limit(100)
        );
        const employeeSnapshot = await getDocs(employeeQuery);
        const employeeList = employeeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEmployee(employeeList);
      } catch (error) {
        console.error("Errore nel recupero dei dipendenti: ", error);
      }
    };

    fetchEmployee();
  }, []);

  // Fetch dei servizi
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const serviceCollection = collection(db, "service");
        const serviceQuery = query(
          serviceCollection,
          orderBy("dataCreazione", "asc"),
          limit(100)
        );
        const serviceSnapshot = await getDocs(serviceQuery);
        const serviceList = serviceSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(serviceList);
      } catch (error) {
        console.error("Errore nel recupero dei servizi: ", error);
      }
    };

    fetchServices();
  }, []);

  // Fetch della configurazione dello store
  useEffect(() => {
    const fetchStoreConfig = async () => {
      try {
        const configDocRef = doc(db, "configstore", "storeConfig");
        const configSnap = await getDoc(configDocRef);
        if (configSnap.exists()) {
          setStoreConfig(configSnap.data());
        }
      } catch (error) {
        console.error("Errore nel recupero della config dello store: ", error);
      }
    };

    fetchStoreConfig();
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Mappa per normalizzare il nome del giorno (in italiano)
  const giorniSettimana = {
    domenica: "domenica",
    lunedì: "lunedi",
    martedì: "martedi",
    mercoledì: "mercoledi",
    giovedì: "giovedi",
    venerdì: "venerdi",
    sabato: "sabato",
  };

  // Funzione per calcolare gli orari di lavoro, escludendo la fascia della pausa pranzo.
  // Prioritizza la configurazione globale dello store rispetto ai dati del dipendente.
  const getWorkingHours = (employee, date) => {
    const dayOfWeek = date.format("dddd"); // Es: "lunedì"
    const normalizedDay = giorniSettimana[dayOfWeek];
    if (!normalizedDay) return [];
  
    let workHours = null;
    // Se la config globale è presente, la usa...
    if (
      storeConfig &&
      storeConfig.orariDiLavoro &&
      storeConfig.orariDiLavoro[normalizedDay]
    ) {
      workHours = storeConfig.orariDiLavoro[normalizedDay];
    } else if (
      employee.orariDiLavoro &&
      employee.orariDiLavoro[normalizedDay]
    ) {
      workHours = employee.orariDiLavoro[normalizedDay];
    } else {
      return [];
    }
  
    if (!workHours.chiuso) {
      const startTime = moment(workHours.inizio, "HH:mm");
      const endTime = moment(workHours.fine, "HH:mm");
      const times = [];
      let current = moment(startTime);
  
      let lunchStartTime = null;
      let lunchEndTime = null;
      if (
        workHours.pausaPranzo &&
        workHours.pausaPranzo.inizio &&
        workHours.pausaPranzo.fine
      ) {
        lunchStartTime = moment(workHours.pausaPranzo.inizio, "HH:mm");
        lunchEndTime = moment(workHours.pausaPranzo.fine, "HH:mm");
      }
  
      // Genera gli orari a intervalli di un'ora, escludendo la fascia della pausa pranzo.
      while (current.isBefore(endTime)) {
        if (
          lunchStartTime &&
          lunchEndTime &&
          current.isSameOrAfter(lunchStartTime) &&
          current.isBefore(lunchEndTime)
        ) {
          current.add(1, "hour");
          continue;
        }
        times.push(current.format("HH:mm"));
        current.add(1, "hour");
      }
      return times;
    }
    return [];
  };

  // Funzione per verificare se la data selezionata ricade nelle ferie del negozio.
  const isStoreOnHoliday = (date) => {
    if (
      !storeConfig ||
      !storeConfig.ferie ||
      !storeConfig.ferie.inizio ||
      !storeConfig.ferie.fine
    ) {
      return false;
    }
    const holidayStart = moment(storeConfig.ferie.inizio, "DD-MM-YYYY");
    const holidayEnd = moment(storeConfig.ferie.fine, "DD-MM-YYYY");
    return date.isBetween(holidayStart, holidayEnd, "day", "[]");
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
        <div className="px-2" style={{ marginTop: "60px" }}>
          {/* Calendario orizzontale */}
          <HorizontalCalendar onDateSelect={handleDateSelect} />

          {/* Selezione dei servizi */}
          {services.length > 0 && (
            <ServiceSelection
              services={services}
              onSelectService={(serv) => setSelectedService(serv)}
            />
          )}

          {/* Se la data selezionata cade nelle ferie del negozio, mostro un messaggio */}
          {selectedDate && isStoreOnHoliday(selectedDate) ? (
            <div className="rounded-4 py-3" style={{backgroundColor: "#DB372D"}}>
              <p className="mb-0">Il negozio è in ferie in questa data.</p>
            </div>
          ) : (
            // Se la data non è in ferie, mostro la selezione dei dipendenti
            selectedDate && (
              <EmployeeSelection
                employees={employee}
                selectedDate={selectedDate}
                getWorkingHours={getWorkingHours}
                isOnVacation={(emp, date) => {
                  if (!emp.ferie) return false;
                  const start = moment(emp.ferie.inizio, "DD-MM-YYYY");
                  const end = moment(emp.ferie.fine, "DD-MM-YYYY");
                  return date.isBetween(start, end, "day", "[]");
                }}
                selectedService={selectedService}
              />
            )
          )}
        </div>
      </motion.div>
    </>
  );
}
