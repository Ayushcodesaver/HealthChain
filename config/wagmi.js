import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { sepolia } from "wagmi/chains";

function walletConnectProjectId() {
  const raw = (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "").trim();
  if (!raw || raw === "demo_project_id_replace_me") return "YOUR_PROJECT_ID";
  return raw;
}

const chains = [sepolia];

export const wagmiConfig = getDefaultConfig({
  appName: "Medivault",
  projectId: walletConnectProjectId(),
  chains,
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});

export { sepolia as rainbowInitialChain };