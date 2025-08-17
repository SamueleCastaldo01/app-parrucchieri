// components/StripeBuyButton.js
import React, { useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, onSnapshot } from "firebase/firestore";

const StripeBuyButton = ({ priceId, planName, amount }) => {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Devi essere loggato per fare il checkout!");
      setLoading(false);
      return;
    }

    const db = getFirestore();

    try {
      const docRef = await addDoc(
        collection(db, "customers", currentUser.uid, "checkout_sessions"),
        {
          price: priceId,
          success_url: window.location.origin + "/success",
          cancel_url: window.location.origin + "/cancel",
        }
      );

      onSnapshot(docRef, (snap) => {
        const { error, url } = snap.data();
        if (error) {
          alert(`Errore: ${error.message}`);
          setLoading(false);
        }
        if (url) {
          window.location.assign(url);
        }
      });
    } catch (err) {
      alert(`Errore: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? "Caricamento..." : `Acquista ${planName} - ${amount}€`}
    </button>
  );
};

export default StripeBuyButton;
