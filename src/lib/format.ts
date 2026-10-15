export function money(
  v: number | null | undefined,
  opts: { compact?: boolean; sign?: boolean; whole?: boolean } = {},
): string {
  const { compact = false, sign = true, whole = false } = opts;
  if (v == null || Number.isNaN(v)) return "–";
  const s = !sign ? "" : v > 0.004 ? "+" : v < -0.004 ? "−" : "";
  const a = Math.abs(v);
  let body: string;
  if (compact && a >= 10_000) body = `${(a / 1000).toFixed(0)}k`;
  else if (compact && a >= 1000) body = `${(a / 1000).toFixed(1)}k`;
  else if ((compact && a >= 100) || whole) body = a.toFixed(0);
  else body = a.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${s}$${body}`;
}

export const pct = (v: number | null | undefined, digits = 0) =>
  v == null || Number.isNaN(v) ? "–" : `${(v * 100).toFixed(digits)}%`;

export const ratio = (v: number | null | undefined) =>
  v == null || Number.isNaN(v) ? "–" : v === Infinity ? "∞" : v.toFixed(2);

export function price(v: number | null | undefined): string {
  if (v == null) return "–";
  if (v >= 1000) return v.toLocaleString("en-GB", { maximumFractionDigits: 1 });
  if (v >= 1) return v.toFixed(v >= 100 ? 2 : 3);
  return v.toPrecision(4);
}

export function size(v: number): string {
  const a = Math.abs(v);
  if (a >= 1000) return a.toLocaleString("en-GB", { maximumFractionDigits: 0 });
  return +a.toPrecision(4) + "";
}

export function duration(ms: number | null | undefined): string {
  if (ms == null) return "–";
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

export const tone = (v: number) => (v > 0.004 ? "up" : v < -0.004 ? "down" : "flat");

export const shortAddress = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

export function when(ms: number): string {
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
