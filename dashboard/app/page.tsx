"use client";
import { useState } from "react";

const ecosystemData = [
  { name: "XRP", mad: 174, ft: 12, pt: 77, ot: 85, repos: 2743, color: "#23292F", pinned: true },
  { name: "Ethereum", mad: 5357, ft: 455, pt: 2658, ot: 2244, repos: 139856, color: "#627EEA", pinned: false },
  { name: "Solana", mad: 2660, ft: 317, pt: 1385, ot: 958, repos: 83532, color: "#9945FF", pinned: false },
  { name: "Base", mad: 1155, ft: 101, pt: 594, ot: 460, repos: 14033, color: "#0052FF", pinned: false },
  { name: "Polygon", mad: 1129, ft: 92, pt: 542, ot: 495, repos: 32219, color: "#8247E5", pinned: false },
  { name: "Bitcoin", mad: 928, ft: 112, pt: 492, ot: 324, repos: 18084, color: "#F7931A", pinned: false },
  { name: "Arbitrum", mad: 866, ft: 85, pt: 445, ot: 336, repos: 10258, color: "#28A0F0", pinned: false },
  { name: "Foundry", mad: 769, ft: 149, pt: 426, ot: 194, repos: 8364, color: "#555", pinned: false },
  { name: "BNB Chain", mad: 731, ft: 57, pt: 362, ot: 312, repos: 21868, color: "#F3BA2F", pinned: false },
  { name: "Sui", mad: 723, ft: 78, pt: 384, ot: 261, repos: 9394, color: "#4DA2FF", pinned: false },
  { name: "Polkadot", mad: 619, ft: 112, pt: 352, ot: 155, repos: 8850, color: "#E6007A", pinned: false },
  { name: "Stacks", mad: 568, ft: 14, pt: 120, ot: 434, repos: 11462, color: "#5546FF", pinned: false },
  { name: "Aptos", mad: 531, ft: 28, pt: 216, ot: 287, repos: 8725, color: "#2DD8A3", pinned: false },
  { name: "Optimism", mad: 499, ft: 57, pt: 263, ot: 179, repos: 5200, color: "#FF0420", pinned: false },
  { name: "Avalanche", mad: 492, ft: 49, pt: 251, ot: 192, repos: 6800, color: "#E84142", pinned: false },
  { name: "TON", mad: 456, ft: 42, pt: 228, ot: 186, repos: 4200, color: "#0098EA", pinned: false },
];

