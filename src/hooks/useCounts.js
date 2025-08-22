// hooks/useCounts.js
import { useEffect, useState, useMemo } from "react";
import { getFirestore, collection, query, where, onSnapshot } from "firebase/firestore";

/** Conta tutti i documenti di una collezione (client‑side). */
export function useCollectionCount(path) {
  const [count, setCount] = useState({ loading: true, value: 0, error: null });
  useEffect(() => {
    const db = getFirestore();
    const col = collection(db, path);
    const unsub = onSnapshot(col, (snap) => {
      setCount({ loading: false, value: snap.size, error: null });
    }, (e) => setCount({ loading: false, value: 0, error: e.message }));
    return () => unsub();
  }, [path]);
  return count; // {loading, value, error}
}

/** Prenotazioni di OGGI: scegli il campo data (es. "date", "startAt"). I valori devono essere confrontabili con millisecondi. */
export function useTodayBookingsCount(fieldName = "date") {
  const [state, setState] = useState({ loading: true, value: 0, error: null });

  const { startMs, endMs } = useMemo(() => {
    // Calcolo “oggi” in locale. Se preferisci UTC, adegua qui.
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return { startMs: start, endMs: end };
  }, []);

  useEffect(() => {
    const db = getFirestore();
    const col = collection(db, "bookings");

    // Se in DB salvi secondi (tipo 1724000000), usa where in secondi e convertili qui,
    // ma la strada più semplice è salvare sempre millisecondi.
    const qy = query(
      col,
      where(fieldName, ">=", startMs),
      where(fieldName, "<", endMs)
    );

    const unsub = onSnapshot(qy, (snap) => {
      setState({ loading: false, value: snap.size, error: null });
    }, (e) => setState({ loading: false, value: 0, error: e.message }));

    return () => unsub();
  }, [fieldName, startMs, endMs]);

  return state; // {loading, value, error}
}
