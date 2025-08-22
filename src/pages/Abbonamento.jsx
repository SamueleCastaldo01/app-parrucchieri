import SubscriptionsPanel from "../components/SubscriptionsPanel";
import Paywall from "../components/Paywall";

export default function Abbonamento() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Abbonamento richiesto</h2>
      <p>Per continuare, attiva un piano. Gli utenti del negozio non vengono bloccati.</p>
      <SubscriptionsPanel />
      <Paywall />
    </div>
  );
}