// components/CheckoutButton.jsx
import { useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";
import Button from "@mui/material/Button";

const PRIMARY = "#3a51b0";

export default function CheckoutButton({ priceId, label }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    const user = getAuth().currentUser;
    if (!user) { alert("Accedi come supervisore."); setLoading(false); return; }

    const db = getFirestore();
    try {
      const ref = await addDoc(
        collection(db, "customers", user.uid, "checkout_sessions"),
        {
          price: priceId,
          allow_promotion_codes: true,
          success_url: `${window.location.origin}/success`,
          cancel_url: `${window.location.origin}/cancel`,
        }
      );
      onSnapshot(ref, (snap) => {
        const data = snap.data();
        if (!data) return;
        if (data.error) {
          console.error("Stripe Checkout error:", data.error);
          alert("Stripe error: " + data.error.message);
          setLoading(false);
        }
        if (data.url) window.location.assign(data.url);
      });
    } catch (e) {
      console.error(e);
      alert("Errore Firestore: " + e.message);
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      onClick={handleCheckout}
      disabled={loading}
      sx={{
        bgcolor: PRIMARY,
        "&:hover": { bgcolor: "#2f4098" },
        px: 4,
        py: 1.5,
        borderRadius: 2,
        fontWeight: 700,
        fontSize: "1rem",
        minWidth: 220,
      }}
    >
      {loading ? "Caricamento..." : label}
    </Button>
  );
}
