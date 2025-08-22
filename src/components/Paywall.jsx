// components/Paywall.jsx
import CheckoutButton from "./CheckoutButton";
import Box from "@mui/material/Box";

export default function Paywall() {
  const plans = [
    { priceId: "price_1RxBIPAsIThbFbZomhCS4WuY", label: "Attiva Piano Pro" },
  ];
  return (
    <Box>
      {plans.map((p) => (
        <CheckoutButton key={p.priceId} {...p} />
      ))}
    </Box>
  );
}
