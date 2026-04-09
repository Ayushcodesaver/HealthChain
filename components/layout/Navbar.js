import React, { useState } from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield, Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Medicines", path: "/medicines" },
    { name: "Doctors", path: "/doctors" },
    { name: "Patient", path: "/patient" },
    { name: "Doctor", path: "/doctor" },
    { name: "Admin", path: "/admin" },
    { name: "Chat", path: "/chat" },
  ];

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="group flex cursor-pointer items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25 transition group-hover:shadow-teal-500/40">
              <Shield className="h-6 w-6" />
            </div>
            <span className="bg-gradient-to-r from-teal-600 to-cyan-700 bg-clip-text text-2xl font-bold text-transparent">
              Medivault
            </span>
          </Link>

          <div className="hidden items-center space-x-8 md:flex">
            <ul className="flex space-x-6">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.path}
                    className="text-sm font-medium uppercase tracking-wide text-slate-600 transition-colors hover:text-teal-600"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="border-l border-slate-200 pl-6">
              <ConnectButton showBalance={false} />
            </div>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ConnectButton showBalance={false} accountStatus="avatar" />
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="animate-fadeIn border-b border-slate-200 bg-white px-4 pb-4 pt-2 shadow-lg md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.path}
              onClick={() => setIsMenuOpen(false)}
              className="block rounded-lg px-3 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-teal-50 hover:text-teal-700"
            >
              {link.name}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
