// components/Paywall.jsx
import CheckoutButton from "./CheckoutButton";

export default function Paywall() {
  // Sostituisci con i TUOI ID da Stripe (modalità test o live coerente)
  const plans = [
    { priceId: "price_1RxBIPAsIThbFbZomhCS4WuY",  label: "Attiva Piano Pro  — €20/mese" },
  ];
  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
      <h3>Abbonati per sbloccare l’app</h3>
      <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
        {plans.map(p => <CheckoutButton key={p.priceId} {...p} />)}
      </div>
    </div>
  );
}
