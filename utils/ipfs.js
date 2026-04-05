import { PINATA_JWT, PINATA_GATEWAY } from "../config/contract";

const PIN_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
const PIN_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

function requireJwt() {
  if (!PINATA_JWT) {
    throw new Error(
      "IPFS upload requires NEXT_PUBLIC_PINATA_JWT in your environment."
    );
  }
}

/**
 * Normalizes `ipfs://...`, `ipfs/...`, or bare CID to a CID string.
 * @param {string} cidOrUri
 * @returns {string}
 */
export function toCid(cidOrUri) {
  if (!cidOrUri) return "";
  const s = String(cidOrUri).trim();
  if (s.startsWith("ipfs://")) return s.slice(7);
  if (s.startsWith("ipfs/")) return s.slice(5);
  return s;
}

/**
 * Resolves a CID or ipfs:// URI to an HTTP gateway URL.
 * @param {string} cidOrUri
 * @returns {string}
 */
export function gatewayUrl(cidOrUri) {
  const cid = toCid(cidOrUri);
  if (!cid) return "";
  const base = PINATA_GATEWAY.replace(/\/$/, "");
  return `${base}/ipfs/${cid}`;
}

/**
 * Uploads a JSON-serializable object to Pinata IPFS.
 * @param {Record<string, unknown>} payload
 * @param {string} [name]
 * @returns {Promise<{ cid: string; gatewayUrl: string }>}
 */
export async function uploadJsonToIpfs(payload, name = "metadata.json") {
  requireJwt();
  const res = await fetch(PIN_JSON_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: { name },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata pinJSONToIPFS failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const cid = data.IpfsHash;
  return { cid, gatewayUrl: gatewayUrl(cid) };
}

/**
 * Uploads a browser File or Blob to Pinata IPFS.
 * @param {File | Blob} file
 * @param {string} [filename]
 * @returns {Promise<{ cid: string; gatewayUrl: string }>}
 */
export async function uploadFileToIpfs(file, filename) {
  requireJwt();
  const formData = new FormData();
  const label =
    filename ||
    (typeof File !== "undefined" && file instanceof File ? file.name : "file");
  formData.append("file", file, label);

  const res = await fetch(PIN_FILE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata pinFileToIPFS failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const cid = data.IpfsHash;
  return { cid, gatewayUrl: gatewayUrl(cid) };
}
