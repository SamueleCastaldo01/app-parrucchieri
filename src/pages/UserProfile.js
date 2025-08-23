import React, { useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { db } from "../firebase-config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";
import { logoutUser } from "../redux/reducers/userAuthSlice";
import { successNoty } from "../components/Notify";
import { useNavigate } from "react-router-dom";

export function UserProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const email = useSelector((state) => state.userAuth.userDetails?.email);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const auth = getAuth();

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Le password non corrispondono.");
      return;
    }

    try {
      const usersRef = collection(db, "user"); // tua collection (singolare)
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setMessage("Utente non trovato.");
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.password !== oldPassword) {
        setMessage("La password vecchia non è corretta.");
        return;
      }

      const userRef = doc(db, "user", userDoc.id);
      await updateDoc(userRef, { password: newPassword });

      successNoty("Password aggiornata con successo!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Errore durante l'aggiornamento della password: ", error);
      setMessage("Si è verificato un errore. Riprova.");
    }
  };

  const signUserOut = () => {
    signOut(auth).then(() => {
      dispatch(logoutUser());
      navigate("/"); // opzionale: porta l’utente alla home pubblica
    });
  };

  return (
    <Box sx={{ px: 2, pt: 2, pb: 8 }}>
      {/* Header con back */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={800}>
          Impostazioni
        </Typography>
      </Stack>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {/* Card cambio password */}
        <Card sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent sx={{ p: 2.25 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <LockResetIcon />
              <Typography variant="subtitle1" fontWeight={800}>
                Cambia Password
              </Typography>
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Aggiorna la tua password per mantenere il tuo profilo al sicuro.
            </Typography>

            <form onSubmit={handleChangePassword}>
              <Stack spacing={1.25}>
                <TextField
                  label="Password attuale"
                  type={showOld ? "text" : "password"}
                  fullWidth
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowOld((v) => !v)} edge="end">
                          {showOld ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Nuova password"
                  type={showNew ? "text" : "password"}
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNew((v) => !v)} edge="end">
                          {showNew ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Conferma nuova password"
                  type={showConfirm ? "text" : "password"}
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end">
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {message && (
                  <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                    {message}
                  </Typography>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    mt: 0.5,
                    height: 48,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 700,
                  }}
                  fullWidth
                >
                  Salva nuova password
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {/* Divider “sezione” */}
        <Divider sx={{ my: 2 }} />

        {/* Card logout */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 2.25 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <LogoutIcon />
              <Typography variant="subtitle1" fontWeight={800}>
                Esci
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Disconnettiti dal tuo account su questo dispositivo.
            </Typography>
            <Button
              onClick={signUserOut}
              variant="contained"
              color="error"
              fullWidth
              sx={{ height: 48, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
            >
              Esci
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
}
