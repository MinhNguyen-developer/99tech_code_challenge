import { useMemo } from "react";

// ===========================================================================
// ISSUE 1 — Incomplete type: missing `blockchain` property
// ---------------------------------------------------------------------------
// `getPriority` and the filter both access `balance.blockchain`, but the
// `WalletBalance` interface only declares `currency` and `amount`.
// This causes a TypeScript compilation error.
//
// FIX: Add `blockchain: string` to WalletBalance.
// ===========================================================================
interface WalletBalance {
  currency: string;
  amount: number;
}
// ===========================================================================
// ISSUE 2 — Redundant / inconsistent type definition
// ---------------------------------------------------------------------------
// `FormattedWalletBalance` duplicates all fields of `WalletBalance` instead
// of extending it. If WalletBalance changes (e.g. adding `blockchain`), this
// type falls out of sync.
//
// FIX: `interface FormattedWalletBalance extends WalletBalance { formatted: string; }`
// ===========================================================================
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}

interface Props extends BoxProps {}
const WalletPage: React.FC<Props> = (props: Props) => {
  // =========================================================================
  // ISSUE 3 — `children` is destructured but never used
  // -----------------------------------------------------------------------
  // Extracting `children` serves no purpose and is silently discarded.
  //
  // FIX: Remove `children` from the destructure or prefix with `_` to signal
  //       that it is intentionally unused.
  // =========================================================================
  const { children, ...rest } = props;

  const balances = useWalletBalances();
  const prices = usePrices();

  // =========================================================================
  // ISSUE 4 — `getPriority` is re-created on every render & uses `any`
  // -----------------------------------------------------------------------
  // a) Declared inside the component body → a new function reference is
  //    allocated on every render. Because it is called inside `useMemo`,
  //    the memoisation still works, but the allocation is wasteful.
  // b) The parameter type is `any`, which defeats TypeScript's type safety.
  //
  // FIX: Move the function (or a lookup map) outside the component — it has
  //       no dependency on component state. Type the parameter as `string`.
  //
  //   const PRIORITY: Record<string, number> = {
  //     Osmosis: 100, Ethereum: 50, Arbitrum: 30, Zilliqa: 20, Neo: 20,
  //   };
  //   const getPriority = (blockchain: string): number =>
  //     PRIORITY[blockchain] ?? -99;
  // =========================================================================
  const getPriority = (blockchain: any): number => {
    switch (blockchain) {
      case "Osmosis":
        return 100;
      case "Ethereum":
        return 50;
      case "Arbitrum":
        return 30;
      case "Zilliqa":
        return 20;
      case "Neo":
        return 20;
      default:
        return -99;
    }
  };

  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const balancePriority = getPriority(balance.blockchain);

        // =================================================================
        // ISSUE 5 — Reference to undefined variable `lhsPriority`
        // ---------------------------------------------------------------
        // `balancePriority` is computed on the line above but never used.
        // Instead, `lhsPriority` — which is never declared — is referenced.
        // This is a runtime ReferenceError that crashes the application.
        //
        // FIX: Replace `lhsPriority` with `balancePriority`.
        // =================================================================

        // =================================================================
        // ISSUE 6 — Filter logic is inverted
        // ---------------------------------------------------------------
        // The condition `balance.amount <= 0` returns `true`, meaning the
        // filter KEEPS zero and negative balances and DISCARDS positive
        // ones. This is almost certainly the opposite of the intent.
        //
        // FIX: Change to `balance.amount > 0` so only positive (non-empty)
        //       balances are displayed.
        // =================================================================
        if (lhsPriority > -99) {
          if (balance.amount <= 0) {
            return true;
          }
        }
        return false;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        // =================================================================
        // ISSUE 7 — Sort comparator does not return 0 for equal values
        // ---------------------------------------------------------------
        // When leftPriority === rightPriority, the function implicitly
        // returns `undefined`. The ECMAScript spec requires the comparator
        // to return a number; returning undefined is undefined behaviour
        // and can produce inconsistent ordering across JS engines.
        //
        // FIX: Use arithmetic subtraction which naturally handles all cases:
        //   return getPriority(b.blockchain) - getPriority(a.blockchain);
        // =================================================================
        if (leftPriority > rightPriority) {
          return -1;
        } else if (rightPriority > leftPriority) {
          return 1;
        }
      });
    // =====================================================================
    // ISSUE 8 — `prices` is listed as a dependency but never used
    // -------------------------------------------------------------------
    // The `useMemo` dependency array includes `prices`, but the memoised
    // computation only uses `balances` and `getPriority`. Any change to
    // `prices` triggers an unnecessary recomputation of sorting/filtering.
    //
    // FIX: Either remove `prices` from the dependency array, or merge the
    //       formatting step (which does need prices) into this same useMemo
    //       so the dependency is justified.
    // =====================================================================
  }, [balances, prices]);

  // =======================================================================
  // ISSUE 9 — `formattedBalances` is computed but never consumed
  // ---------------------------------------------------------------------
  // This `.map()` builds a new array with `formatted` fields, but the
  // result (`formattedBalances`) is never referenced again. The `rows`
  // variable below maps over `sortedBalances` instead. This is a wasted
  // O(n) allocation + computation on every render.
  //
  // FIX: Either use `formattedBalances` in the rows mapping below, or
  //       merge this step into the useMemo above to avoid an extra pass.
  // =======================================================================
  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed(),
    };
  });

  // =======================================================================
  // ISSUE 10 — Maps `sortedBalances` but types each item as `FormattedWalletBalance`
  // ---------------------------------------------------------------------
  // `sortedBalances` contains plain `WalletBalance` objects (no `formatted`
  // field). Casting to `FormattedWalletBalance` is a type lie — accessing
  // `balance.formatted` yields `undefined`, so `formattedAmount` passed
  // to WalletRow is always undefined.
  //
  // FIX: Map over `formattedBalances` (after fixing Issue 9), or merge
  //       the formatting into a single pipeline.
  // =======================================================================

  // =======================================================================
  // ISSUE 11 — Array index used as React `key`
  // ---------------------------------------------------------------------
  // `key={index}` breaks React's reconciliation when the list is
  // reordered, filtered, or items are inserted/removed. This can cause
  // incorrect UI state and unnecessary re-renders.
  //
  // FIX: Use a stable, unique identifier:
  //   key={`${balance.blockchain}-${balance.currency}`}
  // =======================================================================
  const rows = sortedBalances.map(
    (balance: FormattedWalletBalance, index: number) => {
      const usdValue = prices[balance.currency] * balance.amount;
      return (
        <WalletRow
          className={classes.row}
          key={index}
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.formatted}
        />
      );
    },
  );

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;
