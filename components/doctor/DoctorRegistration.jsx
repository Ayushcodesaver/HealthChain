import React, { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Stethoscope, Wallet } from "lucide-react";
import Card from "../common/Card";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
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
  if (!PINATA_JWT) return "local-demo-license-cid";
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
  if (!PINATA_JWT) return "local-demo-license-cid";
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  const form = new FormData();
  form.append("file", blob, "doctor-profile.json");
  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });
  if (!res.ok) throw new Error("Pinata profile JSON upload failed");
  const data = await res.json();
  return data.IpfsHash;
}

const SPECIALIZATION_LABELS = [
  "Cardiology",
  "General Practice",
  "Pediatrics",
  "Neurology",
  "Orthopedics",
  "Dermatology",
  "Psychiatry",
  "Other",
];

const specializationOptions = [
  { value: "", label: "Select Your Specialization", disabled: true },
  ...SPECIALIZATION_LABELS.map((s) => ({ value: s, label: s })),
];

function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr || "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

const DoctorRegistration = () => {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [languages, setLanguages] = useState("");
  const [completeAddress, setCompleteAddress] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [consultationFee, setConsultationFee] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [professionalProfile, setProfessionalProfile] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const { data: docRow, isLoading: checking } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "doctors",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(CONTRACT_ADDRESS && address) },
  });

  const exists = docRow?.[0];

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

  const onAddCertificates = (files) => {
    setCertificateFiles((prev) => {
      const next = [...prev];
      for (const f of files) {
        const dup = next.some((p) => p.name === f.name && p.size === f.size);
        if (!dup) next.push(f);
      }
      return next;
    });
  };

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
    if (!fullName.trim()) {
      setErr("Enter your full name.");
      return;
    }
    if (!specialization) {
      setErr("Select your medical specialization.");
      return;
    }
    if (!licenseNumber.trim()) {
      setErr("Enter your medical license number.");
      return;
    }
    if (!qualifications.trim()) {
      setErr("Enter your medical qualifications.");
      return;
    }
    const yearsNum = Number(yearsExperience);
    if (yearsExperience !== "" && (!Number.isFinite(yearsNum) || yearsNum < 0)) {
      setErr("Enter a valid years of experience.");
      return;
    }
    const feeNum = Number(consultationFee);
    if (
      consultationFee !== "" &&
      (!Number.isFinite(feeNum) || feeNum < 0)
    ) {
      setErr("Enter a valid consultation fee (USD).");
      return;
    }

    setBusy(true);
    try {
      let photoCid = "";
      if (photoFile && PINATA_JWT) {
        photoCid = await pinFileToPinata(photoFile);
      }

      const certificateCids = [];
      if (PINATA_JWT && certificateFiles.length) {
        for (const f of certificateFiles) {
          certificateCids.push(await pinFileToPinata(f));
        }
      }

      const profilePayload = {
        type: "HealthChainDoctorProfile",
        walletAddress: address,
        fullName: fullName.trim(),
        phoneNumber: phone.trim(),
        emailAddress: email.trim(),
        languagesSpoken: languages.trim(),
        completeAddress: completeAddress.trim(),
        medicalSpecialization: specialization,
        yearsOfExperience: yearsExperience === "" ? null : yearsNum,
        medicalLicenseNumber: licenseNumber.trim(),
        consultationFeeUSD: consultationFee === "" ? null : feeNum,
        medicalQualifications: qualifications.trim(),
        hospitalClinicAffiliation: affiliation.trim(),
        availableHours: availableHours.trim(),
        professionalProfile: professionalProfile.trim(),
        photoCid: photoCid || undefined,
        certificateCids: certificateCids.length ? certificateCids : undefined,
        certificateFileNames: certificateFiles.map((f) => f.name),
      };

      let licenseCid = "local-demo-license-cid";
      if (PINATA_JWT) {
        licenseCid = await pinJsonToPinata(profilePayload);
      }

      writeContract({
        chainId: DAPP_LOCAL_CHAIN_ID,
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "registerDoctor",
        args: [fullName.trim(), specialization, licenseCid],
      });
    } catch (ex) {
      setErr(ex?.message || "Upload failed");
      setBusy(false);
    }
  };

  if (!CONTRACT_ADDRESS) {
    return (
      <Card title="Register as doctor">
        <p className="text-sm text-amber-800">
          Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_CONTRACT_ADDRESS</code>.
        </p>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card title="Register as doctor" subtitle="Wallet required">
        <p className="text-sm text-slate-600">Connect your wallet from the header.</p>
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
        subtitle="This wallet is linked to a doctor profile."
        action={
          <Link
            href="/doctor/dashboard"
            className="text-sm font-semibold text-teal-600 hover:text-teal-800"
          >
            Dashboard →
          </Link>
        }
      >
        <p className="text-sm text-slate-600">
          Wait for a platform admin to approve your account before booking and prescriptions
          apply.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12 animate-fadeIn">
      <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-600 p-6 text-white shadow-health-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Stethoscope className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Register as Doctor</h1>
              <p className="mt-1 text-sm text-white/90">
                Decentralized Healthcare Platform — your profile metadata is pinned to IPFS; name,
                specialization, and proof CID are stored on-chain.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm">
            <Wallet className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-white/70">
                Connected wallet
              </p>
              <p className="truncate font-mono text-xs sm:text-sm" title={address}>
                {shortAddress(address)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <Card
          title="Personal Information"
          subtitle="Contact details for your professional profile"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Full Name"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Dr. John Smith"
              required
            />
            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
            <Input
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
              className="sm:col-span-2"
            />
            <Input
              label="Languages Spoken"
              name="languages"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="English, Spanish, French"
              className="sm:col-span-2"
            />
            <Input
              label="Complete Address"
              name="address"
              value={completeAddress}
              onChange={(e) => setCompleteAddress(e.target.value)}
              placeholder="123 Medical Center Dr, Healthcare City, HC 12345"
              className="sm:col-span-2"
            />
          </div>
        </Card>

        <Card title="Professional Photo" subtitle="Upload a professional headshot (optional)">
          <FileUpload
            label={photoFile ? photoFile.name : "Choose File — professional headshot"}
            accept="image/*"
            onFile={setPhotoFile}
            disabled={busy || isPending || confirming}
          />
          {photoFile ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">Photo selected — will be pinned with your profile.</p>
          ) : null}
        </Card>

        <Card
          title="Medical Certificates"
          subtitle="Upload your medical degree, license, board certifications, and other relevant professional documents."
        >
          <FileUpload
            multiple
            successHighlight={certificateFiles.length > 0}
            onFiles={onAddCertificates}
            label={
              certificateFiles.length
                ? `${certificateFiles.length} document(s) ready for upload`
                : "Choose File — PDF or images"
            }
            accept=".pdf,image/*"
            disabled={busy || isPending || confirming}
          />
          {certificateFiles.length > 0 ? (
            <ul className="mt-3 space-y-1 text-xs text-slate-600">
              {certificateFiles.map((f) => (
                <li key={`${f.name}-${f.size}`} className="truncate">
                  {f.name}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">
            {PINATA_JWT
              ? "Files are pinned to IPFS via Pinata and referenced from your on-chain profile CID."
              : "Without Pinata JWT, uploads are skipped and a local demo CID is used for registration."}
          </p>
        </Card>

        <Card title="Professional Credentials" subtitle="Required fields are marked">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Select
                label="Medical Specialization"
                name="specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                options={specializationOptions}
                required
              />
            </div>
            <Input
              label="Years of Experience"
              name="yearsExperience"
              type="number"
              min={0}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              placeholder="10"
            />
            <Input
              label="Medical License Number"
              name="licenseNumber"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="NYC-MED-4521"
              required
            />
            <Input
              label="Consultation Fee (USD)"
              name="consultationFee"
              type="number"
              min={0}
              step="0.01"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              placeholder="100"
            />
            <Input
              label="Medical Qualifications"
              name="qualifications"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
              placeholder="MBBS, MD, Fellowship"
              className="sm:col-span-2"
              required
            />
            <Input
              label="Hospital / Clinic Affiliation"
              name="affiliation"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              placeholder="City General Hospital"
              className="sm:col-span-2"
            />
            <Input
              label="Available Hours"
              name="availableHours"
              value={availableHours}
              onChange={(e) => setAvailableHours(e.target.value)}
              placeholder="9:00 AM - 5:00 PM (Mon-Fri)"
              className="sm:col-span-2"
            />
          </div>
        </Card>

        <Card title="Professional Profile" subtitle="Share your medical philosophy and approach to patient care">
          <Textarea
            label="Bio & expertise"
            name="professionalProfile"
            value={professionalProfile}
            onChange={(e) => setProfessionalProfile(e.target.value)}
            placeholder="Share your medical philosophy, areas of expertise, and approach to patient care."
            rows={5}
          />
        </Card>

        {(err || writeErr) && (
          <p className="text-sm text-red-600">{err || writeErr.message}</p>
        )}

        <Button
          type="submit"
          disabled={busy || isPending || confirming}
          className="w-full py-3 text-base"
        >
          {isPending || confirming ? "Confirm in wallet…" : "Register on-chain"}
        </Button>
      </form>

      {isSuccess ? (
        <p className="text-center text-sm font-medium text-emerald-700">
          Submitted. Open your{" "}
          <Link className="underline" href="/doctor/dashboard">
            dashboard
          </Link>{" "}
          for approval status.
        </p>
      ) : null}
    </div>
  );
};

export default DoctorRegistration;
