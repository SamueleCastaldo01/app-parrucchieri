import React from "react";
import { Box, Button, Typography } from "@mui/material";

export const ServiceSelection = ({ services, onSelectService }) => {
  if (!services || services.length === 0) return null;

  return (
    <div className="mb-3" style={{ textAlign: "left", marginTop: "10px" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          overflowX: "auto",
          whiteSpace: "nowrap",
          gap: "10px",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {services.map((serv) => (
          <div
            key={serv.id}
            style={{
              minWidth: "150px",
              display: "inline-flex",
              flexDirection: "column",
              alignItems: "flex-start",
              paddingBottom: "10px",
            }}
            className="rounded-4 card-service p-0"
          >
            <Button
              onClick={() => onSelectService(serv)} variant="contained" className="rounded-4"
              sx={{
                backgroundColor: "var(--primary)",
                width: "100%",
                padding: "30px 4px",
                display: "flex",
                justifyContent: "center",
                textAlign: "center",
                textTransform: "none",
              }}
            >
              <div className="d-flex flex-column gap-1">
                <h6 className="mb-0">
                  {serv.servizio}
                </h6>
                <p className="mb-0">
                  durata: {serv.durata} min
                </p>
              </div>
            </Button>
          </div>
        ))}
      </Box>
    </div>
  );
};
