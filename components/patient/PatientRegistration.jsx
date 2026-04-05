import React, { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { UserPlus } from "lucide-react";
import Card from "../common/Card";
import Input from "../common/Input";
import Button from "../common/Button";
import FileUpload from "../common/FileUpload";
import LoadingSpinner from "../common/LoadingSpinner";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  DAPP_LOCAL_CHAIN_ID,
  PINATA_JWT,
} from "../../config/contract";
async function pinFileToPinata(file) {
  if (!PINATA_JWT) return "local-demo-record-cid";
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) throw new Error("Pinata upload failed");
  const data = await res.json();
  return data.IpfsHash;
}

async function pinJsonToPinata(obj) {
  if (!PINATA_JWT) return "local-demo-record-cid";
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const form = new FormData();
  form.append("file", blob, "patient-profile.json");
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) throw new Error("Pinata profile JSON upload failed");
  const data = await res.json();
  return data.IpfsHash;
}

const PatientRegistration = () => {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const { data: exists, isLoading: checking } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isPatient",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(CONTRACT_ADDRESS && address) },
  });

  const { writeContract, data: hash, isPending, error: writeErr } =
    useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  React.useEffect(() => {
    if (isSuccess && address) {
      queryClient.invalidateQueries({ queryKey: ["readContract"] });
      setBusy(false);
      setErr("");
    }
  }, [isSuccess, queryClient, address]);

  React.useEffect(() => {
    if (writeErr) setBusy(false);
  }, [writeErr]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!CONTRACT_ADDRESS) {
      setErr("Contract address is not configured.");
      return;
    }
    if (!isConnected || !address) {
      setErr("Connect your wallet first.");
      return;
    }
    const ageNum = Number(age);
    if (!name.trim() || !Number.isFinite(ageNum) || ageNum < 1 || ageNum > 120) {
      setErr("Enter a valid name and age (1–120).");
      return;
    }
    setBusy(true);
    try {
      let photoCid = "";
      if (photoFile && PINATA_JWT) {
        photoCid = await pinFileToPinata(photoFile);
      }
      let medicalRecordCid = "";
      if (file && PINATA_JWT) {
        medicalRecordCid = await pinFileToPinata(file);
      }

      const profilePayload = {
        type: "HealthChainPatientProfile",
        walletAddress: address,
        fullName: name.trim(),
        age: Math.floor(ageNum),
        photoCid: photoCid || undefined,
        medicalRecordCid: medicalRecordCid || undefined,
        medicalRecordFileName: file ? file.name : undefined,
      };

      let recordCid = "local-demo-record-cid";
      if (PINATA_JWT) {
        recordCid = await pinJsonToPinata(profilePayload);
      }

      writeContract({
        chainId: DAPP_LOCAL_CHAIN_ID,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registerPatient",
        args: [name.trim(), Math.floor(ageNum), recordCid],
      });
    } catch (ex) {
      setErr(ex?.message || "Upload failed");
      setBusy(false);
    }
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Register as patient">
        <p className="text-sm text-amber-800">
          Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_CONTRACT_ADDRESS</code> to
          continue.
        </p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Register as patient" subtitle="Wallet required">
        <p className="text-sm text-slate-600">Connect your wallet from the header, then return here.</p>
      </Card>
    );
  }

  if (checking) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (exists) {
    return (
      <Card
        title="Already registered"
        subtitle="This wallet is linked to a patient profile."
        action={
          <Link
            href="/patient/dashboard"
            className="text-sm font-semibold text-teal-600 hover:text-teal-800"
          >
            Dashboard →
          </Link>
        }
      >
        <p className="text-sm text-slate-600">
          You can book appointments, browse medicines, and manage orders from the sidebar.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-xl animate-fadeIn">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white shadow-health-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <UserPlus className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Patient registration</h1>
            <p className="text-sm text-white/90">
              Name and age on-chain; a JSON profile (photo + record file CIDs) is pinned to IPFS when
              Pinata is configured — same idea as doctor registration.
            </p>
          </div>
        </div>
      </div>

      <Card title="Create profile" subtitle="Fields are written to the Healthcare smart contract">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            label="Full name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            required
          />
          <Input
            label="Age"
            name="age"
            type="number"
            min={1}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="32"
            required
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Profile photo (optional)</p>
            <FileUpload
              label={photoFile ? photoFile.name : "Upload profile photo"}
              accept="image/*"
              onFile={setPhotoFile}
              disabled={busy || isPending || confirming}
            />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Medical record (optional)</p>
            <FileUpload
              label={file ? file.name : "Upload record PDF / image"}
              accept=".pdf,image/*"
              onFile={setFile}
              disabled={busy || isPending || confirming}
            />
            <p className="mt-1 text-xs text-slate-500">
              {PINATA_JWT
                ? "Photo and record are pinned first; a profile JSON is pinned and its CID is stored on-chain."
                : "Without Pinata JWT, a placeholder CID is used for local development."}
            </p>
          </div>
          {(err || writeErr) && (
            <p className="text-sm text-red-600">{err || writeErr.message}</p>
          )}
          <Button
            type="submit"
            disabled={busy || isPending || confirming}
            className="w-full"
          >
            {isPending || confirming ? "Confirm in wallet…" : "Register on-chain"}
          </Button>
        </form>
        {isSuccess ? (
          <p className="mt-4 text-sm font-medium text-emerald-700">
            Success — redirecting is not automatic; open your{" "}
            <Link className="underline" href="/patient/dashboard">
              dashboard
            </Link>
            .
          </p>
        ) : null}
      </Card>
    </div>
  );
};

export default PatientRegistration;
