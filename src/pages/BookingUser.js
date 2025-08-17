import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button, Box } from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { successNoty, errorNoty } from "../components/Notify";
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
  // Stati per la selezione dell'orario
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  // Stato per le prenotazioni già fatte nella data selezionata
  const [bookings, setBookings] = useState([]);

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

  // Quando la data selezionata cambia, preleviamo tutte le prenotazioni per quella data
  useEffect(() => {
    if (!selectedDate) return;
    const fetchBookings = async () => {
      try {
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("date", "==", selectedDate.format("DD-MM-YYYY"))
        );
        const snapshot = await getDocs(q);
        const bookingsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setBookings(bookingsList);
      } catch (error) {
        console.error("Errore nel recupero delle prenotazioni: ", error);
      }
    };
    fetchBookings();
    // Reset degli stati orari al cambio data
    setSelectedEmployee(null);
    setSelectedTime(null);
  }, [selectedDate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Funzione per salvare la selezione di orario e dipendente (passata a EmployeeSelection)
  const onTimeSelect = (emp, time) => {
    setSelectedEmployee(emp);
    setSelectedTime(time);
  };

  // La prenotazione verrà eseguita quando si clicca sul pulsante "Prenota"
  const handleBooking = async () => {
    if (!selectedDate || !selectedService || !selectedEmployee || !selectedTime) {
      errorNoty("Seleziona una data, un servizio e un orario!");
      return;
    }
  
    // Recupera il nome e il cognome dell'utente dall'email
    let userName = "";
    let userSurname = "";
    try {
      const usersRef = collection(db, "user");
      const userQuery = query(usersRef, where("email", "==", email));
      const userSnapshot = await getDocs(userQuery);
  
      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();
        userName = userData.nome || "";
        userSurname = userData.cognome || "";
      }
    } catch (error) {
      console.error("Errore nel recupero dei dati utente:", error);
      errorNoty("Errore nel recupero dei dati utente.");
      return;
    }
  
    const startTime = moment(selectedTime, "HH:mm");
    const endTime = startTime.clone().add(selectedService.durata, "minutes");
  
    const bookingData = {
      employeeId: selectedEmployee.id,
      employeeUsername: selectedEmployee.username,
      serviceId: selectedService.id,
      service: selectedService.servizio,
      date: selectedDate.format("DD-MM-YYYY"),
      startTime: startTime.format("HH:mm"),
      endTime: endTime.format("HH:mm"),
      userEmail: email,
      userName: userName,
      userSurname: userSurname,
      createdAt: moment().toISOString(),
    };
  
    const bookingsRef = collection(db, "bookings");
  
    // Controlla se l'orario è già prenotato per il dipendente
    const timeConflictQuery = query(
      bookingsRef,
      where("employeeId", "==", bookingData.employeeId),
      where("date", "==", bookingData.date),
      where("startTime", "<", bookingData.endTime),
      where("endTime", ">", bookingData.startTime)
    );
    const existingBookings = await getDocs(timeConflictQuery);
    if (!existingBookings.empty) {
      errorNoty("Orario non disponibile! Scegli un altro orario.");
      return;
    }
  
    // Controlla se lo stesso utente ha già prenotato per quella data
    const userBookingQuery = query(
      bookingsRef,
      where("userEmail", "==", bookingData.userEmail),
      where("date", "==", bookingData.date)
    );
    const userBookings = await getDocs(userBookingQuery);
    if (!userBookings.empty) {
      errorNoty("Hai già effettuato una prenotazione per questa data.");
      return;
    }
  
    try {
      await addDoc(bookingsRef, bookingData);
      successNoty("Prenotazione confermata!");
      navigate("/bookinglistuser");
      setSelectedEmployee(null);
      setSelectedTime(null);
    } catch (error) {
      console.error("Errore durante la prenotazione: ", error);
      errorNoty("Errore nella prenotazione. Riprova.");
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

  // Funzione per calcolare gli orari di lavoro
  // Genera time slot in intervalli di 30 minuti (di base) e li filtra in base alle prenotazioni
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
      // Genera slot ogni 30 minuti
      const startTime = moment(workHours.inizio, "HH:mm");
      const endTime = moment(workHours.fine, "HH:mm");
      const slots = [];
      let current = moment(startTime);
      while (current.isBefore(endTime)) {
        slots.push(current.format("HH:mm"));
        current.add(30, "minutes");
      }

      // Seleziona i time slot disponibili escludendo quelli già occupati per l'employee
      const availableSlots = slots.filter((slot) => {
        // Se non è stato selezionato un servizio, non filtra ulteriormente
        if (!selectedService) return true;
        const slotStart = moment(slot, "HH:mm");
        const slotEnd = slotStart.clone().add(selectedService.durata, "minutes");

        // Filtra le prenotazioni per questo dipendente
        const empBookings = bookings.filter(b => b.employeeId === employee.id);
        // Se il nuovo intervallo si sovrappone a una prenotazione, escludilo
        const isOccupied = empBookings.some(b => {
          const bStart = moment(b.startTime, "HH:mm");
          const bEnd = moment(b.endTime, "HH:mm");
          return slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart);
        });
        return !isOccupied;
      });

      return availableSlots;
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
        <div className="px-2" style={{ marginTop: "30px" }}>
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
                bookings={bookings} // Passiamo le prenotazioni correnti
              />
            )
          )}
        </div>
        <div className="position-absolute w-100 px-2 d-flex justify-content-center" style={{ bottom: "65px" }}>
          <Button
            startIcon={<CalendarMonthIcon />}
            style={{ height: "50px", width: "100%" }}
            onClick={handleBooking}
            sx={{
              backgroundColor:
                selectedDate && selectedTime ? "#fea800" : "#e8e7f3",
              color:
                selectedDate && selectedTime ? "#FFFFFF" : "#3d51aa",
              "&:hover": {
                backgroundColor:
                  selectedDate && selectedTime ? "#fea800" : "#e8e7f3"
              }
            }}
          >
            {selectedDate && selectedTime
              ? `Prenotati per il ${selectedDate.format("DD/MM")} - ${selectedTime}`
              : "Prenota"}
          </Button>
        </div>
      </motion.div>
    </>
  );
}
