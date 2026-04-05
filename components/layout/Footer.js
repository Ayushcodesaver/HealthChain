import React from "react";
import Link from "next/link";
import { Shield, Github, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold text-slate-900">HealthChain</span>
            </Link>
            <p className="mb-6 max-w-sm text-slate-500">
              Securing healthcare workflows with Web3 — patient privacy, verifiable
              credentials, and transparent records aligned with your HealthChain
              dashboard experience.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-slate-400 transition-colors hover:text-teal-600"
              >
                <span className="sr-only">GitHub</span>
                <Github className="h-6 w-6" />
              </a>
              <a
                href="#"
                className="text-slate-400 transition-colors hover:text-teal-700"
              >
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Portals
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/patient"
                  className="text-slate-500 transition-colors hover:text-teal-600"
                >
                  Patient Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/doctor"
                  className="text-slate-500 transition-colors hover:text-teal-600"
                >
                  Doctor Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/admin"
                  className="text-slate-500 transition-colors hover:text-teal-600"
                >
                  Administration
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-900">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/medicines"
                  className="text-slate-500 transition-colors hover:text-teal-600"
                >
                  Medicines
                </Link>
              </li>
              <li>
                <Link
                  href="/doctors"
                  className="text-slate-500 transition-colors hover:text-teal-600"
                >
                  Our Doctors
                </Link>
              </li>
              <li>
                <Link
                  href="/chat"
                  className="text-slate-500 transition-colors hover:text-teal-600"
                >
                  Support Chat
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 md:flex-row">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} HealthChain DApp. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm text-slate-400">
            <a href="#" className="hover:text-slate-800">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-800">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
