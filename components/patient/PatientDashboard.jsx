import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import {
  Calendar,
  ClipboardList,
  FileText,
  Pill,
  ShoppingBag,
  Stethoscope,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import StatCard from "../common/StatCard";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";
import { cn } from "../common/cn";

const APPOINTMENT_LABELS = ["Pending", "Confirmed", "Completed", "Cancelled"];

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const PatientDashboard = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [myAppointments, setMyAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  const enabled = Boolean(CONTRACT_ADDRESS && address);

  const { data: isPatient, isLoading: loadingPatientFlag } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isPatient",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: patientRow, isLoading: loadingPatient } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "patients",
    args: address ? [address] : undefined,
    query: { enabled: enabled && isPatient },
  });

  const { data: rxIds = [], isLoading: loadingRx } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientPrescriptionIds",
    args: address ? [address] : undefined,
    query: { enabled: enabled && isPatient },
  });

  const { data: orderIds = [], isLoading: loadingOrders } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientOrderIds",
    args: address ? [address] : undefined,
    query: { enabled: enabled && isPatient },
  });

  const { data: appointmentCount, isLoading: loadingCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "appointmentCount",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !address || !appointmentCount) {
        setMyAppointments([]);
        return;
      }
      setLoadingAppts(true);
      const n = Number(appointmentCount);
      const rows = [];
      try {
        for (let i = 1; i <= n; i++) {
          const row = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "appointments",
            args: [BigInt(i)],
          });
          const [, pat, doc, dateTime, reasonCid, status] = row;
          if (String(pat).toLowerCase() === address.toLowerCase()) {
            rows.push({
              id: i,
              doctor: doc,
              dateTime: Number(dateTime),
              reasonCid,
              status: Number(status),
            });
          }
        }
        if (!cancelled) setMyAppointments(rows);
      } catch {
        if (!cancelled) setMyAppointments([]);
      } finally {
        if (!cancelled) setLoadingAppts(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, address, appointmentCount]);

  const upcoming = useMemo(() => {
    const now = Date.now() / 1000;
    return myAppointments.filter(
      (a) => a.status < 2 && a.dateTime >= now - 86400
    ).length;
  }, [myAppointments]);

  const patientName = patientRow?.[1] || "Patient";

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Contract not configured</p>
        <p className="mt-2 text-sm">
          Set <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_CONTRACT_ADDRESS</code>{" "}
          in your environment.
        </p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Patient dashboard" subtitle="Connect your wallet to continue.">
        <p className="text-sm text-slate-600">
          Use the connect button in the header to link a wallet, then register as a patient if you
          have not already.
        </p>
        <Link
          href="/patient/register"
          className={cn(
            "mt-4 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all",
            "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-md shadow-teal-500/25 hover:shadow-lg"
          )}
        >
          Go to registration
        </Link>
      </Card>
    );
  }

  if (loadingPatientFlag || (isPatient && (loadingPatient || loadingRx || loadingOrders))) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isPatient) {
    return (
      <Card
        title={`Welcome, ${shortAddr(address)}`}
        subtitle="You are not registered as a patient on-chain yet."
        action={
          <Link
            href="/patient/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-500/25 transition-all bg-gradient-to-r from-teal-500 to-cyan-600 hover:shadow-lg"
          >
            Register now
          </Link>
        }
      >
        <p className="text-sm text-slate-600">
          After registration you can book visits, order medicines, and track prescriptions.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Hello, {patientName}
          </h1>
          <p className="mt-1 text-slate-600">
            Your on-chain health activity — appointments, prescriptions, and orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/patient/profile"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-teal-500/40 bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition-all hover:bg-teal-50"
          >
            Profile
          </Link>
          <Link
            href="/patient/appointment"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-500/25 transition-all hover:shadow-lg"
          >
            Book appointment
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Prescriptions"
          value={String(rxIds?.length ?? 0)}
          icon={<ClipboardList className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-teal-500 to-cyan-600"
        />
        <StatCard
          title="Orders"
          value={String(orderIds?.length ?? 0)}
          icon={<ShoppingBag className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
        <StatCard
          title="Active visits"
          value={String(upcoming)}
          subtitle="Upcoming / in progress"
          icon={<Calendar className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-emerald-500 to-teal-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Quick links" subtitle="Common patient actions">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: "/patient/appointment", label: "Appointments", icon: Calendar },
              { href: "/patient/medicines", label: "Medicine shop", icon: Pill },
              { href: "/patient/prescriptions", label: "Prescriptions", icon: ClipboardList },
              { href: "/patient/orders", label: "Orders", icon: ShoppingBag },
              { href: "/patient/history", label: "History", icon: FileText },
              { href: "/doctors", label: "Find doctors", icon: Stethoscope },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800",
                  "transition hover:border-teal-300 hover:bg-teal-50/60"
                )}
              >
                <Icon className="h-5 w-5 text-teal-600" />
                {label}
              </Link>
            ))}
          </div>
        </Card>

        <Card
          title="Recent appointments"
          subtitle={loadingCount || loadingAppts ? "Loading…" : "Latest on-chain bookings"}
        >
          {myAppointments.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments yet.</p>
          ) : (
            <ul className="space-y-3">
              {myAppointments
                .slice()
                .sort((a, b) => b.dateTime - a.dateTime)
                .slice(0, 5)
                .map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        #{a.id} · Dr. {shortAddr(a.doctor)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(a.dateTime * 1000).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="teal" dot>
                      {APPOINTMENT_LABELS[a.status] ?? `Status ${a.status}`}
                    </Badge>
                  </li>
                ))}
            </ul>
          )}
        </Card>
      </div>

      {patientRow?.[3] ? (
        <Card title="Medical record (IPFS)" subtitle="CID stored with your patient profile">
          <p className="break-all font-mono text-xs text-slate-700">{patientRow[3]}</p>
          <a
            className="mt-2 inline-block text-sm font-semibold text-teal-600 hover:text-teal-800"
            href={`https://ipfs.io/ipfs/${patientRow[3]}`}
            target="_blank"
            rel="noreferrer"
          >
            Open on IPFS gateway →
          </a>
        </Card>
      ) : null}
    </div>
  );
};

export default PatientDashboard;
