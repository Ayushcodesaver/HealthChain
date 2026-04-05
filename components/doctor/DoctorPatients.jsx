import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { Users } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 8)}…${a.slice(-6)}`;
}

const DoctorPatients = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [patients, setPatients] = useState([]);
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

  const { data: appointmentCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "appointmentCount",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  const exists = docRow?.[0];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !address || !exists) {
        setPatients([]);
        return;
      }
      setLoading(true);
      try {
        const n = appointmentCount ? Number(appointmentCount) : 0;
        const seen = new Map();
        for (let i = 1; i <= n; i++) {
          const row = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "appointments",
            args: [BigInt(i)],
          });
          const [, pat, doctor] = row;
          if (String(doctor).toLowerCase() !== address.toLowerCase()) continue;
          const key = String(pat).toLowerCase();
          if (seen.has(key)) continue;
          const p = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "patients",
            args: [pat],
          });
          const [, name, age, recordCid] = p;
          seen.set(key, {
            address: pat,
            name: name || shortAddr(pat),
            age: Number(age),
            recordCid,
          });
        }
        if (!cancelled) setPatients([...seen.values()]);
      } catch {
        if (!cancelled) setPatients([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, address, exists, appointmentCount]);

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Patients">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Patients list">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!exists) {
    return (
      <Card title="Patients list">
        <p className="text-sm text-slate-600 mb-2">Register as a doctor first.</p>
        <Link href="/doctor/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  if (!approved) {
    return (
      <Card title="Patients list">
        <Badge variant="warning" dot>
          Pending approval
        </Badge>
        <p className="mt-3 text-sm text-slate-600">
          Patient roster updates once your account is approved.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patients</h1>
          <p className="text-sm text-slate-600">
            Unique patients from appointments assigned to you.
          </p>
        </div>
      </div>

      <Card title="Directory" subtitle={`${patients.length} patients`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : patients.length === 0 ? (
          <p className="text-sm text-slate-500">
            No patients yet — appointments you receive will list patients here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {patients.map((p) => (
              <li
                key={p.address}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="font-mono text-xs text-slate-500">{p.address}</p>
                  <p className="text-xs text-slate-500">Age {p.age}</p>
                </div>
                {p.recordCid ? (
                  <a
                    href={`https://ipfs.io/ipfs/${p.recordCid}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-teal-600 hover:text-teal-800"
                  >
                    Record CID →
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">No record CID</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default DoctorPatients;
