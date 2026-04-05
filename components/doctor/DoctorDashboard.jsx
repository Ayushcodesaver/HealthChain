import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import {
  Calendar,
  ClipboardList,
  FileText,
  Stethoscope,
  Users,
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

const DoctorDashboard = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [appts, setAppts] = useState([]);
  const [rxCount, setRxCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const enabled = Boolean(CONTRACT_ADDRESS && address);

  const { data: docRow, isLoading: l1 } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "doctors",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: approved, isLoading: l2 } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isApprovedDoctor",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: appointmentCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "appointmentCount",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  const { data: prescriptionCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "prescriptionCount",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  const exists = docRow?.[0];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !address || !exists || !approved) {
        setAppts([]);
        setRxCount(0);
        return;
      }
      setLoading(true);
      try {
        const n = appointmentCount ? Number(appointmentCount) : 0;
        const list = [];
        for (let i = 1; i <= n; i++) {
          const row = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "appointments",
            args: [BigInt(i)],
          });
          const [, pat, doc] = row;
          if (String(doc).toLowerCase() === address.toLowerCase()) {
            list.push({ id: i, row });
          }
        }
        let rx = 0;
        const pn = prescriptionCount ? Number(prescriptionCount) : 0;
        for (let i = 1; i <= pn; i++) {
          const r = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "prescriptions",
            args: [BigInt(i)],
          });
          const [, , doc] = r;
          if (String(doc).toLowerCase() === address.toLowerCase()) rx += 1;
        }
        if (!cancelled) {
          setAppts(list);
          setRxCount(rx);
        }
      } catch {
        if (!cancelled) {
          setAppts([]);
          setRxCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, address, exists, approved, appointmentCount, prescriptionCount]);

  const patientsSet = useMemo(() => {
    const s = new Set();
    appts.forEach((a) => {
      const pat = a.row[1];
      s.add(String(pat).toLowerCase());
    });
    return s.size;
  }, [appts]);

  const pendingAppts = useMemo(
    () => appts.filter((a) => Number(a.row[5]) === 0).length,
    [appts]
  );

  const [, , name, specialization] = docRow || [];

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Contract not configured</p>
        <p className="mt-2 text-sm">Set NEXT_PUBLIC_CONTRACT_ADDRESS.</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Doctor dashboard">
        <p className="text-sm text-slate-600">Connect your wallet to continue.</p>
      </Card>
    );
  }

  if (l1 || l2) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!exists) {
    return (
      <Card
        title="Not registered as doctor"
        action={
          <Link
            href="/doctor/register"
            className="text-sm font-semibold text-teal-600 hover:text-teal-800"
          >
            Register →
          </Link>
        }
      >
        <p className="text-sm text-slate-600">
          Complete doctor registration and wait for admin approval.
        </p>
      </Card>
    );
  }

  if (!approved) {
    return (
      <Card title={`Dr. ${name || "Applicant"}`} subtitle={specialization || "—"}>
        <Badge variant="warning" dot>
          Pending admin approval
        </Badge>
        <p className="mt-4 text-sm text-slate-600">
          You can update your profile; clinical actions unlock after approval.
        </p>
        <Link
          href="/doctor/profile"
          className="mt-4 inline-block text-sm font-semibold text-teal-600"
        >
          View profile →
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dr. {name}</h1>
        <p className="text-slate-600">{specialization}</p>
        <Badge className="mt-2" variant="success" dot>
          Approved provider
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Appointments"
          value={String(appts.length)}
          icon={<Calendar className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-teal-500 to-cyan-600"
        />
        <StatCard
          title="Pending"
          value={String(pendingAppts)}
          subtitle="Awaiting action"
          icon={<Stethoscope className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Prescriptions"
          value={String(rxCount)}
          icon={<ClipboardList className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Quick links">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { href: "/doctor/appointments", label: "Appointments", icon: Calendar },
              { href: "/doctor/patients", label: "Patients", icon: Users },
              { href: "/doctor/prescribe", label: "Prescribe", icon: ClipboardList },
              { href: "/doctor/records", label: "Records", icon: FileText },
              { href: "/doctor/profile", label: "Profile", icon: Stethoscope },
            ].map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-medium text-slate-800",
                  "hover:border-teal-300 hover:bg-teal-50/50"
                )}
              >
                <Icon className="h-5 w-5 text-teal-600" />
                {label}
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Recent appointments" subtitle={loading ? "Loading…" : "Your latest bookings"}>
          {appts.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments yet.</p>
          ) : (
            <ul className="space-y-2">
              {appts
                .slice()
                .sort((a, b) => Number(b.row[3]) - Number(a.row[3]))
                .slice(0, 6)
                .map((a) => {
                  const st = Number(a.row[5]);
                  return (
                    <li
                      key={a.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm"
                    >
                      <span>
                        #{a.id} · Patient {shortAddr(a.row[1])}
                      </span>
                      <span className="text-xs text-slate-500">
                        {APPOINTMENT_LABELS[st] ?? st}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </Card>
      </div>

      <p className="text-center text-xs text-slate-400">
        Unique patients seen (from appointments): {patientsSet}
      </p>
    </div>
  );
};

export default DoctorDashboard;
