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
import { Calendar } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Select from "../common/Select";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  DAPP_LOCAL_CHAIN_ID,
} from "../../config/contract";

const APPOINTMENT_LABELS = ["Pending", "Confirmed", "Completed", "Cancelled"];

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const DoctorAppointments = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusPick, setStatusPick] = useState({});

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
      if (!publicClient || !CONTRACT_ADDRESS || !address || !exists || !approved) {
        setRows([]);
        return;
      }
      setLoading(true);
      const list = [];
      try {
        const n = appointmentCount ? Number(appointmentCount) : 0;
        for (let i = 1; i <= n; i++) {
          const row = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "appointments",
            args: [BigInt(i)],
          });
          const [id, patient, doctor, dateTime, reasonCid, status] = row;
          if (String(doctor).toLowerCase() === address.toLowerCase()) {
            list.push({
              id: Number(id),
              patient,
              dateTime: Number(dateTime),
              reasonCid,
              status: Number(status),
            });
          }
        }
        if (!cancelled) setRows(list.sort((a, b) => b.dateTime - a.dateTime));
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
  }, [publicClient, address, exists, approved, appointmentCount]);

  const { writeContract, data: hash, isPending, error: writeErr } =
    useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [isSuccess, queryClient]);

  const updateStatus = (appointmentId, statusUint) => {
    if (!CONTRACT_ADDRESS) return;
    writeContract({
      chainId: DAPP_LOCAL_CHAIN_ID,
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "updateAppointmentStatus",
      args: [BigInt(appointmentId), Number(statusUint)],
    });
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Appointments">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="My appointments">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!exists) {
    return (
      <Card title="My appointments">
        <p className="text-sm text-slate-600 mb-2">Register as a doctor first.</p>
        <Link href="/doctor/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  if (!approved) {
    return (
      <Card title="My appointments">
        <Badge variant="warning" dot>
          Pending approval
        </Badge>
        <p className="mt-3 text-sm text-slate-600">
          Admin must approve your account before you can update visit status.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
          <p className="text-sm text-slate-600">Confirm or complete visits you provide.</p>
        </div>
      </div>

      {writeErr ? (
        <p className="text-sm text-red-600">{writeErr.message}</p>
      ) : null}

      <Card title="Schedule" subtitle={`${rows.length} assigned to you`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments yet.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((a) => {
              const nextStatus = statusPick[a.id] ?? String(a.status);
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Appointment #{a.id}</p>
                      <p className="text-sm text-slate-600">
                        Patient {shortAddr(a.patient)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(a.dateTime * 1000).toLocaleString()}
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-500">
                        Reason CID: {a.reasonCid}
                      </p>
                    </div>
                    <Badge variant="teal" dot>
                      {APPOINTMENT_LABELS[a.status] ?? a.status}
                    </Badge>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-[200px] flex-1">
                      <Select
                        label="Set status"
                        value={nextStatus}
                        onChange={(e) =>
                          setStatusPick((p) => ({ ...p, [a.id]: e.target.value }))
                        }
                        options={APPOINTMENT_LABELS.map((lab, i) => ({
                          value: String(i),
                          label: lab,
                        }))}
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={isPending || confirming || Number(nextStatus) === a.status}
                      onClick={() => updateStatus(a.id, nextStatus)}
                    >
                      {isPending || confirming ? "Wallet…" : "Update"}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default DoctorAppointments;
