import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import {
  Camera,
  Eye,
  EyeOff,
  Pencil,
  Shield,
  User,
} from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Input from "../common/Input";
import Select from "../common/Select";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";
import { cn } from "../common/cn";

const SPECIALIZATIONS = [
  "Cardiology",
  "General Practice",
  "Pediatrics",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "Psychiatry",
  "Other",
];

function storageKey(addr) {
  return `healthchain-doctor-extras-${(addr || "").toLowerCase()}`;
}

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

const DoctorProfile = () => {
  const { address, isConnected } = useAccount();
  const [editing, setEditing] = useState(false);
  const [showPrivate, setShowPrivate] = useState(false);
  const [extras, setExtras] = useState({
    experienceYears: "15",
    consultationFee: "150",
    email: "john.smith@healthcare.com",
    phone: "5551234567",
    hours: "Mon-Fri 09:00 AM - 05:00 PM",
    languages: "English, Spanish",
    bio: "Board-certified physician focused on patient-centered care.",
  });

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

  const exists = docRow?.[0];
  const [, isApprovedOnChain, chainName, specialization, licenseCid] = docRow || [];

  useEffect(() => {
    if (!address || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(storageKey(address));
      if (raw) setExtras((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, [address]);

  const displayName = useMemo(() => {
    const n = chainName || "Doctor";
    return n.startsWith("Dr.") ? n : `Dr. ${n}`;
  }, [chainName]);

  const avatarUrl = useMemo(() => {
    if (!address) return "";
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(address)}`;
  }, [address]);

  const saveExtras = () => {
    if (address && typeof window !== "undefined") {
      localStorage.setItem(storageKey(address), JSON.stringify(extras));
    }
    setEditing(false);
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Doctor profile">
        <p className="text-sm text-amber-800">Configure NEXT_PUBLIC_CONTRACT_ADDRESS.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Doctor profile">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
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
        title="Not registered"
        subtitle="Complete doctor registration first."
        action={
          <Link
            href="/doctor/register"
            className="inline-flex rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            Register
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fadeIn">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 p-6 text-white shadow-health-lg sm:p-8"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/doctor/dashboard"
              className="mb-3 inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25"
            >
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-7 w-7 shrink-0 opacity-95" />
              <h1 className="text-2xl font-bold sm:text-3xl">Doctor Profile</h1>
            </div>
            <p className="mt-1 text-sm text-white/90">
              Manage your professional information and credentials
            </p>
          </div>
          <button
            type="button"
            onClick={() => (editing ? saveExtras() : setEditing(true))}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-md transition hover:bg-teal-50"
          >
            <Pencil className="h-4 w-4" />
            {editing ? "Save profile" : "Edit Profile"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Card padding="p-0" className="overflow-hidden">
          <div className="border-b border-slate-100 p-6 text-center">
            <div className="relative mx-auto h-32 w-32">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full rounded-full border-4 border-teal-100 object-cover bg-white"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full border-4 border-teal-100 bg-teal-50 text-teal-600">
                  <User className="h-14 w-14" />
                </div>
              )}
              <span
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-teal-600 text-white shadow-md"
                aria-hidden
              >
                <Camera className="h-4 w-4" />
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">{displayName}</h2>
            <p className="text-xs font-mono text-slate-500">Wallet {shortAddr(address)}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {approved || isApprovedOnChain ? (
                <Badge variant="success" dot>
                  Verified Account
                </Badge>
              ) : (
                <Badge variant="warning" dot>
                  Pending Approval
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-3 p-6">
            <div className="rounded-xl border border-teal-200 bg-teal-50/80 p-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                Medical Specialization
              </p>
              <p className="mt-1 font-semibold text-teal-900">{specialization || "—"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{extras.experienceYears}</p>
                <p className="text-xs text-slate-500">Years</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">—</p>
                <p className="text-xs text-slate-500">Consultations</p>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Professional Information"
          subtitle="On-chain data + optional local details (browser only)"
          action={
            <button
              type="button"
              onClick={() => setShowPrivate((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {showPrivate ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPrivate ? "Hide Private" : "Show Private"}
            </button>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">On-chain</p>
              <dl className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">License CID</dt>
                  <dd className="max-w-[60%] break-all font-mono text-xs text-slate-800">
                    {licenseCid || "—"}
                  </dd>
                </div>
              </dl>
            </div>

            {editing ? (
              <>
                <Input
                  label="Display name (matches chain until re-registered)"
                  value={chainName || ""}
                  disabled
                  hint="Update via a new deployment or keep as registered."
                />
                <Select
                  label="Specialization (on-chain)"
                  value={specialization || ""}
                  disabled
                  options={
                    specialization && !SPECIALIZATIONS.includes(specialization)
                      ? [...SPECIALIZATIONS, specialization]
                      : SPECIALIZATIONS
                  }
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Years of Experience"
                    value={extras.experienceYears}
                    onChange={(e) =>
                      setExtras((x) => ({ ...x, experienceYears: e.target.value }))
                    }
                  />
                  <Input
                    label="Consultation Fee ($)"
                    value={extras.consultationFee}
                    onChange={(e) =>
                      setExtras((x) => ({ ...x, consultationFee: e.target.value }))
                    }
                  />
                </div>
                <Input
                  label="Email Address"
                  type="email"
                  value={extras.email}
                  onChange={(e) => setExtras((x) => ({ ...x, email: e.target.value }))}
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  value={extras.phone}
                  onChange={(e) => setExtras((x) => ({ ...x, phone: e.target.value }))}
                />
                <Input
                  label="Available Hours"
                  value={extras.hours}
                  onChange={(e) => setExtras((x) => ({ ...x, hours: e.target.value }))}
                />
                <Input
                  label="Languages Spoken"
                  value={extras.languages}
                  onChange={(e) => setExtras((x) => ({ ...x, languages: e.target.value }))}
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Professional Bio
                  </label>
                  <textarea
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                    rows={4}
                    value={extras.bio}
                    onChange={(e) => setExtras((x) => ({ ...x, bio: e.target.value }))}
                  />
                </div>
                <Button type="button" onClick={saveExtras}>
                  Save local details
                </Button>
              </>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Full Name</p>
                  <p className="font-medium text-slate-900">{displayName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Specialization</p>
                  <p className="font-medium text-slate-900">{specialization}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Years of Experience</p>
                  <p className="font-medium text-slate-900">{extras.experienceYears}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Consultation Fee ($)</p>
                  <p className="font-medium text-slate-900">{extras.consultationFee}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Email</p>
                  <p className="font-medium text-slate-900">{extras.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Phone</p>
                  <p className="font-medium text-slate-900">
                    {showPrivate
                      ? extras.phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
                      : "***-***-****"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500">Available Hours</p>
                  <p className="font-medium text-slate-900">{extras.hours}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500">Languages</p>
                  <p className="font-medium text-slate-900">{extras.languages}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-500">Bio</p>
                  <p className="text-sm text-slate-700">{extras.bio}</p>
                </div>
              </div>
            )}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Editable fields above are stored in this browser only (not on-chain). Name and
            specialization on-chain require contract support to change.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default DoctorProfile;
