import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
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
} from "@/config/contract";
import { useContractAdmin } from "@/hooks/useContractAdmin";
import { APPOINTMENT_STATUS_LABELS, shortAddr } from "@/utils/helpers";

const AdminAppointmentsManagement = () => {
  const {
    isAdmin,
    isLoadingAdmin: loadingAdmin,
    isConfigured,
    isConnected,
  } = useContractAdmin();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusPick, setStatusPick] = useState({});

  const enabled = isConfigured;

  const { data: appointmentCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "appointmentCount",
    query: { enabled },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !appointmentCount) {
        setRows([]);
        return;
      }
      setLoading(true);
      const n = Number(appointmentCount);
      const list = [];
      try {
        for (let i = 1; i <= n; i++) {
          const row = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "appointments",
            args: [BigInt(i)],
          });
          const [id, patient, doctor, dateTime, reasonCid, status] = row;
          list.push({
            id: Number(id),
            patient,
            doctor,
            dateTime: Number(dateTime),
            reasonCid,
            status: Number(status),
          });
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
  }, [publicClient, appointmentCount]);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (hash) queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }, [hash, queryClient]);

  const updateStatus = (appointmentId, statusUint) => {
    writeContract({
      chainId: DAPP_LOCAL_CHAIN_ID,
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "updateAppointmentStatus",
      args: [BigInt(appointmentId), Number(statusUint)],
    });
  };

  if (!isConfigured) {
    return (
      <Card title="Appointments">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Appointments">
        <p className="text-sm text-slate-600">Connect the admin wallet.</p>
      </Card>
    );
  }

  if (loadingAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card title="Appointments">
        <p className="text-sm text-slate-600">Admin only.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-sm text-slate-600">Override or correct visit status platform-wide.</p>
        </div>
      </div>

      <Card title="All bookings" subtitle={`${rows.length} total`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No appointments.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((a) => {
              const next = statusPick[a.id] ?? String(a.status);
              return (
                <li
                  key={a.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">#{a.id}</p>
                      <p className="text-xs text-slate-600">
                        Patient {shortAddr(a.patient)} · Dr. {shortAddr(a.doctor)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(a.dateTime * 1000).toLocaleString()}
                      </p>
                      <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
                        {a.reasonCid}
                      </p>
                    </div>
                    <Badge variant="teal" dot>
                      {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                    <div className="min-w-[200px] flex-1">
                      <Select
                        label="Set status"
                        value={next}
                        onChange={(e) =>
                          setStatusPick((p) => ({ ...p, [a.id]: e.target.value }))
                        }
                        options={APPOINTMENT_STATUS_LABELS.map((lab, i) => ({
                          value: String(i),
                          label: lab,
                        }))}
                      />
                    </div>
                    <Button
                      type="button"
                      disabled={isPending || confirming || Number(next) === a.status}
                      onClick={() => updateStatus(a.id, next)}
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

export default AdminAppointmentsManagement;
