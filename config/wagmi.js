import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import { http } from "wagmi";
import {
  arbitrum,
  base,
  holesky,
  mainnet,
  optimism,
  polygon,
} from "wagmi/chains";

function walletConnectProjectId() {
  const raw = (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "").trim();
  if (!raw || raw === "demo_project_id_replace_me") return "YOUR_PROJECT_ID";
  return raw;
}

const localhostRpc =
  process.env.NEXT_PUBLIC_LOCALHOST_RPC_URL || "http://127.0.0.1:8545";

const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const localChainId =
  Number.isFinite(envChainId) && envChainId > 0 ? envChainId : 1337;

const localChainName =
  (process.env.NEXT_PUBLIC_CHAIN_NAME || "Localhost").trim() || "Localhost";

const nativeSymbol =
  (process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || "ETH").trim() || "ETH";

const explorerUrl = (process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "").trim();

/** Local Hardhat chain — id/RPC/name match .env.local so MetaMask + viem stay aligned */
export const localDevChain = defineChain({
  id: localChainId,
  name: localChainName,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: nativeSymbol,
  },
  rpcUrls: {
    default: { http: [localhostRpc] },
  },
  ...(explorerUrl
    ? {
        blockExplorers: {
          default: { name: "Explorer", url: explorerUrl },
        },
      }
    : {}),
});

const chains = [
  localDevChain,
  holesky,
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base,
];

export const wagmiConfig = getDefaultConfig({
  appName: "HealthChain",
  projectId: walletConnectProjectId(),
  chains,
  transports: {
    [localDevChain.id]: http(localhostRpc, { batch: false }),
    [holesky.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});

export { localDevChain as rainbowInitialChain };
