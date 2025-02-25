import { styled, createTheme } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';

// Definizione del tema specifico per la tabella
const theme = createTheme({
    palette: {
      mode: 'dark', // Imposta il tema su scuro
      background: {
        default: '#18181B', // Colore di sfondo principale
        paper: '#18181', // Colore di sfondo per i componenti Paper
      },
      text: {
        primary: '#FFFFFF', // Colore del testo primario
      },
    },
    mixins: {
      MuiDataGrid: {
        pinnedBackground: '#18181', // Colore di sfondo per le sezioni appuntate
        containerBackground: '#224072', // Colore di sfondo per l'intestazione e le righe fisse
      },
    },
  });

// Definizione di StyledDataGrid
const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  '& .MuiDataGrid-row': {
    backgroundColor: '#18181',
    '&:hover': {
      backgroundColor: '#18181',
    },
    '&.Mui-selected': {
      backgroundColor: '#18181',
      '&:hover': {
        backgroundColor: '#18181',
      },
    },
  },
  '& .MuiDataGrid-cell': {
    outline: 'none',
    backgroundColor: 'inherit',
  },
  '& .MuiDataGrid-cell:focus': {
    outline: 'none',
  },
  '& .MuiDataGrid-footerContainer': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181',
    padding: '0 10px',
  },
  '& .MuiDataGrid-footer .MuiTypography-root': {
    margin: 0,
  },
  '& .MuiDataGrid-footer': {
    borderTop: 'none',
  },
  '& .MuiDataGrid-filterIcon': {
    zIndex: 10,
  },
  '& .MuiDataGrid-menu': {
  },
}));

export { StyledDataGrid, theme };
