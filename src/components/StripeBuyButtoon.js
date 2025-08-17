import React, { useEffect } from "react";

function StripeBuyButton() {
  useEffect(() => {
    // Carica lo script solo una volta
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/buy-button.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <stripe-buy-button
            buy-button-id="buy_btn_1RxBdwAsIThbFbZoQYwqL197"
            publishable-key="pk_test_51RxBCqAsIThbFbZoQpJTqg5Xvj43Jp3j4gUNdngFiTKweMVAPTyPZTTzuLJrebF7GBMw9acm9XutqEBIdQb9GX5x00qm3nRzX6"
          ></stripe-buy-button>
        `,
      }}
    />
  );
}

export default StripeBuyButton;
