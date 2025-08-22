import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function Success() {
  const navigate = useNavigate();
  const [subStatus, setSubStatus] = useState({ loading: true, status: null });

  // (Opzionale ma utile) ascolta l'ultima subscription per mostrare stato aggiornato
  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) { setSubStatus({ loading: false, status: null }); return; }
    const db = getFirestore();
    const q = query(
      collection(db, "customers", user.uid, "subscriptions"),
      orderBy("created", "desc"),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      const d = snap.docs[0]?.data();
      setSubStatus({ loading: false, status: d?.status || null });
    }, () => setSubStatus({ loading: false, status: null }));
    return () => unsub();
  }, []);

  const goPortal = async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) return navigate("/");
      const createPortalLink = httpsCallable(getFunctions(), "ext-firestore-stripe-payments-createPortalLink");
      const { data } = await createPortalLink({ returnUrl: window.location.origin });
      window.location.assign(data.url);
    } catch (e) {
      alert("Impossibile aprire il portale di fatturazione: " + e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-[rgb(249,250,251)]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 sm:mb-6 w-20 h-20 rounded-full flex items-center justify-center"
               style={{ background: "rgba(76, 175, 80, 0.1)" }}>
            <CheckCircleOutlineIcon style={{ fontSize: 44, color: "#2e7d32" }} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
            Pagamento riuscito!
          </h1>
          <p className="text-gray-600 mb-4">
            Grazie 🙌 Il tuo abbonamento è stato attivato correttamente.
          </p>

          {!subStatus.loading && (
            <div className="text-sm text-gray-500 mb-6">
              Stato abbonamento:{" "}
              <span className="font-medium text-gray-800">
                {subStatus.status ?? "in aggiornamento…"}
              </span>
            </div>
          )}

          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              sx={{ py: 1.25 }}
            >
              Vai alla Dashboard
            </Button>
            <Button
              variant="outlined"
              onClick={goPortal}
              sx={{ py: 1.25 }}
            >
              Gestisci abbonamento
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Se la pagina non si aggiorna subito, attendi qualche secondo: la conferma da Stripe può impiegare un attimo.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
