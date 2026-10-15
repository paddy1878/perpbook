import { describe, expect, it } from "vitest";
import { demoAccount } from "./demo";
import { normaliseFills, normaliseFunding } from "./hyperliquid/normalise";
import { buildTrades } from "./engine/trades";
import { tradeStats } from "./engine/stats";

describe("demo account", () => {
  it("produces clean, consistent trades", () => {
    const d = demoAccount(Date.UTC(2026, 9, 15, 20));
    const trades = buildTrades(normaliseFills(d.fills), normaliseFunding(d.funding));
    const s = tradeStats(trades, "UTC");
    expect(trades.some((t) => t.partialHistory)).toBe(false);
    expect(trades.filter((t) => t.status === "open").length).toBeLessThanOrEqual(1);
    expect(s.trades).toBeGreaterThan(60);
    expect(s.winRate).toBeGreaterThan(0.35);
    expect(s.winRate).toBeLessThan(0.75);
    expect(s.funding).toBeLessThan(0);
  });
});
