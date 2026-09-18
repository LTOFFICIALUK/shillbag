"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { BagMark } from "@/components/bag-mark";
import { Receipt, ReceiptRule } from "@/components/receipt";
import { holdingsMessage } from "@/lib/auth-message";
import { TOKEN_SYMBOL, X_HANDLE } from "@/lib/config";
import { encodeSignature, phantomSolana } from "@/lib/phantom";
import { formatUsd } from "@/lib/scoring";
import { cn } from "@/lib/cn";

type MeResponse = {
  connected: boolean;
  address?: string;
  holdings?: {
    balance: string;
    priceUsd: number;
    holdUsd: number;
  };
  tier?: {
    id: string;
    name: string;
    lookbackLabel: string;
    bagbackPercent: number;
    dailyCapUsd: number;
    scanCooldownMs: number;
  };
  x?: {
    username: string;
    followsUs: boolean;
  } | null;
  remainingDailyUsd?: number;
  dailyPaidUsd?: number;
  lastScanAt?: string | null;
  error?: string;
};

type ScanPost = {
  tweetId: string;
  text: string;
  createdAt: string;
  payoutUsd: number;
  skipped?: string;
  lines: { asset: { symbol: string; name: string; kind: string }; payoutUsd: number }[];
  txSignature?: string;
  engagement: {
    likes: number;
    reposts: number;
    quotes: number;
    replies: number;
  };
};

type ScanResponse = {
  error?: string;
  gate?: string;
  demo?: boolean;
  pagesFetched?: number;
  tweetsLooked?: number;
  paidUsd?: number;
  remainingDailyUsd?: number;
  posts?: ScanPost[];
  skipped?: ScanPost[];
};

const shortAddress = (address: string) =>
  `${address.slice(0, 4)}…${address.slice(-4)}`;

const paidHeadline = (posts: ScanPost[]) => {
  const lines = posts.flatMap((post) => post.lines);
  if (lines.length === 0) return null;
  const first = lines[0];
  const rest = lines.slice(1);
  return { first, rest };
};

