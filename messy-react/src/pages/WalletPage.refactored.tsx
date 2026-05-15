import { useMemo } from "react";

// ── Types ──────────────────────────────────────────────
type Blockchain = "Osmosis" | "Ethereum" | "Arbitrum" | "Zilliqa" | "Neo";

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: Blockchain; // was missing from the original type
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

// Assuming these are provided by the codebase:
// import { useWalletBalances, usePrices } from "../hooks";
// import { WalletRow } from "../components/WalletRow";
// import { BoxProps } from "../types";

// ── Pure helper moved outside the component (no closure dependencies) ──
const BLOCKCHAIN_PRIORITY: Record<Blockchain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: Blockchain): number =>
  BLOCKCHAIN_PRIORITY[blockchain] ?? -99;

// ── Component ──────────────────────────────────────────
interface Props extends BoxProps {
  // No additional props for now, but this allows for future extension.
}

const WalletPage: React.FC<Props> = ({ children: _children, ...rest }) => {
  const balances: WalletBalance[] = useWalletBalances();
  const prices = usePrices();

  // 1. Filter → sort → format in a single memoised pass.
  // 2. Dependencies are exactly the values used: balances + prices.
  const rows = useMemo(() => {
    return balances
      .filter(
        (b) => getPriority(b.blockchain) > -99 && b.amount > 0, // fix: keep positive balances
      )
      .sort(
        (a, b) => getPriority(b.blockchain) - getPriority(a.blockchain), // fix: always returns a number
      )
      .map((balance): FormattedWalletBalance => {
        const price = prices[balance.currency] ?? 0;
        return {
          ...balance,
          formatted: balance.amount.toFixed(2),
          usdValue: price * balance.amount,
        };
      });
  }, [balances, prices]); // prices is now legitimately used

  return (
    <div {...rest}>
      {rows.map((balance) => (
        <WalletRow
          className={classes.row}
          key={`${balance.blockchain}-${balance.currency}`} // stable key
          amount={balance.amount}
          usdValue={balance.usdValue}
          formattedAmount={balance.formatted}
        />
      ))}
    </div>
  );
};

export default WalletPage;
