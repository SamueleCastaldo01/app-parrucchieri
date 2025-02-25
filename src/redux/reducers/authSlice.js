// redux/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isAuth: false,
    user: null, // Puoi anche memorizzare informazioni sull'utente qui
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginU: (state, action) => { // Azione per il login
            state.isAuth = true; // Imposta l'autenticazione a true
            state.user = action.payload; // Salva le informazioni dell'utente
        },
        logoutU: (state) => { // Azione per il logout
            state.isAuth = false; // Imposta l'autenticazione a false
            state.user = null; // Rimuove le informazioni dell'utente
        },
    },
});

// Esporta le azioni e il reducer
export const { loginU, logoutU } = authSlice.actions; // Assicurati di esportare loginU e logoutU
export default authSlice.reducer; // Esporta il reducer di default
