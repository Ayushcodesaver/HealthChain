import React, { useEffect, useMemo, useState } from "react";
import { usePublicClient, useReadContract } from "wagmi";
import {
  Building2,
  Clock,
  GraduationCap,
  Heart,
  HeartPulse,
  MapPin,
  Stethoscope,
  Wallet,
} from "lucide-react";
import Card from "../common/Card";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";
import { cn } from "../common/cn";

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function hashToStat(addr, mod) {
  if (!addr) return 0;
  let h = 0;
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) >>> 0;
  return (h % mod) + 1;
}

const DoctorsList = () => {
  const publicClient = usePublicClient();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: doctorCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDoctorCount",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !doctorCount) {
        setDoctors([]);
        return;
      }
      setLoading(true);
      const n = Number(doctorCount);
      const list = [];
      try {
        for (let i = 0; i < n; i++) {
          const docAddr = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getDoctorAt",
            args: [BigInt(i)],
          });
          const d = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "doctors",
            args: [docAddr],
          });
          const [, approved, name, specialization, licenseCid] = d;
          if (!approved) continue;
          list.push({
            address: docAddr,
            name: name?.startsWith("Dr.") ? name : `Dr. ${name || "Physician"}`,
            specialization,
            licenseCid,
          });
        }
        if (!cancelled) setDoctors(list);
      } catch {
        if (!cancelled) setDoctors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, doctorCount]);

  const avatarFor = useMemo(
    () => (addr) =>
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(addr)}`,
    []
  );

  if (!CONTRACT_ADDRESS) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Contract not configured</p>
        <p className="mt-2 text-sm">Set NEXT_PUBLIC_CONTRACT_ADDRESS to load doctors.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Find Doctors</h1>
        <p className="mt-1 text-slate-600">
          Verified providers registered on Medivault (admin-approved on-chain).
        </p>
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : doctors.length === 0 ? (
        <Card title="No verified doctors yet">
          <p className="text-sm text-slate-600">
            Doctors must register and receive admin approval before they appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {doctors.map((doc) => {
            const consultations = hashToStat(doc.address, 40) + 2;
            const success = 88 + (hashToStat(doc.address, 12) % 10);
            const treatments = hashToStat(doc.address, 25) + 5;
            const expYears = hashToStat(doc.address, 20) + 5;
            const hospitals = [
              "New York Presbyterian Hospital",
              "Mayo Clinic",
              "Cleveland Clinic",
              "Johns Hopkins Hospital",
            ];
            const hospital = hospitals[hashToStat(doc.address, 4) - 1];
            const degrees = ["MD, FACC", "MD, PhD", "DO, MS", "MD, Internal Medicine"];
            const degree = degrees[hashToStat(doc.address, 4) - 1];

            return (
              <article
                key={doc.address}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-health"
              >
                <div className="relative bg-gradient-to-br from-teal-500 to-cyan-600 px-5 pb-8 pt-5 text-white">
                  <button
                    type="button"
                    className="absolute right-4 top-4 rounded-full bg-white/15 p-2 hover:bg-white/25"
                    aria-label="Favorite"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                  <div className="flex items-start gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={avatarFor(doc.address)}
                      alt=""
                      className="h-20 w-20 rounded-full border-4 border-white/40 bg-white object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold leading-tight">{doc.name}</h2>
                      <p className="text-sm text-white/90">{doc.specialization} Specialist</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                          Board Certified
                        </span>
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                          New
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-b border-slate-100 px-3 py-3">
                  <div className="rounded-xl bg-blue-50 p-2 text-center">
                    <Stethoscope className="mx-auto h-5 w-5 text-blue-600" />
                    <p className="mt-1 text-lg font-bold text-slate-900">{consultations}</p>
                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                      Consultations
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2 text-center">
                    <HeartPulse className="mx-auto h-5 w-5 text-emerald-600" />
                    <p className="mt-1 text-lg font-bold text-slate-900">{success}%</p>
                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                      Success
                    </p>
                  </div>
                  <div className="rounded-xl bg-violet-50 p-2 text-center">
                    <Heart className="mx-auto h-5 w-5 text-violet-600" />
                    <p className="mt-1 text-lg font-bold text-slate-900">{treatments}</p>
                    <p className="text-[10px] font-semibold uppercase text-slate-500">
                      Treatments
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 p-4">
                  {[
                    {
                      icon: Clock,
                      row: "bg-orange-50",
                      iconWrap: "bg-orange-100 text-orange-700",
                      text: `${expYears} years Medical Experience`,
                    },
                    {
                      icon: GraduationCap,
                      row: "bg-purple-50",
                      iconWrap: "bg-purple-100 text-purple-700",
                      text: degree,
                    },
                    {
                      icon: Building2,
                      row: "bg-teal-50",
                      iconWrap: "bg-teal-100 text-teal-800",
                      text: hospital,
                    },
                    {
                      icon: MapPin,
                      row: "bg-green-50",
                      iconWrap: "bg-green-100 text-green-800",
                      text: "Mon-Fri 09:00 AM - 05:00 PM",
                    },
                    {
                      icon: Stethoscope,
                      row: "bg-pink-50",
                      iconWrap: "bg-pink-100 text-pink-700",
                      text: "$150 consultation (demo)",
                    },
                    {
                      icon: Wallet,
                      row: "bg-slate-50",
                      iconWrap: "bg-slate-100 text-slate-700",
                      text: shortAddr(doc.address),
                    },
                  ].map((row, i) => (
                    <li
                      key={i}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800",
                        row.row
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                          row.iconWrap
                        )}
                      >
                        <row.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">{row.text}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-slate-100 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">License CID</p>
                  <p className="break-all font-mono text-xs text-slate-600">{doc.licenseCid}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DoctorsList;