export const RaidApp = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [status, setStatus] = useState("");
  const [scan, setScan] = useState<ScanResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "scanning" | "paid">("idle");

  const isConnected = Boolean(address);
  const { data: me, refetch: refetchMe } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const response = await fetch("/api/me", { cache: "no-store" });
      return (await response.json()) as MeResponse;
    },
  });
  const holdingsApproved = Boolean(
    me?.connected && me.address && address && me.address === address,
  );

  useEffect(() => {
    const provider = phantomSolana();
    if (!provider) return;
    const handleConnect = (key?: { toBase58: () => string } | null) => {
      if (key) setAddress(key.toBase58());
    };
    const handleDisconnect = () => setAddress(null);
    const handleAccount = (key?: { toBase58: () => string } | null) => {
      setAddress(key ? key.toBase58() : null);
    };
    provider.on("connect", handleConnect);
    provider.on("disconnect", handleDisconnect);
    provider.on("accountChanged", handleAccount);
    if (provider.isConnected && provider.publicKey) {
      setAddress(provider.publicKey.toBase58());
    }
    return () => {
      provider.off?.("connect", handleConnect);
      provider.off?.("disconnect", handleDisconnect);
      provider.off?.("accountChanged", handleAccount);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const x = params.get("x");
    if (!x) return;
    const messages: Record<string, string> = {
      linked: "X is glued to this wallet.",
      follow: `X is linked. Follow @${X_HANDLE} or the raid stays dry.`,
      denied: "X login cancelled.",
      need_wallet: "Prove the bag with Phantom first, then hook X.",
      not_configured: "X login is not live yet.",
      taken: "That X account already belongs to another wallet.",
      failed: "X login failed. Try again.",
    };
    setStatus(messages[x] ?? "X login did not finish.");
    window.history.replaceState({}, "", "/app");
    void refetchMe();
  }, [refetchMe]);

  const handleConnectPhantom = async () => {
    setStatus("");
    const provider = phantomSolana();
    if (!provider) {
      window.open("https://phantom.app/download", "_blank", "noopener,noreferrer");
      setStatus("Install Phantom, then come back on Solana.");
      return;
    }
    setIsConnecting(true);
    try {
      const connected = await provider.connect();
      setAddress(connected.publicKey.toBase58());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Phantom did not connect.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectPhantom = async () => {
    setStatus("");
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch {
      // keep going
    }
    const provider = phantomSolana();
    if (provider) {
      try {
        await provider.disconnect();
      } catch {
        // keep going
      }
    }
    setAddress(null);
    setScan(null);
    setPhase("idle");
    setStatus("Phantom dropped. Hook a different wallet.");
    await refetchMe();
  };

  const handleApproveHoldings = async () => {
    if (!address) return;
    setBusy(true);
    setIsSigning(true);
    setStatus("");
    try {
      const provider = phantomSolana();
      if (!provider) throw new Error("Phantom is not available.");
      const nonce = crypto.randomUUID().slice(0, 8);
      const issuedAt = new Date().toISOString();
      const message = holdingsMessage({ address, nonce, issuedAt });
      const signed = await provider.signMessage(
        new TextEncoder().encode(message),
        "utf8",
      );
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          signature: encodeSignature(signed.signature),
          message,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not size the bag.");
      await refetchMe();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Bag was not approved.");
    } finally {
      setBusy(false);
      setIsSigning(false);
    }
  };

  const handleScan = async () => {
    setBusy(true);
    setStatus("");
    setPhase("scanning");
    try {
      const response = await fetch("/api/scan", { method: "POST" });
      const data = (await response.json()) as ScanResponse;
      if (!response.ok) throw new Error(data.error ?? "Raid blocked.");
      setScan(data);
      if (data.gate) {
        setStatus(data.gate);
        setPhase("idle");
      } else {
        setPhase("paid");
      }
      await refetchMe();
    } catch (error) {
      setPhase("idle");
      setStatus(error instanceof Error ? error.message : "Raid failed.");
    } finally {
      setBusy(false);
    }
  };

  const step = useMemo(() => {
    if (!isConnected) return 1;
    if (!holdingsApproved) return 2;
    if (!me?.x) return 3;
    return 4;
  }, [holdingsApproved, isConnected, me?.x]);

  const canScan =
    holdingsApproved &&
    me?.tier &&
    me.tier.id !== "none" &&
    Boolean(me.x) &&
    Boolean(me.x?.followsUs);

  const loot = scan?.posts ? paidHeadline(scan.posts) : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <p className="eyebrow">Phantom · bag · X · scan</p>
      <h1 className="display mt-4 text-5xl text-slip sm:text-6xl">Scan profile</h1>
      <p className="mt-4 max-w-lg text-[15px] leading-7 text-faint">
        Prove ${TOKEN_SYMBOL}. Hook X. We print a receipt in the memecoin you
        tagged.
      </p>

      <ol className="mt-8 grid grid-cols-4 gap-2 text-[10px] uppercase tracking-[0.12em] text-faint">
        {["Wallet", "Bag", "X", "Scan"].map((label, index) => (
          <li
            key={label}
            aria-current={step === index + 1 ? "step" : undefined}
            className={cn(
              "border-b pb-2",
              step >= index + 1 ? "border-slip text-slip" : "border-white/12",
            )}
          >
            0{index + 1} {label}
          </li>
        ))}
      </ol>

      <Receipt className="mt-8">
        <h2 className="eyebrow !text-mute">01 · Phantom</h2>
        {isConnected && address ? (
          <p className="mt-4 font-mono text-sm">{shortAddress(address)}</p>
        ) : (
          <p className="mt-4 text-[14px] text-mute">
            Connect Phantom on Solana. Signature only. No spend.
          </p>
        )}
        {isConnected ? (
          <button
            type="button"
            onClick={() => void handleDisconnectPhantom()}
            className="btn-ghost mt-6 !border-ink/20 !text-ink"
            aria-label="Disconnect Phantom"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleConnectPhantom()}
            disabled={isConnecting}
            className="btn-ink mt-6"
          >
            {isConnecting ? "Connecting…" : "Connect Phantom"}
          </button>
        )}
      </Receipt>

      <Receipt className="mt-5">
        <h2 className="eyebrow !text-mute">02 · Size the bag</h2>
        {holdingsApproved && me?.holdings && me.tier ? (
          <div className="mt-4">
            <p className="display text-4xl">{formatUsd(me.holdings.holdUsd)}</p>
            <p className="mt-2 text-[14px] text-mute">
              {Number(me.holdings.balance).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}{" "}
              ${TOKEN_SYMBOL} · {me.tier.name}
            </p>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-[12px]">
              <div>
                <dt className="text-faint">Lookback</dt>
                <dd className="mt-1">{me.tier.lookbackLabel}</dd>
              </div>
              <div>
                <dt className="text-faint">Bagback</dt>
                <dd className="mt-1">{me.tier.bagbackPercent}%</dd>
              </div>
              <div>
                <dt className="text-faint">Left today</dt>
                <dd className="mt-1">{formatUsd(me.remainingDailyUsd ?? 0)}</dd>
              </div>
            </dl>
            {me.tier.id === "none" ? (
              <p className="mt-5 text-[14px] text-mute">
                Hold $100 of ${TOKEN_SYMBOL} or we will not scan X.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-[14px] text-mute">
            Sign so we can mark your ${TOKEN_SYMBOL} and lock a shiller.
          </p>
        )}
        {isConnected && !holdingsApproved ? (
          <button
            type="button"
            onClick={() => void handleApproveHoldings()}
            disabled={busy || isSigning}
            className="btn-ink mt-6"
          >
            {isSigning || busy ? "Waiting on Phantom…" : "Approve bag"}
          </button>
        ) : null}
      </Receipt>

      <Receipt className="mt-5">
        <h2 className="eyebrow !text-mute">03 · Hook X</h2>
        {me?.x ? (
          <p className="mt-4 text-[14px]">
            @{me.x.username}
            <span className="ml-2 text-mute">
              {me.x.followsUs ? `following @${X_HANDLE}` : `follow @${X_HANDLE}`}
            </span>
          </p>
        ) : (
          <p className="mt-4 text-[14px] text-mute">
            Locked until the bag is proven. Then attach X to this wallet.
          </p>
        )}
        {holdingsApproved && !me?.x ? (
          <a href="/api/x/oauth/start" className="btn-ink mt-6" aria-label="Log in with X">
            Connect X
          </a>
        ) : null}
      </Receipt>

      <Receipt className="mt-5">
        <h2 className="eyebrow !text-mute">04 · Scan</h2>
        <p className="mt-4 text-[14px] text-mute">
          One request. Lookback capped by shiller. Original posts only.
        </p>
        <button
          type="button"
          onClick={() => void handleScan()}
          disabled={busy || !canScan}
          className="btn-ink mt-6"
        >
          {busy ? "Scanning…" : "Scan profile"}
        </button>
        {!canScan && holdingsApproved ? (
          <p className="mt-3 text-[12px] text-faint">
            Need a shiller, linked X, and a follow of @{X_HANDLE}.
          </p>
        ) : null}
      </Receipt>

      {status ? (
        <p className="mt-6 text-[14px] text-faint" role="status">
          {status}
        </p>
      ) : null}

      {phase === "scanning" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-night/88 px-4"
          role="alertdialog"
          aria-label="Scanning profile"
        >
          <Receipt className="w-full max-w-sm text-center">
            <p className="scan-print display text-4xl">Scanning</p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-mute">
              printing the timeline
            </p>
          </Receipt>
        </div>
      ) : null}

      {phase === "paid" && scan ? (
        <Receipt className="print-out mt-10" aria-live="polite">
          <div className="flex items-start justify-between">
            <BagMark className="h-10 w-10" inverted />
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">
              SHILLBAG / RAID
            </p>
          </div>
          {loot ? (
            <>
              <p className="stamp mt-8 h-14 w-28 text-xl">Paid.</p>
              <p className="display mt-6 text-4xl leading-[0.95] sm:text-5xl">
                You got paid {formatUsd(loot.first.payoutUsd)} in ${loot.first.asset.symbol}
              </p>
              {loot.rest.map((line) => (
                <p key={line.asset.symbol} className="mt-3 text-[18px]">
                  and {formatUsd(line.payoutUsd)} in ${line.asset.symbol}
                </p>
              ))}
              <p className="mt-4 font-mono text-[11px] text-mute">
                {formatUsd(scan.paidUsd ?? 0)} total · {scan.tweetsLooked} posts ·{" "}
                {scan.pagesFetched} page{scan.pagesFetched === 1 ? "" : "s"}
                {scan.demo ? " · demo" : ""}
              </p>
            </>
          ) : (
            <>
              <p className="display mt-8 text-3xl">
                Scan finished. No Solana CA in this lookback.
              </p>
              <p className="mt-4 text-[14px] leading-6 text-mute">
                Fresh tickers often have no mint on X yet. A bare $TICKER is
                skipped.
              </p>
            </>
          )}

          {scan.posts && scan.posts.length > 0 ? (
            <ul className="mt-8 space-y-4">
              {scan.posts.map((post) => (
                <li key={post.tweetId}>
                  <ReceiptRule />
                  <p className="text-[14px] leading-6">{post.text}</p>
                  {post.lines.map((line) => (
                    <p key={line.asset.symbol} className="mt-3 font-mono text-[13px]">
                      You got paid {formatUsd(line.payoutUsd)} in ${line.asset.symbol}
                    </p>
                  ))}
                  {post.txSignature ? (
                    <a
                      href={`https://solscan.io/tx/${post.txSignature}`}
                      className="mt-2 inline-block font-mono text-[11px] text-mute underline"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="View payout on Solscan"
                    >
                      {post.txSignature.slice(0, 8)}…{post.txSignature.slice(-8)}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </Receipt>
      ) : null}
    </div>
  );
};
