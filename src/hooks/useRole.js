// hooks/useRole.js
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, onSnapshot, getFirestore } from "firebase/firestore";

export function useRole() {
  const [state, setState] = useState({ loading: true, role: "user" });
  useEffect(() => {
    const uid = getAuth().currentUser?.uid;
    if (!uid) { setState({ loading: false, role: "user" }); return; }
    const unsub = onSnapshot(doc(getFirestore(), "users", uid), (d) => {
      setState({ loading: false, role: d.data()?.ruolo || "user" });
    }, () => setState({ loading: false, role: "user" }));
    return () => unsub();
  }, []);
  return state; // {loading, role: "supervisor" | "user"}
}
