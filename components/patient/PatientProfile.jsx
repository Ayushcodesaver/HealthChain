import React from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { Shield, User } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";
import { cn } from "../common/cn";

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

const PatientProfile = () => {
  const { address, isConnected } = useAccount();

  const enabled = Boolean(CONTRACT_ADDRESS && address);

  const { data: isPatient, isLoading: l1 } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isPatient",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: row, isLoading: l2 } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "patients",
    args: address ? [address] : undefined,
    query: { enabled: enabled && isPatient },
  });

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Profile">
        <p className="text-sm text-amber-800">Configure NEXT_PUBLIC_CONTRACT_ADDRESS.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Patient profile">
        <p className="text-sm text-slate-600">Connect your wallet to view your on-chain profile.</p>
      </Card>
    );
  }

  if (l1 || (isPatient && l2)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isPatient) {
    return (
      <Card
        title="Not registered"
        subtitle="Register once per wallet to use patient features."
        action={
          <Link
            href="/patient/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md bg-gradient-to-r from-teal-500 to-cyan-600"
          >
            Register
          </Link>
        }
      />
    );
  }

  const [, name, age, recordCid] = row || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-cyan-600 to-blue-600 p-8 text-white shadow-health-lg"
        )}
      >
        <Link
          href="/patient/dashboard"
          className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur hover:bg-white/25"
        >
          ← Back to dashboard
        </Link>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/40 bg-white/20 text-white">
              <User className="h-14 w-14" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Shield className="h-6 w-6 opacity-90" />
              <h1 className="text-2xl font-bold sm:text-3xl">{name}</h1>
            </div>
            <p className="mt-1 text-sm text-white/90">Wallet {shortAddr(address)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success" dot dotClass="bg-white">
                Verified patient
              </Badge>
              <Badge className="border-white/40 bg-white/20 text-white">
                Age {String(age)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Card title="On-chain data" subtitle="Read from the Healthcare contract">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 font-medium text-slate-900">{name}</dd>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age</dt>
            <dd className="mt-1 font-medium text-slate-900">{String(age)}</dd>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Record CID
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-slate-800">{recordCid || "—"}</dd>
            {recordCid && recordCid !== "local-demo-record-cid" ? (
              <a
                href={`https://ipfs.io/ipfs/${recordCid}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm font-semibold text-teal-600 hover:text-teal-800"
              >
                View on IPFS →
              </a>
            ) : null}
          </div>
        </dl>
      </Card>
    </div>
  );
};

export default PatientProfile;
