import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { parseEther } from "viem";
import { PlusCircle } from "lucide-react";
import Card from "../common/Card";
import Input from "../common/Input";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  DAPP_LOCAL_CHAIN_ID,
  PINATA_JWT,
} from "@/config/contract";
import { useContractAdmin } from "@/hooks/useContractAdmin";
import { uploadJsonToIpfs } from "@/utils/ipfs";

const AdminAddMedicine = () => {
  const {
    isAdmin,
    isLoadingAdmin: loadingAdmin,
    isConfigured,
    isConnected,
  } = useContractAdmin();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [priceEth, setPriceEth] = useState("");
  const [description, setDescription] = useState("");
  const [err, setErr] = useState("");

  const { writeContract, data: hash, isPending, error: writeErr } =
    useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      setName("");
      setPriceEth("");
      setDescription("");
      setErr("");
    }
  }, [isSuccess, queryClient]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!isConfigured || !isAdmin) return;
    if (!name.trim()) {
      setErr("Enter a medicine name.");
      return;
    }
    let wei;
    try {
      wei = parseEther(priceEth.trim() || "0");
    } catch {
      setErr("Invalid ETH price.");
      return;
    }
    if (wei <= 0n) {
      setErr("Price must be greater than zero.");
      return;
    }

    let metadataCid = `local-medicine-${Date.now()}`;
    if (PINATA_JWT) {
      try {
        const { cid } = await uploadJsonToIpfs(
          { name: name.trim(), description: description.trim() },
          "medicine-metadata"
        );
        metadataCid = cid;
      } catch (ex) {
        setErr(ex?.message || "IPFS upload failed");
        return;
      }
    }

    writeContract({
      chainId: DAPP_LOCAL_CHAIN_ID,
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "addMedicine",
      args: [name.trim(), wei, metadataCid],
    });
  };

  if (!isConfigured) {
    return (
      <Card title="Add medicine">
        <p className="text-sm text-amber-800">Configure contract address.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Add medicine">
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
      <Card title="Add medicine">
        <p className="text-sm text-slate-600">Only the contract admin can add SKUs.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-800">
          <PlusCircle className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add medicine</h1>
          <p className="text-sm text-slate-600">
            Creates an active listing. Metadata uses Pinata when JWT is configured.
          </p>
        </div>
      </div>

      <Card title="New SKU" subtitle="addMedicine on the Healthcare contract">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aspirin 100mg"
            required
          />
          <Input
            label="Price (ETH per unit)"
            value={priceEth}
            onChange={(e) => setPriceEth(e.target.value)}
            placeholder="0.001"
            required
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description (optional, IPFS JSON)
            </label>
            <textarea
              className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/10"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {!PINATA_JWT ? (
            <p className="text-xs text-amber-800">
              Without NEXT_PUBLIC_PINATA_JWT, a local placeholder metadata CID is used.
            </p>
          ) : null}
          {(err || writeErr) && (
            <p className="text-sm text-red-600">{err || writeErr.message}</p>
          )}
          <Button type="submit" disabled={isPending || confirming} className="w-full">
            {isPending || confirming ? "Confirm in wallet…" : "Add medicine"}
          </Button>
        </form>
        {isSuccess ? (
          <p className="mt-4 text-sm font-medium text-emerald-700">
            Medicine added. Patients can order from{" "}
            <Link className="underline" href="/patient/medicines">
              their catalog
            </Link>
            .
          </p>
        ) : null}
      </Card>
    </div>
  );
};

export default AdminAddMedicine;
