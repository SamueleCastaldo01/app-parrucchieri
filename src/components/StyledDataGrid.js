// components/StyledDataGrid.jsx
import { styled, createTheme } from "@mui/material/styles";
import { DataGrid } from "@mui/x-data-grid";

export const PRIMARY = "#3a51b0";

const rowAlt = "#fafbff";   // righe alternate chiarissime
const hoverBg = "rgba(58,81,176,0.06)"; // hover tenue con il tuo primary

// 🎨 Tema MUI light, coerente con la dashboard
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: PRIMARY },
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#6b7280",
    },
    divider: "rgba(17,24,39,0.08)",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: [
      "Inter",
      "system-ui",
      "Segoe UI",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif",
    ].join(","),
  },
});

// 🎛️ DataGrid stilizzata
const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: "1px solid rgba(17,24,39,0.08)",
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  "--DataGrid-cellOutline": "none",

  // ✅ Header (colore PRIMARY + testo bianco)
  "& .MuiDataGrid-columnHeaders, & .MuiDataGrid-columnHeader": {
    backgroundColor: PRIMARY + " !important",
    color: "#fff",
    borderBottom: "none",
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 700,
    color: "#fff",
  },
  "& .MuiDataGrid-iconSeparator": {
    display: "none",
  },
  "& .MuiDataGrid-columnHeader .MuiSvgIcon-root, \
     .MuiDataGrid-sortIcon, \
     .MuiDataGrid-filterIcon, \
     .MuiDataGrid-menuIcon": {
    color: "#fff",
  },

  // ✅ Righe
  "& .MuiDataGrid-row": {
    "&:nth-of-type(odd) .MuiDataGrid-cell": { backgroundColor: rowAlt },
    "&:hover .MuiDataGrid-cell": { backgroundColor: hoverBg },
  },

  // ✅ Celle
  "& .MuiDataGrid-cell": {
    borderBottom: "1px solid rgba(17,24,39,0.06)",
    outline: "none",
  },
  "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within": {
    outline: "none",
  },

  // ✅ Checkbox selezione
  "& .MuiCheckbox-root.Mui-checked": {
    color: "#fff",
  },

  // ✅ Footer
  "& .MuiDataGrid-footerContainer": {
    backgroundColor: "#f5f7fb",
    borderTop: "1px solid rgba(17,24,39,0.08)",
  },
}));

export { StyledDataGrid, theme };
