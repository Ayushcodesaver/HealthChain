import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { ClipboardList } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const PatientPrescriptions = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const enabled = Boolean(CONTRACT_ADDRESS && address);

  const { data: isPatient } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isPatient",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: ids = [] } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientPrescriptionIds",
    args: address ? [address] : undefined,
    query: { enabled: enabled && isPatient },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !ids?.length) {
        setRows([]);
        return;
      }
      setLoading(true);
      const list = [];
      try {
        for (const id of ids) {
          const r = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "prescriptions",
            args: [BigInt(id)],
          });
          const [pid, patient, doctor, detailsCid, issuedAt] = r;
          list.push({
            id: Number(pid),
            patient,
            doctor,
            detailsCid,
            issuedAt: Number(issuedAt),
          });
        }
        if (!cancelled) setRows(list.sort((a, b) => b.issuedAt - a.issuedAt));
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, ids]);

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Prescriptions">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Prescriptions">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!isPatient) {
    return (
      <Card title="Prescriptions">
        <p className="text-sm text-slate-600 mb-3">Register as a patient first.</p>
        <Link href="/patient/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prescriptions</h1>
          <p className="text-sm text-slate-600">Issued by approved doctors; details live on IPFS.</p>
        </div>
      </div>

      <Card title="Your prescriptions" subtitle={`${rows.length} total`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No prescriptions yet.</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">Prescription #{p.id}</p>
                  <p className="text-xs text-slate-500">
                    Dr. {shortAddr(p.doctor)} · {new Date(p.issuedAt * 1000).toLocaleString()}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-600">{p.detailsCid}</p>
                </div>
                <Badge variant="teal" dot>
                  On-chain
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default PatientPrescriptions;
