import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AccountProvider } from "./store/account/AccountContext";
import { TenantProvider } from "./store/tenant/TenantContext";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <AccountProvider>
      <TenantProvider>
        <App />
      </TenantProvider>
    </AccountProvider>
  </React.StrictMode>
);
