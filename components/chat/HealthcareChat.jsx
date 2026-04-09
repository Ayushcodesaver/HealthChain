import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { MessageSquare, Send, Shield, Sparkles } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import { cn } from "../common/cn";

const STORAGE_KEY = "medivault-chat-messages-v1";

function loadStored() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveStored(messages) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    /* ignore */
  }
}

const WELCOME = {
  id: "welcome",
  role: "assistant",
  text: "Welcome to Medivault Messages. This is a local demo chat (not on-chain). Ask about appointments, prescriptions, or wallet connection — responses are simulated.",
  at: Date.now(),
};

function replyFor(input) {
  const q = input.toLowerCase();
  if (q.includes("wallet") || q.includes("connect"))
    return "Connect your wallet from the header to use patient, doctor, or admin dashboards.";
  if (q.includes("appointment") || q.includes("book"))
    return "Patients can book visits under Patient → Appointments after registering on-chain.";
  if (q.includes("medicine") || q.includes("order"))
    return "Browse Medicines on the marketing site or open Patient → Medicines to place ETH orders.";
  if (q.includes("doctor"))
    return "Doctors register on-chain, wait for admin approval, then manage visits and prescriptions.";
  if (q.includes("admin"))
    return "The deployer wallet is the default admin for approvals, catalog, and treasury.";
  return "Thanks for your message. For real support, use the appropriate Medivault portal from the navigation. How else can I help?";
}

const HealthcareChat = () => {
  const { address, isConnected } = useAccount();
  const [messages, setMessages] = useState([WELCOME]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const prev = loadStored();
    if (prev && Array.isArray(prev) && prev.length) setMessages(prev);
  }, []);

  useEffect(() => {
    saveStored(messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      at: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: replyFor(text),
          at: Date.now(),
        },
      ]);
      setTyping(false);
    }, 600 + Math.random() * 400);
  };

  const clear = () => {
    setMessages([WELCOME]);
    saveStored([WELCOME]);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-16 pt-4 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-500/25">
          <MessageSquare className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-600">
            Demo assistant — messages stay in this browser session only.
          </p>
        </div>
      </div>

      <Card
        title="Healthcare assistant"
        subtitle={
          isConnected
            ? `Connected as ${address?.slice(0, 6)}…${address?.slice(-4)}`
            : "Connect a wallet to align with your Medivault identity"
        }
        action={
          <button
            type="button"
            onClick={clear}
            className="text-xs font-semibold text-slate-500 hover:text-teal-700"
          >
            Clear chat
          </button>
        }
      >
        <div className="flex max-h-[min(55vh,520px)] flex-col gap-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white",
                  msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600"
                    : "bg-gradient-to-br from-teal-500 to-cyan-600"
                )}
              >
                {msg.role === "user" ? (
                  <Shield className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-800"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {typing ? (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500">
                Typing…
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form className="mt-4 flex gap-2" onSubmit={send}>
          <input
            className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10"
            placeholder="Ask about the platform…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Message"
          />
          <Button type="submit" disabled={!draft.trim() || typing}>
            <Send className="h-4 w-4" />
            Send
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          Need a role dashboard?{" "}
          <Link href="/patient" className="font-semibold text-teal-600">
            Patient
          </Link>
          {" · "}
          <Link href="/doctor" className="font-semibold text-teal-600">
            Doctor
          </Link>
          {" · "}
          <Link href="/admin" className="font-semibold text-teal-600">
            Admin
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default HealthcareChat;
