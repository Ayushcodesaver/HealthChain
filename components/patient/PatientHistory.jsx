import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { History } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS, PINATA_JWT } from "../../config/contract";

const APPOINTMENT_LABELS = ["Pending", "Confirmed", "Completed", "Cancelled"];
const ORDER_LABELS = ["Placed", "Shipped", "Delivered", "Cancelled"];

function shortAddr(a) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

const PatientHistory = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const enabled = Boolean(CONTRACT_ADDRESS && address);

  const { data: isPatient } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isPatient",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: rxIds = [] } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientPrescriptionIds",
    args: address ? [address] : undefined,
    query: { enabled: enabled && isPatient },
  });

  const { data: orderIds = [] } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientOrderIds",
    args: address ? [address] : undefined,
    query: { enabled: enabled && isPatient },
  });

  const { data: appointmentCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "appointmentCount",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !address || !isPatient) {
        setEvents([]);
        return;
      }
      setLoading(true);
      const ev = [];
      try {
        for (const id of rxIds) {
          const r = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "prescriptions",
            args: [BigInt(id)],
          });
          const [pid, , doctor, detailsCid, issuedAt] = r;
          ev.push({
            kind: "prescription",
            sort: Number(issuedAt),
            title: `Prescription #${Number(pid)}`,
            sub: `Dr. ${shortAddr(doctor)} · ${detailsCid}`,
            badge: "Rx",
          });
        }
        for (const id of orderIds) {
          const r = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "orders",
            args: [BigInt(id)],
          });
          const [oid, , medicineId, quantity, totalWei, status, placedAt] = r;
          const med = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "medicines",
            args: [medicineId],
          });
          ev.push({
            kind: "order",
            sort: Number(placedAt),
            title: `Order #${Number(oid)} — ${med[1]}`,
            sub: `Qty ${Number(quantity)} · ${formatEther(totalWei)} ETH · ${ORDER_LABELS[Number(status)]}`,
            badge: "Order",
          });
        }
        const n = appointmentCount ? Number(appointmentCount) : 0;
        for (let i = 1; i <= n; i++) {
          const row = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "appointments",
            args: [BigInt(i)],
          });
          const [, pat, doc, dateTime, reasonCid, status] = row;
          if (String(pat).toLowerCase() === address.toLowerCase()) {
            ev.push({
              kind: "appointment",
              sort: Number(dateTime),
              title: `Appointment #${i}`,
              sub: `Dr. ${shortAddr(doc)} · ${APPOINTMENT_LABELS[Number(status)]} · ${reasonCid}`,
              badge: "Visit",
            });
          }
        }
        if (!cancelled) setEvents(ev.sort((a, b) => b.sort - a.sort));
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, address, isPatient, rxIds, orderIds, appointmentCount]);

  const badgeVariant = useMemo(
    () => ({
      prescription: "teal",
      order: "info",
      appointment: "warning",
    }),
    []
  );

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="History">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="History">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!isPatient) {
    return (
      <Card title="History">
        <p className="text-sm text-slate-600 mb-3">Register to build an on-chain timeline.</p>
        <Link href="/patient/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
          <History className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity history</h1>
          <p className="text-sm text-slate-600">
            Merged view of prescriptions, orders, and appointments
            {PINATA_JWT ? "" : " (CIDs may be local placeholders)"}.
          </p>
        </div>
      </div>

      <Card title="Timeline" subtitle={`${events.length} events`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l-2 border-teal-200 pl-6">
            {events.map((e, i) => (
              <li key={`${e.kind}-${i}`} className="relative">
                <span className="absolute -left-[1.4rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-teal-500" />
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={badgeVariant[e.kind] || "default"}>{e.badge}</Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(e.sort * 1000).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 font-semibold text-slate-900">{e.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{e.sub}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
};

export default PatientHistory;
