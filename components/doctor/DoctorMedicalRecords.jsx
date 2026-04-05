import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { FileText } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const DoctorMedicalRecords = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

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
        setRows([]);
        return;
      }
      setLoading(true);
      const list = [];
      try {
        const n = prescriptionCount ? Number(prescriptionCount) : 0;
        for (let i = 1; i <= n; i++) {
          const r = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "prescriptions",
            args: [BigInt(i)],
          });
          const [id, patient, doctor, detailsCid, issuedAt] = r;
          if (String(doctor).toLowerCase() === address.toLowerCase()) {
            list.push({
              id: Number(id),
              patient,
              detailsCid,
              issuedAt: Number(issuedAt),
            });
          }
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
  }, [publicClient, address, exists, approved, prescriptionCount]);

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Medical records">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Medical records">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!exists) {
    return (
      <Card title="Medical records">
        <p className="text-sm text-slate-600 mb-2">Register as a doctor first.</p>
        <Link href="/doctor/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  if (!approved) {
    return (
      <Card title="Medical records">
        <Badge variant="warning" dot>
          Pending approval
        </Badge>
        <p className="mt-3 text-sm text-slate-600">
          Issued prescriptions will appear here after approval.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medical records</h1>
          <p className="text-sm text-slate-600">Prescriptions you issued (on-chain index).</p>
        </div>
      </div>

      <Card title="Issued prescriptions" subtitle={`${rows.length} records`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No prescriptions yet. Use{" "}
            <Link href="/doctor/prescribe" className="font-semibold text-teal-600">
              Prescribe medicine
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">Rx #{r.id}</p>
                  <Badge variant="teal" dot>
                    Issued
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">Patient {shortAddr(r.patient)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(r.issuedAt * 1000).toLocaleString()}
                </p>
                <p className="mt-2 break-all font-mono text-xs text-slate-700">{r.detailsCid}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default DoctorMedicalRecords;
