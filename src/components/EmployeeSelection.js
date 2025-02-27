import React from "react";
import { Box, Button, Typography } from "@mui/material";
import moment from "moment";

export const EmployeeSelection = ({
  employees,
  selectedDate,
  isOnVacation,
  getWorkingHours,
  selectedService,
  onBook, // Nuova prop per la prenotazione
}) => {
  if (!selectedDate) return null;

  return (
    <div style={{ textAlign: "left" }}>
      <Box
        sx={{
          marginTop: "25px",
          display: "flex",
          alignItems: "flex-start", // Consente a ciascuna card di avere altezza autonoma
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
          const formattedDate = moment(selectedDate).format("ddd D");
          const capitalizedDate =
            formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1); // Es. "lun 26" → "Lun 26"

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
              className="rounded-4 card-employee p-0"
            >
              {/* Header con data e servizio selezionato */}
              <div
                className="w-100 text-center rounded-4 rounded-bottom-0 py-2 d-flex flex-column align-items-center"
                style={{ backgroundColor: "var(--primary)" }}
              >
                <h6 className="mb-2">{capitalizedDate}</h6>
                <h6 className="mb-0">
                  {selectedService ? selectedService.servizio : "Taglio uomo"}
                </h6>
              </div>

              <div className="mt-2 w-100 text-center">
                <h6>{emp.username}</h6>
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
                    className="no-scrollbar py-2"
                  >
                    {workHours.map((time) => (
                      <Button
                      className="text-white w-100 rounded-4"
                      key={time}
                      variant="contained"
                      onClick={() => onBook(emp, time)} // Qui chiamiamo la funzione di prenotazione
                    >
                      {time}
                    </Button>
                    ))}
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
