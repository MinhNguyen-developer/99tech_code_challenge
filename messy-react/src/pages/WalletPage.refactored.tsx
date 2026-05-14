import { useMemo } from "react";

// ── Types ──────────────────────────────────────────────
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // was missing from the original type
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
const BLOCKCHAIN_PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number =>
  BLOCKCHAIN_PRIORITY[blockchain] ?? -99;

// ── Component ──────────────────────────────────────────
interface Props extends BoxProps {}

const WalletPage: React.FC<Props> = ({ children: _children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // 1. Filter → sort → format in a single memoised pass.
  // 2. Dependencies are exactly the values used: balances + prices.
  const rows = useMemo(() => {
    return balances
      .filter(
        (b: WalletBalance) => getPriority(b.blockchain) > -99 && b.amount > 0, // fix: keep positive balances
      )
      .sort(
        (a: WalletBalance, b: WalletBalance) =>
          getPriority(b.blockchain) - getPriority(a.blockchain), // fix: always returns a number
      )
      .map((balance: WalletBalance): FormattedWalletBalance => {
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
