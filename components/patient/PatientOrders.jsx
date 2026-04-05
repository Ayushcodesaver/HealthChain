import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { ShoppingBag } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "../../config/contract";

const ORDER_LABELS = ["Placed", "Shipped", "Delivered", "Cancelled"];

const PatientOrders = () => {
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
    functionName: "getPatientOrderIds",
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
            functionName: "orders",
            args: [BigInt(id)],
          });
          const [oid, patient, medicineId, quantity, totalWei, status, placedAt] = r;
          const med = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "medicines",
            args: [medicineId],
          });
          const medName = med[1];
          list.push({
            id: Number(oid),
            medicineId: Number(medicineId),
            medicineName: medName,
            quantity: Number(quantity),
            totalWei,
            status: Number(status),
            placedAt: Number(placedAt),
          });
        }
        if (!cancelled) setRows(list.sort((a, b) => b.placedAt - a.placedAt));
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
      <Card title="Orders">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Orders">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!isPatient) {
    return (
      <Card title="Orders">
        <p className="text-sm text-slate-600 mb-3">Register as a patient to place orders.</p>
        <Link href="/patient/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-600">Medicine purchases and fulfillment status.</p>
        </div>
      </div>

      <Card title="Your orders" subtitle={`${rows.length} total`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2 pr-4">Medicine</th>
                  <th className="pb-2 pr-4">Qty</th>
                  <th className="pb-2 pr-4">Total (ETH)</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((o) => (
                  <tr key={o.id} className="text-slate-800">
                    <td className="py-3 pr-4 font-mono">#{o.id}</td>
                    <td className="py-3 pr-4">{o.medicineName}</td>
                    <td className="py-3 pr-4">{o.quantity}</td>
                    <td className="py-3 pr-4 font-mono text-xs">{formatEther(o.totalWei)}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="info" dot>
                        {ORDER_LABELS[o.status] ?? o.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {new Date(o.placedAt * 1000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PatientOrders;
