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
import { Syringe } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Select from "../common/Select";
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
    return `rx-${Date.now()}`;
  }
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: obj,
      pinataMetadata: { name: "prescription" },
    }),
  });
  if (!res.ok) throw new Error("Pinata JSON pin failed");
  const data = await res.json();
  return data.IpfsHash;
}

const DoctorPrescribeMedicine = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientAddr, setPatientAddr] = useState("");
  const [meds, setMeds] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [err, setErr] = useState("");

  const enabled = Boolean(CONTRACT_ADDRESS && address);

  const { data: docRow } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "doctors",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: approved } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isApprovedDoctor",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: patientCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientCount",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  const exists = docRow?.[0];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !patientCount) {
        setPatientOptions([]);
        return;
      }
      setLoadingList(true);
      const n = Number(patientCount);
      const opts = [];
      try {
        for (let i = 0; i < n; i++) {
          const pat = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "getPatientAt",
            args: [BigInt(i)],
          });
          const p = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "patients",
            args: [pat],
          });
          const [, name] = p;
          opts.push({
            value: pat,
            label: `${name || "Patient"} (${String(pat).slice(0, 6)}…)`,
          });
        }
        if (!cancelled) {
          setPatientOptions(opts);
          if (opts.length && !patientAddr) setPatientAddr(opts[0].value);
        }
      } catch {
        if (!cancelled) setPatientOptions([]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, patientCount]); // eslint-disable-line react-hooks/exhaustive-deps -- seed patientAddr once when list loads

  const { writeContract, data: hash, isPending, error: writeErr } =
    useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      setErr("");
      setMeds("");
      setNotes("");
    }
  }, [isSuccess, queryClient]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!CONTRACT_ADDRESS || !approved || !patientAddr) {
      setErr("Select a patient.");
      return;
    }
    if (!meds.trim()) {
      setErr("Describe medicines / dosage.");
      return;
    }
    try {
      const detailsCid = await pinJsonToPinata({
        medicines: meds.trim(),
        notes: notes.trim(),
        prescribedBy: address,
        at: new Date().toISOString(),
      });
      writeContract({
        chainId: DAPP_LOCAL_CHAIN_ID,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "issuePrescription",
        args: [patientAddr, detailsCid],
      });
    } catch (ex) {
      setErr(ex?.message || "Failed to build prescription");
    }
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Prescribe">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Prescribe medicine">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!exists) {
    return (
      <Card title="Prescribe medicine">
        <p className="text-sm text-slate-600 mb-2">Register as a doctor first.</p>
        <Link href="/doctor/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  if (!approved) {
    return (
      <Card title="Prescribe medicine">
        <Badge variant="warning" dot>
          Pending approval
        </Badge>
        <p className="mt-3 text-sm text-slate-600">
          Only approved doctors can issue prescriptions.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
          <Syringe className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescribe medicine</h1>
          <p className="text-sm text-slate-600">
            Details are stored as an IPFS JSON CID on-chain.
          </p>
        </div>
      </div>

      <Card title="New prescription">
        {loadingList ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : patientOptions.length === 0 ? (
          <p className="text-sm text-slate-600">No registered patients on the network yet.</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <Select
              label="Patient"
              value={patientAddr}
              onChange={(e) => setPatientAddr(e.target.value)}
              options={patientOptions}
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Medicines &amp; dosage
              </label>
              <textarea
                required
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                rows={4}
                value={meds}
                onChange={(e) => setMeds(e.target.value)}
                placeholder="e.g. Amoxicillin 500mg — 1 capsule twice daily for 7 days"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Notes (optional)
              </label>
              <textarea
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {(err || writeErr) && (
              <p className="text-sm text-red-600">{err || writeErr.message}</p>
            )}
            <Button type="submit" disabled={isPending || confirming} className="w-full">
              {isPending || confirming ? "Confirm in wallet…" : "Issue prescription"}
            </Button>
          </form>
        )}
        {isSuccess ? (
          <p className="mt-4 text-sm font-medium text-emerald-700">
            Prescription recorded. See{" "}
            <Link className="underline" href="/doctor/records">
              medical records
            </Link>
            .
          </p>
        ) : null}
      </Card>
    </div>
  );
};

export default DoctorPrescribeMedicine;
