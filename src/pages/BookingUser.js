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
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import moment from "moment";
import "moment/locale/it";
moment.locale("it");

export function BookingUser() {
  const [employee, setEmployee] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const navigate = useNavigate();
  const email = useSelector((state) => state.userAuth.userDetails?.email);

  // Fetch dei dipendenti
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
        const serviceQuery = query(serviceCollection, orderBy("dataCreazione", "desc"), limit(100));
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

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  // Funzioni per i dipendenti
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
    const dayOfWeek = date.format("dddd");
    const normalizedDay = giorniSettimana[dayOfWeek];
    if (!normalizedDay) return [];
    const workHours = employee.orariDiLavoro?.[normalizedDay];
    if (!workHours) return [];
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

          {/* Selezione dei dipendenti */}
          {selectedDate && (
            <EmployeeSelection
              employees={employee}
              selectedDate={selectedDate}
              isOnVacation={isOnVacation}
              getWorkingHours={getWorkingHours}
              selectedService={selectedService}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}
