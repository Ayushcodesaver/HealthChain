import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function truncateAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 5)}…${addr.slice(-4)}`;
}

const CustomConnectButton = ({ className = "" }) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted;
        if (!ready) {
          return (
            <div
              className={`h-10 w-44 animate-pulse rounded-full bg-emerald-100/80 ${className}`}
              aria-hidden
            />
          );
        }

        if (!account || !chain) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className={`rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition hover:shadow-lg ${className}`}
            >
              Connect wallet
            </button>
          );
        }

        const bal = account.displayBalance ?? "";
        const label = `${truncateAddress(account.address)}${bal ? ` (${bal})` : ""}`;

        return (
          <button
            type="button"
            onClick={openAccountModal}
            className={`inline-flex max-w-full items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100 sm:text-sm ${className}`}
            title={account.address}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate">{label}</span>
          </button>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
