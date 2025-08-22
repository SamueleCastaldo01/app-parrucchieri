// hooks/useSubscriptionStatus.js
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

export function useSubscriptionStatus() {
  const [state, setState] = useState({
    authReady: false,
    loading: true,
    active: false,
    cancelAtPeriodEnd: false,
    currentPeriodEndMs: null,
    daysLeft: null,
    status: null,
  });

  useEffect(() => {
    const auth = getAuth();
    // 1) aspetta che Firebase Auth sia pronto
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setState(s => ({ ...s, authReady: true, loading: false, active: false, status: null }));
        return;
      }

      setState(s => ({ ...s, authReady: true, loading: true }));

      // 2) ascolta TUTTE le subscription e scegli quella "migliore"
      const db = getFirestore();
      const colRef = collection(db, "customers", user.uid, "subscriptions");

      const unsubSub = onSnapshot(colRef, (snap) => {
        const now = Date.now();
        const all = snap.docs.map(d => d.data());

        // a) attive/trialing e non scadute
        const activeOnes = all.filter(s => {
          const sec = s.current_period_end;
          const endMs = typeof sec === "number" ? (sec < 1e12 ? sec * 1000 : sec) : null;
          const okWindow = endMs ? endMs > now : true; // se manca il timestamp, NON bloccare
          return ["active", "trialing"].includes(s.status) && okWindow;
        });

        // b) se non ne troviamo, cerca "cancel_at_period_end = true" ma ancora nel periodo
        let chosen = activeOnes[0] || null;
        if (!chosen) {
          const canceledAtEnd = all.find(s => {
            const sec = s.current_period_end;
            const endMs = typeof sec === "number" ? (sec < 1e12 ? sec * 1000 : sec) : null;
            return s.cancel_at_period_end === true && endMs && endMs > now;
          });
          if (canceledAtEnd) chosen = canceledAtEnd;
        }

        // c) calcola giorni rimasti
        const sec = chosen?.current_period_end;
        const endMs = typeof sec === "number" ? (sec < 1e12 ? sec * 1000 : sec) : null;
        const daysLeft = endMs ? Math.max(0, Math.ceil((endMs - now) / (1000*60*60*24))) : null;

        setState({
          authReady: true,
          loading: false,
          active: !!chosen && ["active", "trialing"].includes(chosen.status),
          cancelAtPeriodEnd: !!chosen?.cancel_at_period_end,
          currentPeriodEndMs: endMs,
          daysLeft,
          status: chosen?.status || null,
        });
      }, () => {
        setState({
          authReady: true,
          loading: false,
          active: false,
          cancelAtPeriodEnd: false,
          currentPeriodEndMs: null,
          daysLeft: null,
          status: null,
        });
      });

      return () => unsubSub();
    });

    return () => unsubAuth();
  }, []);

  return state;
}
