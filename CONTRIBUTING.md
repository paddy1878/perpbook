# Contributing to perpbook

Thanks for helping. A few things keep the project easy to work on.

## Setup

```bash
npm install
npm run dev      # http://localhost:3000, /w/demo for sample data
npm test         # engine tests
npm run lint
```

## Ground rules

- **Correct numbers first.** Anything that changes how trades or PnL are calculated needs a test in `src/lib/engine/engine.test.ts` that would have failed before your change.
- **Read-only, always.** perpbook never asks for private keys, signatures or exchange API keys with trading permission.
- **Small pull requests.** One change per PR, with a sentence on why.

## Adding a venue

A venue adapter turns that venue's data into the normalised `Fill` and `FundingEvent` types in `src/lib/hyperliquid/types.ts`. Once it does, trade reconstruction, stats and the dashboard work unchanged. If the venue doesn't report the position size before each fill, compute it from the running total and note that in the adapter.

## Licence

By contributing you agree your work is released under the project's AGPL-3.0 licence.
