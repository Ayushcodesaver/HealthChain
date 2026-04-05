import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { UserCog } from "lucide-react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  DAPP_LOCAL_CHAIN_ID,
} from "@/config/contract";
import { useContractAdmin } from "@/hooks/useContractAdmin";
import { shortAddr } from "@/utils/helpers";

const AdminDoctorsManagement = () => {
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

  const enabled = isConfigured;

  const { data: doctorCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getDoctorCount",
    query: { enabled },
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!publicClient || !CONTRACT_ADDRESS || !doctorCount) {
        setRows([]);
        return;
      }
      setLoading(true);
      const n = Number(doctorCount);
      const list = [];
      try {
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
          const [, approved, name, specialization] = d;
          list.push({
            address: docAddr,
            approved,
            name: name || shortAddr(docAddr, 8, 6),
            specialization: specialization || "—",
          });
        }
        if (!cancelled) setRows(list);
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
  }, [publicClient, doctorCount]);

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: confirming } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (hash) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [hash, queryClient]);

  const setApproved = (doctor, approved) => {
    writeContract({
      chainId: DAPP_LOCAL_CHAIN_ID,
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "setDoctorApproved",
      args: [doctor, approved],
    });
  };

  if (!isConfigured) {
    return (
      <Card title="Doctors">
        <p className="text-sm text-amber-800">Configure NEXT_PUBLIC_CONTRACT_ADDRESS.</p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Doctor management">
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
      <Card title="Doctor management">
        <p className="text-sm text-slate-600">Only the contract admin can approve doctors.</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-800">
          <UserCog className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-sm text-slate-600">Approve or revoke verified providers.</p>
        </div>
      </div>

      <Card title="Registered doctors" subtitle={`${rows.length} wallets`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">No doctor registrations yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li
                key={r.address}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{r.name}</p>
                  <p className="text-sm text-slate-600">{r.specialization}</p>
                  <p className="font-mono text-xs text-slate-500">{r.address}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {r.approved ? (
                    <Badge variant="success" dot>
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="warning" dot>
                      Pending
                    </Badge>
                  )}
                  {r.approved ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending || confirming}
                      onClick={() => setApproved(r.address, false)}
                    >
                      Revoke
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isPending || confirming}
                      onClick={() => setApproved(r.address, true)}
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default AdminDoctorsManagement;
