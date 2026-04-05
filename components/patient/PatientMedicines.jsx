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
import { formatEther } from "viem";
import { Pill } from "lucide-react";
import Card from "../common/Card";
import Input from "../common/Input";
import Button from "../common/Button";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  DAPP_LOCAL_CHAIN_ID,
} from "../../config/contract";

const PatientMedicines = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qtyById, setQtyById] = useState({});
  const [msg, setMsg] = useState("");

  const enabled = Boolean(CONTRACT_ADDRESS && address);

  const { data: isPatient } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isPatient",
    args: address ? [address] : undefined,
    query: { enabled },
  });

  const { data: medicineCount, refetch: refetchCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "medicineCount",
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      setMsg("Order submitted.");
      refetchCount();
    }
  }, [isSuccess, queryClient, refetchCount]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !medicineCount) {
        setList([]);
        return;
      }
      const n = Number(medicineCount);
      setLoading(true);
      const items = [];
      try {
        for (let i = 1; i <= n; i++) {
          const m = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "medicines",
            args: [BigInt(i)],
          });
          const [id, name, priceWei, active] = m;
          if (active) {
            items.push({
              id: Number(id),
              name,
              priceWei,
            });
          }
        }
        if (!cancelled) setList(items);
      } catch {
        if (!cancelled) setList([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, medicineCount]);

  const place = async (medicineId, priceWei) => {
    setMsg("");
    if (!isPatient) {
      setMsg("Register as patient first.");
      return;
    }
    const q = Number(qtyById[medicineId] || 1);
    if (!Number.isFinite(q) || q < 1) {
      setMsg("Enter a valid quantity.");
      return;
    }
    const total = priceWei * BigInt(q);
    writeContract({
      chainId: DAPP_LOCAL_CHAIN_ID,
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "placeOrder",
      args: [BigInt(medicineId), BigInt(q)],
      value: total,
    });
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Medicines">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Medicines">
        <p className="text-sm text-slate-600">Connect your wallet.</p>
      </Card>
    );
  }

  if (!isPatient) {
    return (
      <Card title="Medicines">
        <p className="text-sm text-slate-600 mb-3">Only registered patients can purchase.</p>
        <Link href="/patient/register" className="text-sm font-semibold text-teal-600">
          Register →
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
          <Pill className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Medicine catalog</h1>
          <p className="text-sm text-slate-600">Pay with ETH; excess sent back as change.</p>
        </div>
      </div>

      {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}

      <Card title="Available medicines" subtitle="Active listings from the admin catalog">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : list.length === 0 ? (
          <p className="text-sm text-slate-500">No active medicines. Ask an admin to add stock.</p>
        ) : (
          <ul className="space-y-4">
            {list.map((m) => (
              <li
                key={m.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{m.name}</h3>
                    <Badge variant="success" dot>
                      Active
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatEther(m.priceWei)} ETH <span className="text-slate-400">per unit</span>
                  </p>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <div className="w-24">
                    <Input
                      label="Qty"
                      type="number"
                      min={1}
                      value={qtyById[m.id] ?? 1}
                      onChange={(e) =>
                        setQtyById((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={isPending || confirming}
                    onClick={() => place(m.id, m.priceWei)}
                  >
                    {isPending || confirming ? "Wallet…" : "Buy"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default PatientMedicines;
