import type { HlClearinghouseState, HlFill, HlFunding } from "./hyperliquid/types";

// Deterministic sample account so the dashboard can be shown without a wallet.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COINS: [string, number, number][] = [
  // coin, price, typical size
  ["BTC", 78500, 0.04],
  ["ETH", 2480, 1.2],
  ["SOL", 104, 30],
  ["HYPE", 54, 60],
  ["ZEC", 460, 6],
  ["PYTH", 0.14, 20000],
  ["UNI", 7.2, 400],
  ["PUMP", 0.0041, 700000],
];

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export function demoAccount(now = Date.now()) {
  const r = rng(1878);
  const fills: HlFill[] = [];
  const funding: HlFunding[] = [];
  let tid = 1;
  const end = Math.floor(now / HOUR) * HOUR;
  let t = end - 75 * DAY;

  const push = (coin: string, px: number, sz: number, buy: boolean, time: number, start: number, closedPnl: number) => {
    fills.push({
      coin,
      px: String(+px.toPrecision(6)),
      sz: String(sz),
      side: buy ? "B" : "A",
      time,
      startPosition: String(start),
      dir: closedPnl === 0 && Math.abs(start + (buy ? sz : -sz)) > Math.abs(start) ? (buy ? "Open Long" : "Open Short") : buy ? "Close Short" : "Close Long",
      closedPnl: closedPnl.toFixed(4),
      hash: `0xdemo${tid.toString(16).padStart(8, "0")}`,
      oid: tid,
      crossed: true,
      fee: (px * sz * 0.00045).toFixed(4),
      tid: tid++,
    });
  };

  let openLeft: { coin: string; size: number; px: number } | null = null;

  while (t < end - 6 * HOUR) {
    // Skip some quiet days; trade more in the London/NY overlap.
    t += Math.floor(r() * 14 + 2) * HOUR;
    const hour = new Date(t).getUTCHours();
    if (hour < 7 && r() < 0.7) continue;

    const [coin, base, baseSz] = COINS[Math.floor(Math.pow(r(), 1.6) * COINS.length)];
    const dir = r() < 0.58 ? 1 : -1;
    const px0 = base * (1 + (r() - 0.5) * 0.12);
    const legsIn = 1 + Math.floor(r() * 2);
    const legsOut = 1 + Math.floor(r() * 3);
    const sizeEach = +(baseSz * (0.5 + r())).toPrecision(4);

    let pos = 0;
    let notional = 0;
    let time = t;
    for (let i = 0; i < legsIn; i++) {
      const px = px0 * (1 + (r() - 0.5) * 0.004);
      push(coin, px, sizeEach, dir > 0, time, pos, 0);
      pos = +(pos + dir * sizeEach).toPrecision(12);
      notional += px * sizeEach;
      time += Math.floor(r() * 25 + 2) * 60_000;
    }
    const avg = notional / (sizeEach * legsIn);

    // Slight edge: winners a bit more often, losers a bit bigger.
    const win = r() < 0.55;
    const move = (win ? 0.005 + r() * 0.024 : -(0.004 + r() * 0.019)) * dir;
    const hold = Math.floor((0.2 + r() * 5.5) * HOUR);

    // Hourly funding while open.
    for (let h = Math.ceil(t / HOUR) * HOUR; h < t + hold; h += HOUR) {
      const rate = 0.0000125 * (0.4 + r());
      funding.push({
        time: h,
        hash: `0xfund${h.toString(16)}${coin}`,
        delta: {
          type: "funding",
          coin,
          usdc: (-dir * Math.abs(pos) * avg * rate).toFixed(5),
          szi: String(pos),
          fundingRate: rate.toFixed(8),
        },
      });
    }

    const isLast = t + hold + 8 * HOUR > end && !openLeft;
    if (isLast) {
      openLeft = { coin, size: pos, px: avg };
      break;
    }

    time = Math.max(t + hold, time + 5 * 60_000);
    const total = Math.abs(pos);
    for (let i = 0; i < legsOut; i++) {
      const sz = +(i === legsOut - 1 ? Math.abs(pos) : total / legsOut).toPrecision(i === legsOut - 1 ? 12 : 4);
      const px = avg * (1 + move * (0.7 + 0.3 * ((i + 1) / legsOut)));
      const closed = (px - avg) * sz * dir;
      push(coin, px, sz, dir < 0, time, pos, closed);
      pos = +(pos - dir * sz).toPrecision(12);
      time += Math.floor(r() * 20 + 1) * 60_000;
    }
    t = time;
  }

  const clearinghouse: HlClearinghouseState = {
    marginSummary: { accountValue: "4182.55" },
    assetPositions: openLeft
      ? [
          {
            position: {
              coin: openLeft.coin,
              szi: String(openLeft.size),
              entryPx: String(+openLeft.px.toPrecision(6)),
              positionValue: String(Math.abs(openLeft.size * openLeft.px)),
              unrealizedPnl: (Math.abs(openLeft.size * openLeft.px) * 0.006).toFixed(2),
              liquidationPx: String(+(openLeft.px * (openLeft.size > 0 ? 0.9 : 1.1)).toPrecision(6)),
              leverage: { type: "cross", value: 10 },
            },
          },
        ]
      : [],
  };

  return { fills, funding, clearinghouse };
}
