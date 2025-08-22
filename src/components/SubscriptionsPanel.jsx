import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";

export default function SubscriptionsPanel() {
  const [subs, setSubs] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) { setErr("Non sei loggato."); return; }
    const db = getFirestore();
    const q = query(
      collection(db, "customers", user.uid, "subscriptions"),
      orderBy("created", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
      setSubs(arr);
    }, (e) => setErr(e.message));
    return () => unsub();
  }, []);

  if (err) return <div style={{color:"crimson"}}>Errore: {err}</div>;
  if (!subs) return <div>Carico abbonamenti…</div>;
  if (subs.length === 0) return <div>Nessun abbonamento trovato.</div>;

  return (
    <div style={{marginBottom:16}}>
      <h3>I tuoi abbonamenti</h3>
      <ul style={{paddingLeft:18}}>
        {subs.map(s => {
          const periodEnd = s.current_period_end ? new Date(s.current_period_end*1000).toLocaleString() : "-";
          return (
            <li key={s.id}>
              <b>{s.status}</b> — rinnovo il: {periodEnd}
              {s.items && s.items[0]?.price?.nickname ? ` — ${s.items[0].price.nickname}` : ""}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
