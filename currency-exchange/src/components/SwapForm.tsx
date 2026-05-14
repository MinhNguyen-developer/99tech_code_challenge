import { useState, useCallback, useEffect } from "react";
import TokenSelector from "./TokenSelector";
import { tokens, convertAmount, getRate } from "../data/prices";

export default function SwapForm() {
  const [fromToken, setFromToken] = useState(tokens[0]?.currency ?? "ETH");
  const [toToken, setToToken] = useState(
    tokens.find((t) => t.currency === "USD")?.currency ??
      tokens[1]?.currency ??
      "USD",
  );
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [lastEdited, setLastEdited] = useState<"from" | "to">("from");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Recalculate when tokens change
  useEffect(() => {
    if (lastEdited === "from" && fromAmount) {
      const val = parseFloat(fromAmount);
      if (!isNaN(val) && val > 0) {
        const result = convertAmount(val, fromToken, toToken);
        setToAmount(result !== null ? formatOutput(result) : "");
      }
    } else if (lastEdited === "to" && toAmount) {
      const val = parseFloat(toAmount);
      if (!isNaN(val) && val > 0) {
        const result = convertAmount(val, toToken, fromToken);
        setFromAmount(result !== null ? formatOutput(result) : "");
      }
    }
  }, [fromToken, toToken]);

  const formatOutput = (n: number) => {
    if (n < 0.000001) return n.toExponential(4);
    if (n < 1) return n.toPrecision(6);
    return parseFloat(n.toFixed(2)).toString();
  };

  const handleFromAmountChange = useCallback(
    (value: string) => {
      setError("");
      setFromAmount(value);
      setLastEdited("from");
      const val = parseFloat(value);
      if (!value || isNaN(val)) {
        setToAmount("");
        return;
      }
      if (val < 0) {
        setError("Amount cannot be negative");
        setToAmount("");
        return;
      }
      const result = convertAmount(val, fromToken, toToken);
      setToAmount(result !== null ? formatOutput(result) : "");
    },
    [fromToken, toToken],
  );

  const handleToAmountChange = useCallback(
    (value: string) => {
      setError("");
      setToAmount(value);
      setLastEdited("to");
      const val = parseFloat(value);
      if (!value || isNaN(val)) {
        setFromAmount("");
        return;
      }
      if (val < 0) {
        setError("Amount cannot be negative");
        setFromAmount("");
        return;
      }
      const result = convertAmount(val, toToken, fromToken);
      setFromAmount(result !== null ? formatOutput(result) : "");
    },
    [fromToken, toToken],
  );

  const handleSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setLastEdited((prev) => (prev === "from" ? "to" : "from"));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const val = parseFloat(fromAmount);
    if (!fromAmount || isNaN(val) || val <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }
    if (fromToken === toToken) {
      setError("Please select different currencies");
      return;
    }

    setSubmitting(true);
    // Simulate network request
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    }, 1500);
  };

  const rate = getRate(fromToken, toToken);
  const canSubmit =
    fromAmount &&
    toAmount &&
    parseFloat(fromAmount) > 0 &&
    fromToken !== toToken &&
    !submitting;

  return (
    <form className="swap-form" onSubmit={handleSubmit}>
      <div className="swap-header">
        <h1>Swap</h1>
        <p className="swap-subtitle">Trade tokens instantly</p>
      </div>

      {/* From */}
      <div className="swap-input-group">
        <div className="swap-input-row">
          <TokenSelector
            selected={fromToken}
            onChange={(c) => {
              setFromToken(c);
              setError("");
            }}
            label="From"
          />
          <div className="amount-input-wrapper">
            <input
              type="number"
              className="amount-input"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
              min="0"
              step="any"
            />
          </div>
        </div>
      </div>

      {/* Swap button */}
      <div className="swap-direction">
        <button
          type="button"
          className="swap-direction-btn"
          onClick={handleSwap}
          title="Swap direction"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 3V17M10 17L5 12M10 17L15 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* To */}
      <div className="swap-input-group">
        <div className="swap-input-row">
          <TokenSelector
            selected={toToken}
            onChange={(c) => {
              setToToken(c);
              setError("");
            }}
            label="To"
          />
          <div className="amount-input-wrapper">
            <input
              type="number"
              className="amount-input"
              placeholder="0.00"
              value={toAmount}
              onChange={(e) => handleToAmountChange(e.target.value)}
              min="0"
              step="any"
            />
          </div>
        </div>
      </div>

      {/* Rate display */}
      {rate !== null && fromToken !== toToken && (
        <div className="swap-rate">
          1 {fromToken} ≈ {formatOutput(rate)} {toToken}
        </div>
      )}

      {/* Error */}
      {error && <div className="swap-error">{error}</div>}

      {/* Success */}
      {submitted && (
        <div className="swap-success">Swap submitted successfully!</div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className={`swap-submit ${submitting ? "loading" : ""}`}
        disabled={!canSubmit}
      >
        {submitting ? (
          <span className="spinner" />
        ) : fromToken === toToken ? (
          "Select different tokens"
        ) : !fromAmount || parseFloat(fromAmount) <= 0 ? (
          "Enter an amount"
        ) : (
          "Swap"
        )}
      </button>
    </form>
  );
}
