import React from "react";
import { Box, Button, Avatar } from "@mui/material";
import moment from "moment";

export const EmployeeSelection = ({
  employees,
  selectedDate,
  isOnVacation,
  getWorkingHours,
  selectedService,
  onTimeSelect, 
  selectedEmployee, 
  selectedTime,      
  bookings           
}) => {
  if (!selectedDate) return null;

  const formattedDate = moment(selectedDate).format("ddd D");
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div style={{ textAlign: "left" }}>
      <div className="text-start mb-2 mt-0">
        <h6 className="mb-0 primaryColor fw-bold">Seleziona l'orario:</h6>
      </div>
      <Box
        sx={{
          marginTop: "0px",
          paddingBottom: "30px",
          display: "flex",
          alignItems: "flex-start",
          overflowX: "auto",
          whiteSpace: "nowrap",
          gap: "10px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {employees.map((emp) => {
          const isUnavailable = isOnVacation(emp, selectedDate);
          const workHours = getWorkingHours(emp, selectedDate);

          return (
            <div
              key={emp.id}
              style={{
                minWidth: "150px",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "flex-start",
                paddingBottom: "10px",
              }}
              className="rounded-4 card-employee p-0 pb-1"
            >
              {/* Header con data e servizio selezionato */}
              <div
                className="w-100 text-center rounded-4 rounded-bottom-0 py-2 d-flex flex-column align-items-center"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <h6 className="mb-2 text-white">{capitalizedDate}</h6>
                <h6 className="mb-0 text-white">
                  {selectedService ? selectedService.servizio : "Taglio uomo"}
                </h6>
              </div>

              <div className="mt-2 w-100 text-center">
                <h6>{emp.username}</h6>
              </div>

              <div className="text-center d-flex justify-content-center w-100 mb-2">
                <Avatar alt={emp.username} src={emp.avatar} />
              </div>

              <div className="px-3 w-100 text-center">
                {isUnavailable ? (
                  <h6 className="text-danger">In ferie</h6>
                ) : workHours.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      overflow: "auto",
                      padding: "0",
                      width: "100%",
                      gap: "8px",
                      maxHeight: "200px",
                    }}
                    className="no-scrollbar pb-2"
                  >
                    {workHours.map((time) => {
                      // Verifica se questo orario per questo dipendente è selezionato
                      const isSelected =
                        selectedEmployee?.id === emp.id && selectedTime === time;
                      return (
                      <Button
                        key={time}
                        onClick={() => onTimeSelect(emp, time)}
                        className="w-100 rounded-4 border-0 fw-bold shadow-md"
                        sx={{
                          backgroundColor: isSelected ? "#fea700" : "#e8e7f3", // stesso sfondo del calendario
                          color: isSelected ? "#FFFFFF" : "primaryColor",     // stesso colore testo
                          "&:hover": {
                            backgroundColor: isSelected ? "#fea700" : "#e8e7f3"
                          }
                        }}
                      >
                        {time}
                      </Button>
                      );
                    })}
                  </div>
                ) : (
                  <h6 className="text-danger">Non Disponibile</h6>
                )}
              </div>
            </div>
          );
        })}
      </Box>
    </div>
  );
};
