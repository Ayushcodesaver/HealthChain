import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { ExternalLink, Shield, User } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";
import { gatewayUrl } from "../../utils/ipfs";
import { cn } from "../common/cn";

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 10)}…${a.slice(-6)}`;
}

function isDemoRecordCid(cid) {
  if (!cid || typeof cid !== "string") return true;
  const c = cid.trim();
  return c.length === 0 || c.startsWith("local-demo");
}

const PatientProfile = () => {
  const { address, isConnected } = useAccount();
  const [rawProfile, setRawProfile] = useState(null);
  const [legacyRecordCid, setLegacyRecordCid] = useState("");
  const [ipfsLoading, setIpfsLoading] = useState(false);
  const [ipfsError, setIpfsError] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);

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

  const [, nameOnChain, ageOnChain, recordCid] = row || [];

  useEffect(() => {
    if (!isPatient || !recordCid) {
      setRawProfile(null);
      setLegacyRecordCid("");
      return;
    }

    let cancelled = false;
    setIpfsError(false);
    setRawProfile(null);
    setLegacyRecordCid("");

    if (isDemoRecordCid(recordCid)) {
      return;
    }

    (async () => {
      setIpfsLoading(true);
      try {
        const url = gatewayUrl(recordCid);
        const res = await fetch(url);
        if (!res.ok) throw new Error("bad status");
        const text = await res.text();
        if (cancelled) return;
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          setLegacyRecordCid(recordCid);
          return;
        }
        if (json?.type === "MedivaultPatientProfile") {
          setRawProfile(json);
        } else {
          setLegacyRecordCid(recordCid);
        }
      } catch {
        if (!cancelled) {
          setIpfsError(true);
          setLegacyRecordCid(recordCid);
        }
      } finally {
        if (!cancelled) setIpfsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isPatient, recordCid]);

  const photoGatewayUrl = useMemo(() => {
    const cid =
      rawProfile && typeof rawProfile.photoCid === "string"
        ? rawProfile.photoCid.trim()
        : "";
    if (!cid) return "";
    return gatewayUrl(cid);
  }, [rawProfile]);

  const dicebearUrl = useMemo(() => {
    if (!address) return "";
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(address)}`;
  }, [address]);

  const avatarUrl =
    photoGatewayUrl && !avatarBroken ? photoGatewayUrl : dicebearUrl;

  useEffect(() => {
    setAvatarBroken(false);
  }, [photoGatewayUrl]);

  const medicalRecordUrl = useMemo(() => {
    const cid =
      rawProfile && typeof rawProfile.medicalRecordCid === "string"
        ? rawProfile.medicalRecordCid.trim()
        : "";
    if (!cid) return "";
    return gatewayUrl(cid);
  }, [rawProfile]);

  const displayName = useMemo(() => {
    const fromJson =
      rawProfile &&
      typeof rawProfile.fullName === "string" &&
      rawProfile.fullName.trim();
    return (fromJson || nameOnChain || "Patient").trim();
  }, [rawProfile, nameOnChain]);

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

  const legacyLink =
    legacyRecordCid && !isDemoRecordCid(legacyRecordCid)
      ? gatewayUrl(legacyRecordCid)
      : "";
  const profileJsonLink =
    recordCid && !isDemoRecordCid(recordCid) ? gatewayUrl(recordCid) : "";

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
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-28 w-28 rounded-full border-4 border-white/40 object-cover bg-white/20"
                onError={() => {
                  if (photoGatewayUrl) setAvatarBroken(true);
                }}
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/40 bg-white/20 text-white">
                <User className="h-14 w-14" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Shield className="h-6 w-6 shrink-0 opacity-90" />
              <h1 className="text-2xl font-bold sm:text-3xl break-words">{displayName}</h1>
            </div>
            <p className="mt-1 text-sm text-white/90">Wallet {shortAddr(address)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="success" dot dotClass="bg-white">
                Verified patient
              </Badge>
              <Badge className="border-white/40 bg-white/20 text-white">
                Age {String(ageOnChain ?? "—")}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {ipfsLoading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : null}

      {ipfsError && rawProfile == null && legacyRecordCid ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Could not load IPFS metadata; showing direct record link if available.
        </p>
      ) : null}

      <Card
        title="On-chain data"
        subtitle={
          rawProfile
            ? "Core fields from contract; extended data from profile JSON on IPFS"
            : "Read from the Healthcare contract"
        }
      >
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Name</dt>
            <dd className="mt-1 font-medium text-slate-900">{nameOnChain || "—"}</dd>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Age</dt>
            <dd className="mt-1 font-medium text-slate-900">{String(ageOnChain ?? "—")}</dd>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Profile / record CID
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-slate-800">{recordCid || "—"}</dd>
            {profileJsonLink ? (
              <a
                href={profileJsonLink}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-800"
              >
                Open profile on IPFS <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </dl>
      </Card>

      {rawProfile ? (
        <Card title="Record on IPFS" subtitle="From your registered patient profile JSON">
          <ul className="space-y-3 text-sm">
            {medicalRecordUrl ? (
              <li>
                <span className="font-semibold text-slate-700">Medical record file: </span>
                <a
                  href={medicalRecordUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-teal-600 hover:text-teal-800"
                >
                  {rawProfile.medicalRecordFileName || "View file"}
                </a>
              </li>
            ) : (
              <li className="text-slate-500">No medical record file was attached at registration.</li>
            )}
          </ul>
        </Card>
      ) : legacyLink && !isDemoRecordCid(recordCid) ? (
        <Card title="Legacy record" subtitle="This CID points to a file directly (older registration format)">
          <a
            href={legacyLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-800"
          >
            View file on IPFS <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Card>
      ) : null}
    </div>
  );
};

export default PatientProfile;
