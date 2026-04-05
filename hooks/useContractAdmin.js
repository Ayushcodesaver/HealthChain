import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ABI, CONTRACT_ADDRESS } from "@/config/contract";

/**
 * On-chain admin gate: compares connected wallet to `Healthcare.admin()`.
 */
export function useContractAdmin() {
  const { address, isConnected } = useAccount();
  const enabled = Boolean(CONTRACT_ADDRESS);

  const {
    data: adminAddress,
    isLoading,
    isError,
    error,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "admin",
    query: { enabled },
  });

  const isAdmin = useMemo(() => {
    if (!address || !adminAddress) return false;
    return address.toLowerCase() === String(adminAddress).toLowerCase();
  }, [address, adminAddress]);

  return {
    adminAddress,
    isAdmin,
    isLoadingAdmin: isLoading,
    adminReadError: isError,
    adminError: error,
    isConfigured: enabled,
    isConnected,
    address,
  };
}
