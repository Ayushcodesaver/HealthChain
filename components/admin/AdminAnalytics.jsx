import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatEther } from "viem";
import { BarChart3, ShoppingBag, Stethoscope, UserRound, Wallet } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Select from "../common/Select";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import StatCard from "../common/StatCard";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  DAPP_LOCAL_CHAIN_ID,
} from "@/config/contract";
import { useContractAdmin } from "@/hooks/useContractAdmin";
import { ORDER_STATUS_LABELS, shortAddr } from "@/utils/helpers";

const AdminAnalytics = () => {
  const {
    isAdmin,
    isLoadingAdmin: loadingAdmin,
    isConfigured,
    isConnected,
  } = useContractAdmin();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderStatusPick, setOrderStatusPick] = useState({});

  const enabled = isConfigured;

  const { data: patientCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getPatientCount",
    query: { enabled },
  });

  const { data: doctorCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDoctorCount",
    query: { enabled },
  });

  const { data: orderCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "orderCount",
    query: { enabled },
  });

  const [approvedDoctors, setApprovedDoctors] = useState(0);
  const [pendingDoctors, setPendingDoctors] = useState(0);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDocs() {
      if (!publicClient || !CONTRACT_ADDRESS || !doctorCount) {
        setApprovedDoctors(0);
        setPendingDoctors(0);
        return;
      }
      setLoadingDocs(true);
      let ap = 0;
      let pe = 0;
      try {
        const n = Number(doctorCount);
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
          if (d[1]) ap += 1;
          else pe += 1;
        }
        if (!cancelled) {
          setApprovedDoctors(ap);
          setPendingDoctors(pe);
        }
      } catch {
        if (!cancelled) {
          setApprovedDoctors(0);
          setPendingDoctors(0);
        }
      } finally {
        if (!cancelled) setLoadingDocs(false);
      }
    }
    loadDocs();
    return () => {
      cancelled = true;
    };
  }, [publicClient, doctorCount]);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    let cancelled = false;
    async function loadOrders() {
      if (!publicClient || !CONTRACT_ADDRESS || !orderCount) {
        setOrders([]);
        return;
      }
      setLoadingOrders(true);
      const n = Number(orderCount);
      const list = [];
      try {
        for (let i = 1; i <= n; i++) {
          const r = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "orders",
            args: [BigInt(i)],
          });
          const [id, patient, medicineId, quantity, totalWei, status, placedAt] = r;
          const med = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "medicines",
            args: [medicineId],
          });
          list.push({
            id: Number(id),
            patient,
            medicineName: med[1],
            quantity: Number(quantity),
            totalWei,
            status: Number(status),
            placedAt: Number(placedAt),
          });
        }
        if (!cancelled) setOrders(list.sort((a, b) => b.placedAt - a.placedAt));
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoadingOrders(false);
      }
    }
    loadOrders();
    return () => {
      cancelled = true;
    };
  }, [publicClient, orderCount, hash]);

  useEffect(() => {
    if (hash) queryClient.invalidateQueries({ queryKey: ["readContract"] });
  }, [hash, queryClient]);

  const updateOrder = (orderId, statusUint) => {
    writeContract({
      chainId: DAPP_LOCAL_CHAIN_ID,
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "updateOrderStatus",
      args: [BigInt(orderId), Number(statusUint)],
    });
  };

  const revenueEth = useMemo(() => {
    try {
      let sum = 0n;
      orders.forEach((o) => {
        sum += o.totalWei;
      });
      return formatEther(sum);
    } catch {
      return "0";
    }
  }, [orders]);

  if (!isConfigured) {
    return (
      <Card title="Analytics">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Analytics">
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
      <Card title="Analytics">
        <p className="text-sm text-slate-600">Admin only.</p>
      </Card>
    );
  }

  const pc = patientCount != null ? String(patientCount) : "—";
  const dc = doctorCount != null ? String(doctorCount) : "—";
  const oc = orderCount != null ? String(orderCount) : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-800">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-600">Volumes, doctor funnel, and order fulfillment.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Patients"
          value={pc}
          icon={<UserRound className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-teal-500 to-cyan-600"
        />
        <StatCard
          title="Doctor registrations"
          value={dc}
          icon={<Stethoscope className="h-8 w-8" />}
          subtitle={loadingDocs ? "…" : `${approvedDoctors} approved · ${pendingDoctors} pending`}
          gradientClass="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
        <StatCard
          title="Orders"
          value={oc}
          icon={<ShoppingBag className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Order volume (ETH)"
          value={revenueEth}
          icon={<Wallet className="h-8 w-8" />}
          subtitle="Sum of order totals"
          gradientClass="bg-gradient-to-br from-emerald-500 to-teal-700"
        />
      </div>

      <Card title="Order fulfillment" subtitle="Admin: update shipment status">
        {loadingOrders ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="pb-2 pr-3">ID</th>
                  <th className="pb-2 pr-3">Patient</th>
                  <th className="pb-2 pr-3">Item</th>
                  <th className="pb-2 pr-3">Total</th>
                  <th className="pb-2 pr-3">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => {
                  const next = orderStatusPick[o.id] ?? String(o.status);
                  return (
                    <tr key={o.id} className="text-slate-800">
                      <td className="py-3 pr-3 font-mono">#{o.id}</td>
                      <td className="py-3 pr-3 text-xs">{shortAddr(o.patient)}</td>
                      <td className="py-3 pr-3">
                        {o.medicineName}{" "}
                        <span className="text-slate-400">×{o.quantity}</span>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs">
                        {formatEther(o.totalWei)}
                      </td>
                      <td className="py-3 pr-3">
                        <Badge variant="info" dot>
                          {ORDER_STATUS_LABELS[o.status] ?? o.status}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                          <Select
                            value={next}
                            onChange={(e) =>
                              setOrderStatusPick((p) => ({ ...p, [o.id]: e.target.value }))
                            }
                            options={ORDER_STATUS_LABELS.map((lab, i) => ({
                              value: String(i),
                              label: lab,
                            }))}
                            wrapperClassName="min-w-[140px]"
                          />
                          <Button
                            type="button"
                            size="sm"
                            disabled={
                              isPending || confirming || Number(next) === o.status
                            }
                            onClick={() => updateOrder(o.id, next)}
                          >
                            Set
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminAnalytics;
