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

const hoodiRpc =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://rpc.ankr.com/eth_hoodi/8654e9994ce9c3dbc19b1b0dcdd5d60ac9aad383a941d9226f20c1075f29d443";

const envChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID);
const hoodiChainId =
  Number.isFinite(envChainId) && envChainId > 0 ? envChainId : 560048;

const chainName =
  (process.env.NEXT_PUBLIC_CHAIN_NAME || "Hoodi").trim() || "Hoodi";

const nativeSymbol =
  (process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || "ETH").trim() || "ETH";

const explorerUrl = (process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || "").trim();

export const hoodiChain = defineChain({
  id: hoodiChainId,
  name: chainName,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: nativeSymbol,
  },
  rpcUrls: {
    default: { http: [hoodiRpc] },
    public: { http: [hoodiRpc] },
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
  hoodiChain,
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
    [hoodiChain.id]: http(hoodiRpc, { batch: false }),
    [holesky.id]: http(),
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
  ssr: true,
});

export { hoodiChain as rainbowInitialChain };