# 99Tech Code Challenge

Three frontend engineering tasks covering algorithms, UI development, and code review.

---

## Task 1 — Sum to N (`sum_to_n.js`)

Implement a function `sum_to_n(n)` that returns the summation of all integers from 1 to `n`.

**Example:** `sum_to_n(5) === 1 + 2 + 3 + 4 + 5 === 15`

Three distinct implementations are provided:

| Variant      | Approach                            | Time Complexity | Space Complexity |
| ------------ | ----------------------------------- | --------------- | ---------------- |
| `sum_to_n_a` | Gaussian formula: `n * (n + 1) / 2` | O(1)            | O(1)             |
| `sum_to_n_b` | Iterative `for` loop                | O(n)            | O(1)             |
| `sum_to_n_c` | Recursion                           | O(n)            | O(n)             |

> All implementations assume the result fits within `Number.MAX_SAFE_INTEGER`.

---

## Task 2 — Currency Swap Form (`currency-exchange/`)

A responsive currency swap interface built with **React 19 + TypeScript + Vite**.

### Features

- **Bidirectional conversion** — edit either the _From_ or _To_ amount and the other updates in real-time
- **Searchable token dropdown** — all tokens from `price.json` with their SVG icons and USD prices
- **Swap direction** — flip the token pair with an animated arrow button
- **Exchange rate display** — live `1 A ≈ x B` rate between selected tokens
- **Input validation** — catches negative amounts, same-token swaps, and empty inputs
- **Simulated submission** — loading spinner while the swap "processes", followed by a success toast
- **Dark theme** — gradient background, glow effects, smooth CSS transitions
- **Responsive** — adapts to mobile viewports

### Stack

- React 19 + TypeScript
- Vite
- CSS custom properties (no component library)
- Token icons from [`token-icons`](https://github.com/Switcheo/token-icons)
- Price data from `price.json` (deduplicated to the latest entry per currency)

### Running locally

```bash
cd currency-exchange
npm install
npm run dev
# → http://localhost:5173
```

---

## Task 3 — Messy React (`messy-react/`)

A code review and refactor of a buggy `WalletPage` component.

### Issues identified in the original code

| #   | Category                  | Issue                                                                                                   |
| --- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Type error                | `blockchain` field missing from `WalletBalance` interface                                               |
| 2   | Type design               | `FormattedWalletBalance` redeclares all `WalletBalance` fields instead of extending it                  |
| 3   | Anti-pattern              | `children` destructured from props but never used                                                       |
| 4   | Performance / type safety | `getPriority` declared inside the component (re-created every render) and typed as `any`                |
| 5   | Runtime bug               | `lhsPriority` (undefined variable) used instead of `balancePriority` — causes `ReferenceError`          |
| 6   | Logic bug                 | Filter keeps `amount <= 0` (zero/negative) and discards positive balances — inverted intent             |
| 7   | Undefined behaviour       | `.sort()` comparator returns `undefined` when priorities are equal instead of `0`                       |
| 8   | Performance               | `prices` in `useMemo` deps array but not used in the computation — causes unnecessary resorting         |
| 9   | Performance               | `formattedBalances` computed every render but never consumed                                            |
| 10  | Type lie                  | `sortedBalances` items cast as `FormattedWalletBalance` — `balance.formatted` is `undefined` at runtime |
| 11  | React anti-pattern        | Array `index` used as `key` — breaks reconciliation on reorder/insert/delete                            |

### Refactored highlights

- `blockchain: string` added to `WalletBalance`; `FormattedWalletBalance` uses `extends`
- `getPriority` moved outside the component as a pure lookup against a `Record<string, number>`
- Filter corrected to `getPriority(b.blockchain) > -99 && b.amount > 0`
- Sort uses arithmetic subtraction: `getPriority(b.blockchain) - getPriority(a.blockchain)`
- Filter → sort → format merged into a **single `useMemo`** that legitimately depends on both `balances` and `prices`
- Stable `key={`${balance.blockchain}-${balance.currency}`}` replaces `key={index}`

See [`messy-react/src/pages/WalletPage.tsx`](messy-react/src/pages/WalletPage.tsx) for the annotated original and [`messy-react/src/pages/WalletPage.refactored.tsx`](messy-react/src/pages/WalletPage.refactored.tsx) for the refactored version.
