import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { CalendarClock } from "lucide-react";
import Card from "../common/Card";
import Select from "../common/Select";
import Input from "../common/Input";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  DAPP_LOCAL_CHAIN_ID,
  PINATA_JWT,
} from "../../config/contract";

async function pinJsonToPinata(obj) {
  if (!PINATA_JWT) {
    return `reason-${Date.now()}`;
  }
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: obj,
      pinataMetadata: { name: "appointment-reason" },
    }),
  });
  if (!res.ok) throw new Error("Pinata JSON pin failed");
  const data = await res.json();
  return data.IpfsHash;
}

const PatientBookAppointment = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [doctors, setDoctors] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [doctorAddr, setDoctorAddr] = useState("");
  const [datetimeLocal, setDatetimeLocal] = useState("");
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const enabled = Boolean(CONTRACT_ADDRESS && address);

  const { data: isPatient } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isPatient",
    args: address ? [address] : undefined,
    query: { enabled },
  });

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
      setLoadingDocs(true);
      const n = Number(doctorCount);
      const opts = [];
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
          const [, approved, name, specialization] = d;
          if (approved) {
            opts.push({
              value: docAddr,
              label: `${name} — ${specialization}`,
            });
          }
        }
        if (!cancelled) {
          setDoctors(opts);
          if (opts.length && !doctorAddr) setDoctorAddr(opts[0].value);
        }
      } catch {
        if (!cancelled) setDoctors([]);
      } finally {
        if (!cancelled) setLoadingDocs(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, doctorCount]); // eslint-disable-line react-hooks/exhaustive-deps -- seed doctorAddr once when list loads

  const { writeContract, data: hash, isPending, error: writeErr } =
    useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      setBusy(false);
      setErr("");
      setReason("");
    }
  }, [isSuccess, queryClient]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!CONTRACT_ADDRESS || !isPatient) {
      setErr("Register as a patient first.");
      return;
    }
    if (!doctorAddr) {
      setErr("No approved doctors available.");
      return;
    }
    if (!datetimeLocal) {
      setErr("Pick a date and time.");
      return;
    }
    const ts = Math.floor(new Date(datetimeLocal).getTime() / 1000);
    if (!Number.isFinite(ts) || ts < Math.floor(Date.now() / 1000)) {
      setErr("Choose a future date and time.");
      return;
    }
    setBusy(true);
    try {
      const reasonCid = await pinJsonToPinata({
        text: reason || "General consultation",
        patient: address,
        doctor: doctorAddr,
        at: new Date().toISOString(),
      });
      writeContract({
        chainId: DAPP_LOCAL_CHAIN_ID,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "bookAppointment",
        args: [doctorAddr, BigInt(ts), reasonCid],
      });
    } catch (ex) {
      setErr(ex?.message || "Failed to prepare booking");
      setBusy(false);
    }
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Book appointment">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Book appointment">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!isPatient) {
    return (
      <Card title="Book appointment">
        <p className="text-sm text-slate-600 mb-3">Only registered patients can book.</p>
        <Link href="/patient/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
          <CalendarClock className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Book a visit</h1>
          <p className="text-sm text-slate-600">Choose an approved doctor and time slot.</p>
        </div>
      </div>

      <Card title="Appointment details" subtitle="Reason is stored as an IPFS CID when Pinata is configured">
        {loadingDocs ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : doctors.length === 0 ? (
          <p className="text-sm text-slate-600">
            No approved doctors yet. An admin must approve doctor registrations first.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <Select
              label="Doctor"
              value={doctorAddr}
              onChange={(e) => setDoctorAddr(e.target.value)}
              options={doctors}
            />
            <Input
              label="Date & time"
              type="datetime-local"
              value={datetimeLocal}
              onChange={(e) => setDatetimeLocal(e.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Reason / notes
              </label>
              <textarea
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe symptoms or purpose of visit"
              />
            </div>
            {(err || writeErr) && (
              <p className="text-sm text-red-600">{err || writeErr.message}</p>
            )}
            <Button
              type="submit"
              disabled={busy || isPending || confirming}
              className="w-full"
            >
              {isPending || confirming ? "Confirm in wallet…" : "Book on-chain"}
            </Button>
          </form>
        )}
        {isSuccess ? (
          <p className="mt-4 text-sm font-medium text-emerald-700">
            Appointment booked. See{" "}
            <Link className="underline" href="/patient/dashboard">
              dashboard
            </Link>{" "}
            or history.
          </p>
        ) : null}
      </Card>
    </div>
  );
};

export default PatientBookAppointment;
