import React, { useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import Header from "./Header";

function isDashboardRoute(pathname) {
  return /^\/(patient|doctor|admin)(\/|$)/.test(pathname);
}

function roleLabelFromPath(pathname) {
  if (pathname.startsWith("/doctor")) return "doctor";
  if (pathname.startsWith("/patient")) return "patient";
  if (pathname.startsWith("/admin")) return "admin";
  return "guest";
}

const Layout = ({ children }) => {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dashboard = isDashboardRoute(router.pathname);
  const roleLabel = useMemo(
    () => roleLabelFromPath(router.pathname),
    [router.pathname]
  );

  const closeMobile = () => setMobileNavOpen(false);

  if (dashboard) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Head>
          <title>Medivault | Medical DApp Platform</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta
            name="description"
            content="Decentralized healthcare — appointments, prescriptions, and records on-chain."
          />
        </Head>
        <Sidebar
          mobileOpen={mobileNavOpen}
          onNavigate={closeMobile}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            roleLabel={roleLabel}
            onMenuClick={() => setMobileNavOpen(true)}
          />
          <main className="flex-1 overflow-auto px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Head>
        <title>Medivault | Decentralized Healthcare Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Secure and transparent healthcare records on the blockchain."
        />
      </Head>
      <Navbar />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
