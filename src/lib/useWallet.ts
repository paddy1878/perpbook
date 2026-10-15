"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HyperliquidClient } from "./hyperliquid/client";
import { normaliseFills, normaliseFunding, normalisePositions } from "./hyperliquid/normalise";
import type { Fill, FundingEvent, OpenPosition } from "./hyperliquid/types";
import { buildTrades } from "./engine/trades";
import { dailyPnl, equityCurve, greenStreak, tradeStats } from "./engine/stats";
import { demoAccount } from "./demo";

export type WalletStatus = "idle" | "loading" | "ready" | "error";

type Raw = {
  fills: Fill[];
  funding: FundingEvent[];
  positions: OpenPosition[];
  accountValue: number | null;
  syncedAt: number;
  rawFillCount: number;
};

const client = new HyperliquidClient();

export function useWallet(address: string) {
  const demo = address === "demo";
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<Raw | null>(null);

  const sync = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      if (demo) {
        const d = demoAccount();
        const live = normalisePositions(d.clearinghouse);
        setRaw({
          fills: normaliseFills(d.fills),
          funding: normaliseFunding(d.funding),
          ...live,
          syncedAt: Date.now(),
          rawFillCount: d.fills.length,
        });
      } else {
        const [fills, funding, ch] = await Promise.all([
          client.fills(address),
          client.funding(address),
          client.clearinghouse(address).catch(() => null),
        ]);
        const live = normalisePositions(ch);
        setRaw({
          fills: normaliseFills(fills),
          funding: normaliseFunding(funding),
          ...live,
          syncedAt: Date.now(),
          rawFillCount: fills.length,
        });
      }
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
      setStatus("error");
    }
  }, [address, demo]);

  useEffect(() => {
    void sync();
  }, [sync]);

  const derived = useMemo(() => {
    if (!raw) return null;
    const trades = buildTrades(raw.fills, raw.funding);
    const days = dailyPnl(raw.fills, raw.funding);
    return {
      trades,
      stats: tradeStats(trades),
      days,
      equity: equityCurve(days),
      streak: greenStreak(days),
    };
  }, [raw]);

  return { status, error, raw, derived, sync, demo };
}
