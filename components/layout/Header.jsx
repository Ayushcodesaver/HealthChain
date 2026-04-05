import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Shield,
  Bell,
  UserRound,
  Menu,
  BadgeCheck,
} from "lucide-react";
import CustomConnectButton from "./CustomConnectButton";
import { cn } from "../common/cn";

const BrandMark = () => (
  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/30">
    <Shield className="h-5 w-5" strokeWidth={2} />
  </div>
);

const Header = ({ roleLabel = "guest", onMenuClick, className = "" }) => {
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[4.25rem] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:px-8",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/" className="hidden min-w-0 items-center gap-3 sm:flex">
          <BrandMark />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900 sm:text-base">
              HealthChain
            </p>
            <p className="truncate text-xs text-slate-500">
              Decentralized Healthcare Platform
            </p>
          </div>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs font-semibold text-slate-700 md:flex">
          {time}
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Secure
        </span>
        <span className="hidden items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-800 md:inline-flex">
          <BadgeCheck className="h-3.5 w-3.5" />
          {roleLabel}
        </span>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            5
          </span>
        </button>
        <div className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 sm:flex">
          <UserRound className="h-5 w-5" />
        </div>
        <CustomConnectButton />
      </div>
    </header>
  );
};

export default Header;
