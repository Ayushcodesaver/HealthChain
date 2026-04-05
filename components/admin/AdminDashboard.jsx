import React, { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useBalance, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import {
  Calendar,
  ClipboardList,
  LayoutDashboard,
  Pill,
  ShoppingBag,
  Stethoscope,
  UserRound,
  Wallet,
} from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import StatCard from "../common/StatCard";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  DAPP_LOCAL_CHAIN_ID,
} from "@/config/contract";
import { useContractAdmin } from "@/hooks/useContractAdmin";
import { cn } from "../common/cn";

const AdminDashboard = () => {
  const {
    isAdmin,
    isLoadingAdmin: loadingAdmin,
    adminAddress: adminAddr,
    isConfigured,
    isConnected,
  } = useContractAdmin();

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

  const { data: appointmentCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "appointmentCount",
    query: { enabled },
  });

  const { data: prescriptionCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "prescriptionCount",
    query: { enabled },
  });

  const { data: medicineCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "medicineCount",
    query: { enabled },
  });

  const { data: orderCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "orderCount",
    query: { enabled },
  });

  const { data: bal, isLoading: loadingBal } = useBalance({
    address: CONTRACT_ADDRESS,
    query: { enabled: Boolean(CONTRACT_ADDRESS) },
  });

  if (!isConfigured) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Contract not configured</p>
        <p className="mt-2 text-sm">Set NEXT_PUBLIC_CONTRACT_ADDRESS.</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Admin dashboard">
        <p className="text-sm text-slate-600">Connect the deployer / admin wallet.</p>
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
      <Card title="Access restricted">
        <p className="text-sm text-slate-600">
          This wallet is not the on-chain admin. Admin address:
        </p>
        <p className="mt-2 break-all font-mono text-xs text-slate-800">{String(adminAddr)}</p>
      </Card>
    );
  }

  const pc = patientCount != null ? String(patientCount) : "—";
  const dc = doctorCount != null ? String(doctorCount) : "—";
  const ac = appointmentCount != null ? String(appointmentCount) : "—";
  const prc = prescriptionCount != null ? String(prescriptionCount) : "—";
  const mc = medicineCount != null ? String(medicineCount) : "—";
  const oc = orderCount != null ? String(orderCount) : "—";
  const treasury = loadingBal ? "…" : bal ? formatEther(bal.value) : "0";

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-teal-700">
            <LayoutDashboard className="h-8 w-8" />
            <h1 className="text-3xl font-bold text-slate-900">Admin dashboard</h1>
          </div>
          <p className="mt-1 text-slate-600">
            Platform overview — patients, doctors, catalog, and contract balance.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
          <span className="text-slate-500">Treasury (ETH)</span>
          <p className="font-mono font-semibold text-slate-900">{treasury}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Patients"
          value={pc}
          icon={<UserRound className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-teal-500 to-cyan-600"
        />
        <StatCard
          title="Doctors (registered)"
          value={dc}
          icon={<Stethoscope className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-indigo-500 to-violet-600"
        />
        <StatCard
          title="Appointments"
          value={ac}
          icon={<Calendar className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          title="Prescriptions"
          value={prc}
          icon={<ClipboardList className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-emerald-500 to-teal-700"
        />
        <StatCard
          title="Medicine SKUs"
          value={mc}
          icon={<Pill className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-pink-500 to-rose-600"
        />
        <StatCard
          title="Orders"
          value={oc}
          icon={<ShoppingBag className="h-8 w-8" />}
          gradientClass="bg-gradient-to-br from-slate-600 to-slate-800"
        />
      </div>

      <Card title="Quick actions" subtitle="Manage the HealthChain deployment">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/admin/doctors", label: "Doctor approvals", icon: Stethoscope },
            { href: "/admin/appointments", label: "Appointments", icon: Calendar },
            { href: "/admin/medicines/add", label: "Add medicine", icon: Pill },
            { href: "/admin/analytics", label: "Analytics & orders", icon: LayoutDashboard },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm font-semibold text-slate-800",
                "transition hover:border-teal-300 hover:bg-teal-50/50"
              )}
            >
              <Icon className="h-5 w-5 text-teal-600" />
              {label}
            </Link>
          ))}
        </div>
      </Card>

      <Card
        title="Contract treasury"
        subtitle="Withdraw ETH collected from medicine orders (payable to admin only)"
        action={
          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
            <Wallet className="h-3.5 w-3.5" />
            {CONTRACT_ADDRESS.slice(0, 10)}…
          </span>
        }
      >
        <p className="text-sm text-slate-600">
          Use <strong>Analytics</strong> to update order shipment status. Withdraw sends the full
          contract balance to the admin wallet.
        </p>
        <WithdrawButton />
      </Card>
    </div>
  );
};

function WithdrawButton() {
  const queryClient = useQueryClient();
  const { writeContract, isPending, data: hash } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
    }
  }, [isSuccess, queryClient]);

  return (
    <Button
      type="button"
      variant="secondary"
      className="mt-4"
      disabled={isPending || confirming}
      onClick={() =>
        writeContract({
          chainId: DAPP_LOCAL_CHAIN_ID,
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: "adminWithdraw",
        })
      }
    >
      {isPending || confirming ? "Confirm…" : isSuccess ? "Withdrawn" : "Withdraw all ETH"}
    </Button>
  );
}

export default AdminDashboard;
