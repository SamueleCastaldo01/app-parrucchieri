import React, { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import moment from "moment";
import "moment/locale/it";

moment.locale("it"); // Imposta la lingua italiana

export function HorizontalCalendar({ onDateSelect }) {
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const today = moment();
    const daysArray = [];
    for (let i = 0; i < 30; i++) {
      daysArray.push(moment().add(i, "days"));
    }
    setDates(daysArray);
    setSelectedDate(today);
    if (onDateSelect) {
      onDateSelect(today);
    }
  }, []);

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        overflowX: "auto", 
        whiteSpace: "nowrap",
        width: "100%",
        maxWidth: "100vw",
        py: 1,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" }
      }}
    >
      {dates.map((date) => (
        <Button
        className="d-flex flex-column py-4 px-0 text-white border-0 rounded-4 me-0"
          key={date.format("DD-MM-YYYY")}
          variant={selectedDate && selectedDate.isSame(date, "day") ? "contained" : "outlined"}
          onClick={() => handleDateClick(date)}
          sx={{ minWidth: 80, mr: 1, flexShrink: 0 }}
        >
          <div style={{ fontSize: "0.7em" }}>{date.format("ddd")}</div>
          <div>{date.format("DD")}</div>
          
        </Button>
      ))}
    </Box>
  );
}
