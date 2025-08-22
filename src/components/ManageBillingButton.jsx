// components/ManageBillingButton.jsx
import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth } from "firebase/auth";
import Button from "@mui/material/Button";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import CircularProgress from "@mui/material/CircularProgress";

const PRIMARY = "#3a51b0";

export default function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  const go = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const user = getAuth().currentUser;
      if (!user) return;
      // L'estensione gira in us-central1
      const functions = getFunctions(undefined, "us-central1");
      const createPortalLink = httpsCallable(functions, "ext-firestore-stripe-payments-createPortalLink");
      const { data } = await createPortalLink({ returnUrl: window.location.origin });
      window.location.assign(data.url);
    } catch (e) {
      alert("Impossibile aprire il Portale: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={go}
      variant="contained"
      startIcon={!loading && <SettingsRoundedIcon />}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        borderRadius: 2,
        px: 2.25,
        py: 1.25,
        bgcolor: PRIMARY,
        boxShadow: "0 6px 16px rgba(58,81,176,0.28)",
        "&:hover": { bgcolor: "#2f4098", boxShadow: "0 8px 18px rgba(58,81,176,0.35)" }
      }}
      disabled={loading}
    >
      {loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : "Gestisci abbonamento"}
    </Button>
  );
}
