// hooks/useActiveSubscription.js
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore";

export function useActiveSubscription() {
  const [res, setRes] = useState({ loading: true, active: false });
  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) { setRes({ loading: false, active: false }); return; }
    const q = query(
      collection(getFirestore(), "customers", uid, "subscriptions"),
      where("status", "in", ["active", "trialing"])
    );
    const unsub = onSnapshot(q, (snap) => {
      const now = Date.now();
      let active = false;
      snap.forEach(d => {
        const s = d.data();
        const end = (s.current_period_end || 0) * 1000; // sec -> ms
        if (end > now) active = true;
      });
      setRes({ loading: false, active });
    }, () => setRes({ loading: false, active: false }));
    return () => unsub();
  }, []);
  return res; // {loading, active}
}
