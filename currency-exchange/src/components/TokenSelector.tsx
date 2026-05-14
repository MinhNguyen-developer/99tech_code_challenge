import { useState, useRef, useEffect } from "react";
import { tokens, getTokenIcon } from "../data/prices";

interface TokenSelectorProps {
  selected: string;
  onChange: (currency: string) => void;
  label: string;
}

export default function TokenSelector({
  selected,
  onChange,
  label,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const filtered = tokens.filter((t) =>
    t.currency.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="token-selector" ref={ref}>
      <span className="token-selector-label">{label}</span>
      <button
        className="token-selector-btn"
        onClick={() => setOpen(!open)}
        type="button"
      >
        <img
          src={getTokenIcon(selected)}
          alt={selected}
          className="token-icon"
          width={24}
          height={24}
        />
        <span className="token-name">{selected}</span>
        <svg
          className={`chevron ${open ? "open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="token-dropdown">
          <div className="token-search-wrapper">
            <input
              ref={searchRef}
              type="text"
              className="token-search"
              placeholder="Search token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="token-list">
            {filtered.length === 0 && (
              <li className="token-option no-results">No tokens found</li>
            )}
            {filtered.map((t) => (
              <li
                key={t.currency}
                className={`token-option ${t.currency === selected ? "active" : ""}`}
                onClick={() => {
                  onChange(t.currency);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <img
                  src={getTokenIcon(t.currency)}
                  alt={t.currency}
                  className="token-icon"
                  width={20}
                  height={20}
                />
                <span>{t.currency}</span>
                <span className="token-price">
                  ${t.price < 0.01 ? t.price.toFixed(6) : t.price.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
