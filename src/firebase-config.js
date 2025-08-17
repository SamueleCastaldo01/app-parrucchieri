import { initializeApp } from "firebase/app";
import { collection, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Configurazione Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};


// Inizializza Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const providerGoogle = new GoogleAuthProvider();
export const messaging = getMessaging(app);


export const requestForToken = () => {
  return getToken(messaging, { vapidKey: process.env.VITE_APP_VAPID_KEY })
    .then((currentToken) => {
      if (currentToken) {
        console.log("current token for client: ", currentToken);
        // Perform any other neccessary action with the token
      } else {
        // Show permission request UI
        console.log("No registration token available. Request permission to generate one.");
      }
    })
    .catch((err) => {
      console.log("An error occurred while retrieving token. ", err);
    });
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("payload", payload);
      resolve(payload);
    });
  });

export async function getNotificationToken() {
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.VITE_APP_VAPID_KEY, // Chiave VAPID da Firebase Console
    });
    if (token) {
      //console.log("FCM Token:", token); // <-- Stampa il token in console
    } else {
      console.log("Nessun token disponibile. Permessi non concessi.");
    }
  } catch (err) {
    console.log("Errore nel recupero del token", err);
  }
}


// Funzioni di autenticazione
export function signup(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function forgotPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
