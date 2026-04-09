import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePublicClient, useReadContract } from "wagmi";
import {
  ArrowRight,
  Heart,
  HeartPulse,
  Lock,
  Pill,
  Shield,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import {
  FaBolt,
  FaCheckCircle,
  FaNetworkWired,
  FaServer,
  FaShieldAlt,
  FaUserAlt,
  FaUserMd,
} from "react-icons/fa";
import { cn } from "../common/cn";
import { CONTRACT_ABI, CONTRACT_ADDRESS, isContractConfigured } from "@/config/contract";

function StatTile({ icon: Icon, label, value, tint }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg backdrop-blur-md transition hover:bg-white/15",
        tint
      )}
    >
      <div className="mb-3 inline-flex rounded-xl bg-white/15 p-2.5 text-white">
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-3xl font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1 text-sm font-medium text-teal-100/90">{label}</p>
    </div>
  );
}

const LandingPage = () => {
  const publicClient = usePublicClient();
  const [approvedDoctors, setApprovedDoctors] = useState(null);

  const enabled = isContractConfigured();

  const { data: patientCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientCount",
    query: { enabled },
  });

  const { data: doctorCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDoctorCount",
    query: { enabled },
  });

  const { data: medicineCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "medicineCount",
    query: { enabled },
  });

  const { data: appointmentCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "appointmentCount",
    query: { enabled },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || doctorCount == null) {
        setApprovedDoctors(null);
        return;
      }
      const n = Number(doctorCount);
      let ap = 0;
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
          if (d[1]) ap += 1;
        }
        if (!cancelled) setApprovedDoctors(ap);
      } catch {
        if (!cancelled) setApprovedDoctors(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, doctorCount]);

  const fmt = (v) => (v != null && v !== "" ? String(v) : "—");
  const docValue =
    approvedDoctors != null
      ? String(approvedDoctors)
      : CONTRACT_ADDRESS && doctorCount != null
        ? "…"
        : "—";
  const docLabel = "Verified Doctors";

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 pb-24 pt-8 text-white">
        <div className="pointer-events-none absolute -right-24 top-20 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="animate-fadeIn">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-teal-100">
                <Shield className="h-4 w-4 text-teal-300" />
                Blockchain Healthcare Platform
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Revolutionary Healthcare on{" "}
                <span className="bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  Blockchain
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-teal-100/85">
                Experience the future of healthcare with our decentralized platform. Secure medical
                records, verified doctors, and transparent treatment powered by smart contracts and
                IPFS.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/patient/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 px-6 py-3.5 text-base font-bold text-slate-900 shadow-lg shadow-teal-500/30 transition hover:shadow-teal-400/40"
                >
                  <UserPlus className="h-5 w-5" />
                  Register as Patient
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/doctor/register"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-teal-400/50 bg-transparent px-6 py-3.5 text-base font-bold text-white transition hover:bg-white/10"
                >
                  <Stethoscope className="h-5 w-5" />
                  Join as Doctor
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-3 text-sm">
                <Link
                  href="/medicines"
                  className="rounded-xl bg-white/10 px-4 py-2 font-semibold text-teal-50 hover:bg-white/15"
                >
                  View Medicines
                </Link>
                <Link
                  href="/doctors"
                  className="rounded-xl bg-white/10 px-4 py-2 font-semibold text-teal-50 hover:bg-white/15"
                >
                  Find Doctors
                </Link>
                <Link
                  href="/chat"
                  className="rounded-xl bg-white/10 px-4 py-2 font-semibold text-teal-50 hover:bg-white/15"
                >
                  Messages
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <StatTile
                icon={Stethoscope}
                label={docLabel}
                value={docValue}
                tint="ring-1 ring-teal-400/20"
              />
              <StatTile
                icon={HeartPulse}
                label="Active Patients"
                value={fmt(patientCount)}
                tint="ring-1 ring-blue-400/20"
              />
              <StatTile
                icon={Pill}
                label="Medicines Available"
                value={fmt(medicineCount)}
                tint="ring-1 ring-violet-400/20"
              />
              <StatTile
                icon={Heart}
                label="Consultations Done"
                value={fmt(appointmentCount)}
                tint="ring-1 ring-amber-400/20"
              />
            </div>
          </div>

          {!isContractConfigured() ? (
            <p className="mt-10 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Set <code className="rounded bg-black/20 px-1">NEXT_PUBLIC_CONTRACT_ADDRESS</code> to
              show live network stats.
            </p>
          ) : null}

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
            <div className="flex items-center gap-2 text-sm text-teal-100/90">
              <Lock className="h-4 w-4 text-emerald-300" />
              <span className="font-semibold">Join as Doctor</span>
              <span className="text-teal-200/70">— verified onboarding</span>
            </div>
            <Link
              href="/patient"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
            >
              <Heart className="h-4 w-4 text-pink-300" />
              Join as Patient
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-gray-50 py-20" id="portals">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">Choose Your Portal</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Access the Medivault platform through role-specific interfaces designed for your
              specialized needs — now unified as <strong>Medivault</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl card-hover">
              <div className="patient-gradient flex h-32 items-center justify-center">
                <FaUserAlt className="medical-icon text-5xl text-white" />
              </div>
              <div className="p-8 text-center">
                <h3 className="mb-3 text-2xl font-bold text-gray-900">Patient Portal</h3>
                <p className="mb-8 h-20 text-gray-600">
                  View your medical history, manage your profile, and grant exclusive access to
                  healthcare providers.
                </p>
                <Link
                  href="/patient"
                  className="block w-full rounded-xl py-3 px-4 font-semibold text-white patient-gradient transition-opacity hover:opacity-90"
                >
                  Enter Patient Area
                </Link>
              </div>
            </div>

            <div className="relative transform overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl card-hover md:-translate-y-4">
              <div className="absolute right-0 top-0 m-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold uppercase text-yellow-900">
                Popular
              </div>
              <div className="doctor-gradient flex h-32 items-center justify-center">
                <FaUserMd className="medical-icon text-5xl text-white" />
              </div>
              <div className="p-8 text-center">
                <h3 className="mb-3 text-2xl font-bold text-gray-900">Doctor Portal</h3>
                <p className="mb-8 h-20 text-gray-600">
                  Access assigned patient records comprehensively, add prescriptions effortlessly,
                  and verify health history.
                </p>
                <Link
                  href="/doctor"
                  className="block w-full rounded-xl py-3 px-4 font-semibold text-white doctor-gradient transition-opacity hover:opacity-90"
                >
                  Enter Doctor Area
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl card-hover">
              <div className="admin-gradient flex h-32 items-center justify-center">
                <FaServer className="medical-icon text-5xl text-white" />
              </div>
              <div className="p-8 text-center">
                <h3 className="mb-3 text-2xl font-bold text-gray-900">Admin Portal</h3>
                <p className="mb-8 h-20 text-gray-600">
                  Manage platform network health, onboard verified doctors, and govern platform
                  decentralized metrics.
                </p>
                <Link
                  href="/admin"
                  className="block w-full rounded-xl py-3 px-4 font-semibold text-white admin-gradient transition-opacity hover:opacity-90"
                >
                  Enter Admin Area
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-gray-100 bg-gradient-to-b from-blue-50 to-white pb-24 pt-16">
        <div className="pointer-events-none absolute left-10 top-1/4 z-0 text-6xl text-blue-100 animate-pulse-slow">
          <FaShieldAlt />
        </div>
        <div
          className="pointer-events-none absolute right-20 top-1/3 z-0 animate-fadeIn text-5xl text-indigo-100"
          style={{ animationDelay: "1s" }}
        >
          <FaNetworkWired />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-blue-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-600" />
            Secure Web3 Medical Records
          </div>
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            Healthcare Data Built on{" "}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Blockchain
            </span>
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-gray-600">
            Empowering patients with full control over their medical records while providing doctors
            with immutable, cryptographically secure data right when they need it.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/patient"
              className="btn-healthcare w-full rounded-lg py-3 px-8 text-center text-lg sm:w-auto"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="w-full rounded-lg border-2 border-gray-200 px-8 py-3 text-center font-semibold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-24" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-12 md:flex-row">
            <div className="w-full md:w-1/2">
              <h2 className="mb-6 text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
                Why Blockchain For <span className="text-blue-600">Health?</span>
              </h2>
              <p className="mb-8 text-lg text-gray-600">
                Legacy medical systems are fragmented, insecure, and prone to single points of
                failure. Our decentralized approach solves these critical bottlenecks.
              </p>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 p-2 text-green-600">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xl font-bold text-gray-900">Immutability</h4>
                    <p className="text-gray-600">
                      Once recorded, data cannot be maliciously altered or erased.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 p-2 text-blue-600">
                    <FaShieldAlt />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xl font-bold text-gray-900">
                      Cryptographic Security
                    </h4>
                    <p className="text-gray-600">
                      Records are encrypted and linked securely via smart contracts.
                    </p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-100 p-2 text-yellow-600">
                    <FaBolt />
                  </div>
                  <div>
                    <h4 className="mb-1 text-xl font-bold text-gray-900">Instant Availability</h4>
                    <p className="text-gray-600">
                      Data is globally accessible around the clock for authorized parties.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="w-full md:w-1/2">
              <div className="gradient-border relative bg-white p-8 text-center shadow-2xl">
                <div className="absolute left-4 top-4 flex space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="mb-6 mt-8">
                  <FaNetworkWired className="mx-auto text-6xl text-indigo-500 opacity-80" />
                </div>
                <h3 className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-3xl font-extrabold text-transparent">
                  100% Up-time
                </h3>
                <p className="text-lg text-gray-600">
                  Powered by Ethereum and IPFS technologies ensuring distributed replication.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="skeleton mx-auto h-4 w-full rounded" />
                  <div className="skeleton mx-auto h-4 w-5/6 rounded" />
                  <div className="skeleton mx-auto h-4 w-4/6 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
