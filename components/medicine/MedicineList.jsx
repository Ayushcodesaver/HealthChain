import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePublicClient, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { ExternalLink, Pill, Shield } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import LoadingSpinner from "../common/LoadingSpinner";
import { CONTRACT_ABI, CONTRACT_ADDRESS, isContractConfigured } from "@/config/contract";
import { gatewayUrl } from "@/utils/ipfs";
import { cn } from "../common/cn";

const MedicineList = () => {
  const publicClient = usePublicClient();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const { data: medicineCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "medicineCount",
    query: { enabled: isContractConfigured() },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !medicineCount) {
        setItems([]);
        return;
      }
      setLoading(true);
      const n = Number(medicineCount);
      const list = [];
      try {
        for (let i = 1; i <= n; i++) {
          const m = await publicClient.readContract({
            address: CONTRACT_ADDRESS,
            abi: CONTRACT_ABI,
            functionName: "medicines",
            args: [BigInt(i)],
          });
          const [id, name, priceWei, active, metadataCid] = m;
          list.push({
            id: Number(id),
            name,
            priceWei,
            active,
            metadataCid,
          });
        }
        if (!cancelled) setItems(list);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [publicClient, medicineCount]);

  if (!isContractConfigured()) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Contract not configured</p>
        <p className="mt-2 text-sm">Set NEXT_PUBLIC_CONTRACT_ADDRESS to load the catalog.</p>
      </div>
    );
  }

  const activeItems = items.filter((x) => x.active);
  const inactiveItems = items.filter((x) => !x.active);

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12 pt-4 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25">
            <Pill className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Medicine catalog</h1>
            <p className="mt-1 text-slate-600">
              On-chain inventory with ETH pricing. Patients purchase from their portal.
            </p>
          </div>
        </div>
        <Link
          href="/patient/medicines"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-500/25 transition hover:shadow-lg"
        >
          Patient shop →
        </Link>
      </div>

      <Card
        title="Available now"
        subtitle={`${activeItems.length} active SKUs`}
        action={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <Shield className="h-3.5 w-3.5" />
            Medivault
          </span>
        }
      >
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : activeItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            No active medicines. An admin can add products from{" "}
            <Link href="/admin/medicines/add" className="font-semibold text-teal-600">
              Add medicine
            </Link>
            .
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {activeItems.map((m) => {
              const cid = m.metadataCid || "";
              const isLikelyIpfs =
                cid && (/^Qm/.test(cid) || /^baf/i.test(cid));
              const metaHref = isLikelyIpfs ? gatewayUrl(cid) : "";
              return (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/90 p-5 shadow-health",
                    "transition hover:border-teal-200 hover:shadow-health-lg"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{m.name}</h3>
                      <p className="mt-1 font-mono text-sm text-teal-700">
                        {formatEther(m.priceWei)} ETH
                        <span className="text-slate-400"> / unit</span>
                      </p>
                    </div>
                    <Badge variant="success" dot>
                      Active
                    </Badge>
                  </div>
                  <p className="mt-2 break-all font-mono text-[11px] text-slate-500">
                    ID #{m.id} · {m.metadataCid || "—"}
                  </p>
                  {metaHref ? (
                    <a
                      href={metaHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-800"
                    >
                      Metadata <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {inactiveItems.length > 0 ? (
        <Card title="Inactive / delisted" subtitle="Not available for new orders">
          <ul className="space-y-2">
            {inactiveItems.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm text-slate-600"
              >
                <span>{m.name}</span>
                <Badge variant="default">#{m.id}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
};

export default MedicineList;
