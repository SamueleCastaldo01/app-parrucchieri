import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Box } from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { NavMobile } from "../components/NavMobile";
import { HorizontalCalendar } from "../components/HorizontalCalendar";
import { EmployeeSelection } from "../components/EmployeeSelection";
import { ServiceSelection } from "../components/ServiceSelection";
import { db } from "../firebase-config";
import {
  collection,
  query,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
  where,
  addDoc
} from "firebase/firestore";
import moment from "moment";
import "moment/locale/it";
moment.locale("it");

export function BookingUser() {
  const [employee, setEmployee] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [storeConfig, setStoreConfig] = useState(null);
  // Nuovi stati per la selezione dell'orario
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

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

        // Imposta il servizio predefinito se esiste
        const defaultService = serviceList.find((service) => service.isDefault);
        if (defaultService) {
          setSelectedService(defaultService);
        }
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
    // Resetta la selezione oraria quando cambia la data
    setSelectedEmployee(null);
    setSelectedTime(null);
  };

  // Funzione per memorizzare la selezione di orario e dipendente
  const onTimeSelect = (emp, time) => {
    setSelectedEmployee(emp);
    setSelectedTime(time);
  };

  // Prenota utilizzando i dati memorizzati
  const handleBooking = async () => {
    if (!selectedDate || !selectedService || !selectedEmployee || !selectedTime) {
      alert("Seleziona una data, un servizio e un orario!");
      return;
    }

    const startTime = moment(selectedTime, "HH:mm");
    const endTime = startTime.clone().add(selectedService.durata, "minutes");

    const bookingData = {
      employeeId: selectedEmployee.id,
      employeeUsername: selectedEmployee.username,
      serviceId: selectedService.id,
      service: selectedService.servizio,
      date: selectedDate.format("YYYY-MM-DD"),
      startTime: startTime.format("HH:mm"),
      endTime: endTime.format("HH:mm"),
      userEmail: email,
      createdAt: moment().toISOString(),
    };

    // Controlla se l'orario è già prenotato
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("employeeId", "==", bookingData.employeeId),
      where("date", "==", bookingData.date),
      where("startTime", "<", bookingData.endTime),
      where("endTime", ">", bookingData.startTime)
    );

    const existingBookings = await getDocs(q);
    if (!existingBookings.empty) {
      alert("Orario non disponibile! Scegli un altro orario.");
      return;
    }

    try {
      await addDoc(bookingsRef, bookingData);
      alert("Prenotazione confermata!");
      // Resetta la selezione oraria dopo la prenotazione
      setSelectedEmployee(null);
      setSelectedTime(null);
    } catch (error) {
      console.error("Errore durante la prenotazione: ", error);
      alert("Errore nella prenotazione. Riprova.");
    }
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

  // Funzione per calcolare gli orari di lavoro, escludendo la pausa pranzo.
  const getWorkingHours = (employee, date) => {
    const dayOfWeek = date.format("dddd");
    const normalizedDay = giorniSettimana[dayOfWeek];
    if (!normalizedDay) return [];

    let workHours = null;
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

          {selectedDate && isStoreOnHoliday(selectedDate) ? (
            <div className="rounded-4 py-3" style={{ backgroundColor: "#DB372D" }}>
              <p className="mb-0">Il negozio è in ferie in questa data.</p>
            </div>
          ) : (
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
                onTimeSelect={onTimeSelect}
                selectedEmployee={selectedEmployee}
                selectedTime={selectedTime}
              />
            )
          )}
        </div>
        <div className="position-absolute w-100 px-2 d-flex justify-content-center" style={{ bottom: "65px" }}>
          <Button
            startIcon={<CalendarMonthIcon />}
            style={{ height: "50px", width: "100%" }}
            variant="contained"
            onClick={handleBooking}
          >
            Prenota
          </Button>
        </div>
      </motion.div>
    </>
  );
}
