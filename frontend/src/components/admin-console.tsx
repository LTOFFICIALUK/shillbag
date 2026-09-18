"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatUsd } from "@/lib/scoring";

type AdminStats = {
  wallets: number;
  xLinked: number;
  followingUs: number;
  scans: number;
  tweetsLooked: number;
  paidUsd: number;
  paidUsd24h: number;
  scans24h: number;
  claims: Record<string, { count: number; paid: number }>;
  scansByTier: { tierId: string; count: number; paid: number }[];
  recentClaims: {
    tweetId: string;
    username: string;
    payoutUsd: number;
    claimedAt: string;
    status: string;
  }[];
};

export const AdminConsole = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [authedEmail, setAuthedEmail] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const loadStats = async () => {
    const response = await fetch("/api/admin/stats", { cache: "no-store" });
    const data = (await response.json()) as {
      error?: string;
      email?: string;
      stats?: AdminStats;
    };
    if (!response.ok) {
      setAuthedEmail(null);
      setStats(null);
      return false;
    }
    setAuthedEmail(data.email ?? "admin");
    setStats(data.stats ?? null);
    return true;
  };

  useEffect(() => {
    void loadStats();
  }, []);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Denied.");
      await loadStats();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Denied.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthedEmail(null);
    setStats(null);
  };

  if (!authedEmail) {
    return (
      <main className="mx-auto max-w-md px-4 py-24">
        <h1 className="display text-4xl text-ink">Ops</h1>
        <form onSubmit={(event) => void handleLogin(event)} className="mt-8 grid gap-4">
          <label className="grid gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-line bg-white px-3 py-3 text-ink"
              type="email"
              autoComplete="username"
              required
            />
          </label>
          <label className="grid gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
            Code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="rounded-2xl border border-line bg-white px-3 py-3 text-ink"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
        {status ? <p className="mt-4 text-[14px] text-mute">{status}</p> : null}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl text-ink">Ops</h1>
        <button type="button" onClick={() => void handleLogout()} className="btn-ghost">
          Out
        </button>
      </div>
      {stats ? (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-4">
            {[
              ["Wallets", String(stats.wallets)],
              ["X linked", String(stats.xLinked)],
              ["Raids", String(stats.scans)],
              ["Paid", formatUsd(stats.paidUsd)],
            ].map(([label, value]) => (
              <article key={label} className="rounded-[20px] border border-line bg-white p-4">
                <p className="text-[11px] font-semibold uppercase text-faint">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
              </article>
            ))}
          </div>
          <ul className="mt-8 divide-y divide-line overflow-hidden rounded-[24px] border border-line bg-white px-4">
            {stats.recentClaims.map((claim) => (
              <li key={claim.tweetId} className="flex justify-between py-3 text-[13px]">
                <span>@{claim.username}</span>
                <span className="font-mono">
                  {formatUsd(claim.payoutUsd)} · {claim.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
};