function EcosystemDetail({ eco }: { eco: typeof ecosystemData[0] }) {
  const ftPct = ((eco.ft / eco.mad) * 100).toFixed(1);
  const ptPct = ((eco.pt / eco.mad) * 100).toFixed(1);
  const otPct = ((eco.ot / eco.mad) * 100).toFixed(1);

  return (
    <div style={{
      padding: "24px 16px",
      background: "#080808",
      borderBottom: "1px solid #1a1a1a",
      animation: "fadeIn 0.25s ease",
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        <div style={{ padding: "14px 16px", border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#22c55e", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>Full-time</div>
          <div style={{ fontSize: "22px", fontWeight: 300, color: "#e0e0e0" }}>{eco.ft}</div>
          <div style={{ fontSize: "11px", color: "#555", fontFamily: "var(--font-mono)" }}>{ftPct}% · 10+ days/mo</div>
        </div>
        <div style={{ padding: "14px 16px", border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#3b82f6", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>Part-time</div>
          <div style={{ fontSize: "22px", fontWeight: 300, color: "#e0e0e0" }}>{eco.pt}</div>
          <div style={{ fontSize: "11px", color: "#555", fontFamily: "var(--font-mono)" }}>{ptPct}% · 2-9 days/mo</div>
        </div>
        <div style={{ padding: "14px 16px", border: "1px solid #1a1a1a" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#666", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>One-time</div>
          <div style={{ fontSize: "22px", fontWeight: 300, color: "#e0e0e0" }}>{eco.ot}</div>
          <div style={{ fontSize: "11px", color: "#555", fontFamily: "var(--font-mono)" }}>{otPct}% · 1 day</div>
        </div>
      </div>
      <div style={{ marginTop: "12px", fontSize: "11px", color: "#444", fontFamily: "var(--font-mono)" }}>
        {eco.repos.toLocaleString()} repos tracked
      </div>
    </div>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const pinned = ecosystemData.filter((e) => e.pinned);
  const ranked = ecosystemData.filter((e) =>
    !e.pinned && e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#e0e0e0", fontFamily: "var(--font-sans)" }}>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "4px", color: "#444", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
            ecoscout
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 300, color: "#e0e0e0", letterSpacing: "-0.5px" }}>
            Crypto developer intelligence
          </h1>
          <p style={{ fontSize: "12px", color: "#555", marginTop: "6px", fontFamily: "var(--font-mono)" }}>
            Sep 10 – Oct 8, 2025 · 28-day MAD window
          </p>
        </div>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", marginBottom: "40px", background: "#1a1a1a", border: "1px solid #1a1a1a" }}>
          {[
            { label: "Developers", value: "96,074", sub: "tracked" },
            { label: "Commits", value: "10.5M", sub: "2024–2025" },
            { label: "Ecosystems", value: "50", sub: "indexed" },
            { label: "Sources", value: "2", sub: "GH Archive + API" },
          ].map((m) => (
            <div key={m.label} style={{ padding: "20px", background: "#0a0a0a" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "#666", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>{m.label}</div>
              <div style={{ fontSize: "28px", fontWeight: 300, color: "#e0e0e0" }}>{m.value}</div>
              <div style={{ fontSize: "11px", color: "#444", marginTop: "4px", fontFamily: "var(--font-mono)" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter + legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "7px 12px",
              fontSize: "12px", color: "#ccc", fontFamily: "var(--font-mono)", width: "180px", outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "20px", fontSize: "10px", fontFamily: "var(--font-mono)", marginLeft: "auto", color: "#666" }}>
            <span style={{ color: "#22c55e" }}>■ full-time</span>
            <span style={{ color: "#3b82f6" }}>■ part-time</span>
            <span style={{ color: "#555" }}>■ one-time</span>
          </div>
        </div>

        {/* Table */}
        <div style={{ border: "1px solid #1a1a1a", overflow: "hidden" }}>
          {/* Header row */}
          <div style={{
            display: "grid", gridTemplateColumns: "32px 130px 70px 1fr 50px 50px 50px",
            gap: "12px", padding: "8px 16px", background: "#080808",
            borderBottom: "1px solid #1a1a1a", fontSize: "10px", textTransform: "uppercase",
            letterSpacing: "1.5px", color: "#444", fontFamily: "var(--font-mono)",
          }}>
            <div style={{ textAlign: "right" }}>#</div>
            <div>Ecosystem</div>
            <div style={{ textAlign: "right" }}>MAD</div>
            <div>Composition</div>
            <div style={{ textAlign: "right", color: "#22c55e" }}>FT</div>
            <div style={{ textAlign: "right", color: "#3b82f6" }}>PT</div>
            <div style={{ textAlign: "right", color: "#555" }}>OT</div>
          </div>

          {/* Pinned rows */}
          {pinned.map((eco) => {
            const ftPct = (eco.ft / eco.mad) * 100;
            const ptPct = (eco.pt / eco.mad) * 100;
            const otPct = (eco.ot / eco.mad) * 100;
            const isSelected = selected === eco.name;

            return (
              <div key={eco.name}>
                <div
                  onClick={() => setSelected(isSelected ? null : eco.name)}
                  style={{
                    display: "grid", gridTemplateColumns: "32px 130px 70px 1fr 50px 50px 50px",
                    gap: "12px", padding: "12px 16px", cursor: "pointer",
                    borderBottom: "2px solid #2a2a2a",
                    background: "#0d0d0d",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#111"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#0d0d0d"; }}
                >
                  <div style={{ fontSize: "11px", color: "#666", fontFamily: "var(--font-mono)", textAlign: "right", paddingTop: "2px" }}>
                    ★
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", background: eco.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#e0e0e0", fontWeight: 500 }}>{eco.name}</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 300, color: "#ddd", textAlign: "right" }}>
                    {eco.mad.toLocaleString()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                    <div style={{ width: `${ftPct}%`, height: "12px", background: "#22c55e", transition: "width 0.5s" }} />
                    <div style={{ width: `${ptPct}%`, height: "12px", background: "#3b82f6", transition: "width 0.5s" }} />
                    <div style={{ width: `${otPct}%`, height: "12px", background: "#2a2a2a", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#22c55e", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.ft}</div>
                  <div style={{ fontSize: "11px", color: "#3b82f6", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.pt}</div>
                  <div style={{ fontSize: "11px", color: "#555", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.ot}</div>
                </div>
                {isSelected && <EcosystemDetail eco={eco} />}
              </div>
            );
          })}

          {/* Ranked rows */}
          {ranked.map((eco, i) => {
            const ftPct = (eco.ft / eco.mad) * 100;
            const ptPct = (eco.pt / eco.mad) * 100;
            const otPct = (eco.ot / eco.mad) * 100;
            const isSelected = selected === eco.name;

            return (
              <div key={eco.name}>
                <div
                  onClick={() => setSelected(isSelected ? null : eco.name)}
                  style={{
                    display: "grid", gridTemplateColumns: "32px 130px 70px 1fr 50px 50px 50px",
                    gap: "12px", padding: "12px 16px", cursor: "pointer",
                    borderBottom: "1px solid #111",
                    background: isSelected ? "#0c0c0c" : "transparent",
                    transition: "background 0.15s",
                    animation: `fadeSlideIn 0.35s ease forwards`,
                    animationDelay: `${i * 30}ms`,
                    opacity: 0,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#0a0a0a"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? "#0c0c0c" : "transparent"; }}
                >
                  <div style={{ fontSize: "11px", color: "#444", fontFamily: "var(--font-mono)", textAlign: "right", paddingTop: "2px" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", background: eco.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#bbb" }}>{eco.name}</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 300, color: "#ddd", textAlign: "right" }}>
                    {eco.mad.toLocaleString()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                    <div style={{ width: `${ftPct}%`, height: "12px", background: "#22c55e", transition: "width 0.5s" }} />
                    <div style={{ width: `${ptPct}%`, height: "12px", background: "#3b82f6", transition: "width 0.5s" }} />
                    <div style={{ width: `${otPct}%`, height: "12px", background: "#2a2a2a", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#22c55e", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.ft}</div>
                  <div style={{ fontSize: "11px", color: "#3b82f6", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.pt}</div>
                  <div style={{ fontSize: "11px", color: "#555", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.ot}</div>
                </div>
                {isSelected && <EcosystemDetail eco={eco} />}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", fontSize: "10px", color: "#333", fontFamily: "var(--font-mono)" }}>
          <span>Electric Capital taxonomy · GitHub Archive · GitHub Events API</span>
          <span>francium77.com</span>
        </div>
      </div>
    </div>
  );
}