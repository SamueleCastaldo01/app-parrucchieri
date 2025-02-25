import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import { store, persistor } from './redux/store/store';
import { Provider } from 'react-redux'; // Importa il Provider
import { PersistGate } from 'redux-persist/integration/react';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#224072',
    },
    secondary: {
      main: '#333',
    },
    tertiary: {
      main: '#FFFFFF', 
    },
    background: {
      default: '#121212'
    }  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}> {/* Avvolgi con Provider */}
    <ThemeProvider theme={darkTheme}>
      <PersistGate loading={null} persistor={persistor}>
        <CssBaseline />
        <App />
      </PersistGate>
    </ThemeProvider>
  </Provider>
);

// Registrazione del service worker
serviceWorkerRegistration.register();

// Misurazione delle performance
reportWebVitals();
