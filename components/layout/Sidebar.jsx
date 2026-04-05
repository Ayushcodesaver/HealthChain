import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAccount } from "wagmi";
import {
  Shield,
  LayoutDashboard,
  Calendar,
  Users,
  Syringe,
  FileText,
  MessageSquare,
  User,
  Pill,
  ClipboardList,
  ShoppingBag,
  History,
  BarChart3,
  UserCog,
  PlusCircle,
  BadgeCheck,
  UserPlus,
} from "lucide-react";
import { cn } from "../common/cn";

const BrandBlock = () => (
  <div className="flex items-center gap-3 px-2">
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25">
      <Shield className="h-6 w-6" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-lg font-bold tracking-tight text-slate-900">
        HealthChain
      </p>
      <p className="truncate text-xs text-slate-500">Medical DApp Platform</p>
    </div>
  </div>
);

const DOCTOR_NAV = [
  { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctor/appointments", label: "My Appointments", icon: Calendar },
  { href: "/doctor/patients", label: "Patients List", icon: Users },
  { href: "/doctor/prescribe", label: "Prescribe Medicine", icon: Syringe },
  { href: "/doctor/records", label: "Medical Records", icon: FileText },
  { href: "/chat", label: "Messages", icon: MessageSquare },
  { href: "/doctor/profile", label: "Profile", icon: User },
  { href: "/doctor/register", label: "Register", icon: UserPlus },
];

const PATIENT_NAV = [
  { href: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/patient/appointment", label: "Appointments", icon: Calendar },
  { href: "/patient/medicines", label: "Medicines", icon: Pill },
  { href: "/patient/prescriptions", label: "Prescriptions", icon: ClipboardList },
  { href: "/patient/orders", label: "Orders", icon: ShoppingBag },
  { href: "/patient/history", label: "History", icon: History },
  { href: "/chat", label: "Messages", icon: MessageSquare },
  { href: "/patient/profile", label: "Profile", icon: User },
  { href: "/patient/register", label: "Register", icon: UserPlus },
];

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "Appointments", icon: Calendar },
  { href: "/admin/doctors", label: "Doctors", icon: UserCog },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/medicines/add", label: "Add Medicine", icon: PlusCircle },
  { href: "/chat", label: "Messages", icon: MessageSquare },
];

function roleFromPath(pathname) {
  if (pathname.startsWith("/doctor")) return "doctor";
  if (pathname.startsWith("/patient")) return "patient";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}

function navForRole(role) {
  if (role === "doctor") return DOCTOR_NAV;
  if (role === "patient") return PATIENT_NAV;
  if (role === "admin") return ADMIN_NAV;
  return [];
}

function QuickActionLink({ quick, onNavigate }) {
  const Icon = quick.icon;
  return (
    <Link
      href={quick.href}
      onClick={onNavigate}
      className="mb-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 py-3 text-sm font-semibold text-white shadow-md shadow-teal-500/25 transition hover:shadow-lg"
    >
      <Icon className="h-4 w-4" />
      {quick.label}
    </Link>
  );
}

function quickActionForRole(role) {
  if (role === "doctor")
    return { href: "/doctor/prescribe", label: "Quick Prescribe", icon: Syringe };
  if (role === "patient")
    return { href: "/patient/appointment", label: "Book visit", icon: Calendar };
  if (role === "admin")
    return {
      href: "/admin/medicines/add",
      label: "Add medicine",
      icon: PlusCircle,
    };
  return null;
}

function profileCopy(role, address) {
  const short = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : "Not connected";
  if (role === "doctor")
    return { name: address ? `Dr. ${short}` : "Doctor", title: "Medical Doctor" };
  if (role === "patient")
    return { name: address ? short : "Patient", title: "Patient account" };
  if (role === "admin")
    return { name: address ? short : "Admin", title: "Platform admin" };
  return { name: "Guest", title: "Connect wallet" };
}

const Sidebar = ({ mobileOpen, onNavigate }) => {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const role = roleFromPath(router.pathname);
  const items = navForRole(role);
  const quick = quickActionForRole(role);
  const { name, title } = profileCopy(role, address);

  const content = (
    <>
      <BrandBlock />

      <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-700">
            <User className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <p className="truncate font-semibold text-slate-900">{name}</p>
              {isConnected ? (
                <BadgeCheck className="h-4 w-4 shrink-0 text-teal-600" />
              ) : null}
            </div>
            <p className="text-xs text-slate-500">{title}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {isConnected ? "Verified Account" : "Wallet offline"}
            </div>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto pb-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            router.pathname === href ||
            (href !== "/" && router.pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-r-2 border-teal-500 bg-white text-teal-800 shadow-sm"
                  : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
              )}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-80" />
              {label}
            </Link>
          );
        })}
      </nav>

      {quick ? (
        <QuickActionLink quick={quick} onNavigate={onNavigate} />
      ) : null}

      <div className="mt-auto space-y-2 border-t border-slate-200/80 pt-4">
        <div className="flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-xs font-medium text-slate-600">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Blockchain Connected
        </div>
        <p className="px-1 text-[11px] leading-snug text-slate-400">
          Secure &amp; Encrypted
        </p>
      </div>
    </>
  );

  return (
    <>
      <aside className="hidden min-h-screen w-[272px] shrink-0 flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50/90 py-6 pl-5 pr-4 lg:sticky lg:top-0 lg:flex lg:max-h-screen lg:overflow-y-auto">
        {content}
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={onNavigate}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(88vw,280px)] flex-col border-r border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50 py-6 pl-5 pr-4 shadow-health-lg transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>
    </>
  );
};

export default Sidebar;
