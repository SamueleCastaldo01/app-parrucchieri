import React, { useState, useEffect } from "react";
import "./App.css";
import moment from "moment/moment";
import "moment/locale/it";
import { getNotificationToken } from "./firebase-config";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging"; // Importiamo Firebase Messaging
import Box from '@mui/material/Box';
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import AnimateRoutes from "./components/AnimateRoutes";
import { ToastContainer, toast } from 'react-toastify';
import BottomNavi from "./components/BottomNavigation";
import MiniDrawer from "./components/MiniDrawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled } from "@mui/material/styles";
import MuiBottomNavigationAction from "@mui/material/BottomNavigationAction";
import { tutti, supa } from './components/utenti';
import { useDispatch, useSelector } from "react-redux";
import { loginU, logoutU } from './redux/reducers/authSlice'; 
import { loginUser, logoutUser } from './redux/reducers/userAuthSlice';
import { Button, Snackbar } from '@mui/material';

const BottomNavigationAction = styled(MuiBottomNavigationAction)(`
  color: #f6f6f6;
`);

function App() {
  const matches = useMediaQuery("(max-width:920px)");
  const auth = getAuth();
  const messaging = getMessaging(); // Istanza di Firebase Messaging
  const dispatch = useDispatch();
  const isAuth = useSelector(state => state.auth.isAuth);

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);


useEffect(() => {
  getNotificationToken();  // Genera e stampa il token
}, []);


  useEffect(() => {
    // Monitoraggio stato autenticazione
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        dispatch(loginU({ email: user.email, uid: user.uid }));
      } else {
        dispatch(logoutU());
      }
    });

    // Chiedi il permesso per le notifiche push
    const requestNotificationPermission = async () => {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        try {
          const token = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_FCM_VAPID_KEY
          });
          console.log("FCM Token:", token);
        } catch (error) {
          console.error("Errore nel recupero del token FCM:", error);
        }
      } else {
        console.log("Permesso notifiche non concesso.");
      }
    };

    requestNotificationPermission();

    // Ascolto dei messaggi in foreground
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log("Messaggio ricevuto:", payload);
      toast.info(`📢 Nuova notifica: ${payload.notification?.title}`, {
        position: "top-right",
        autoClose: 5000,
      });
    });

    // Ascolto dell'evento di installazione PWA
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      unsubscribe();
      unsubscribeOnMessage();
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [auth, dispatch, messaging]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      });
    }
  };

  const signUserOut = () => {
    signOut(auth).then(() => {
      dispatch(logoutU());
      dispatch(logoutUser());
    });
  };

  return (
    <Router>
      <Box sx={{ display: "flex", padding: 0 }}>
        <AppContent signUserOut={signUserOut} matches={matches} />
      </Box>

      {matches && <BottomNavi />}
      {/* Snackbar per installazione PWA */}
      <Snackbar
        open={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
        message="Vuoi installare questa app?"
        action={
          <Button color="secondary" onClick={handleInstallClick}>
            Installa
          </Button>
        }
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1300,
        }}
      />
    </Router>
  );
}

function AppContent({ signUserOut, matches }) {
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin";
  const isBlockPage = location.pathname === "/block";
  let ta = supa.includes(localStorage.getItem("uid"));
  const isAuth = useSelector(state => state.auth.isAuth);

  return (
    <>
      {!matches && !isLoginPage && !isBlockPage && ta && isAuth && <MiniDrawer signUserOut={signUserOut} />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          padding: matches ? 0 : "24px",
          paddingTop: "24px",
          overflowX: "hidden",
        }}
      >
        <ToastContainer limit={1} />
        <div style={{ marginTop: !matches && "50px" }}>
          <AnimateRoutes />
        </div>
      </Box>
    </>
  );
}

export default App;
