"use client";
import { useState } from "react";

const ecosystemData = [
  { name: "Ethereum", mad: 5357, ft: 455, pt: 2658, ot: 2244, repos: 139856, color: "#627EEA" },
  { name: "Solana", mad: 2660, ft: 317, pt: 1385, ot: 958, repos: 83532, color: "#9945FF" },
  { name: "Base", mad: 1155, ft: 101, pt: 594, ot: 460, repos: 14033, color: "#0052FF" },
  { name: "Polygon", mad: 1129, ft: 92, pt: 542, ot: 495, repos: 32219, color: "#8247E5" },
  { name: "Bitcoin", mad: 928, ft: 112, pt: 492, ot: 324, repos: 18084, color: "#F7931A" },
  { name: "Arbitrum", mad: 866, ft: 85, pt: 445, ot: 336, repos: 10258, color: "#28A0F0" },
  { name: "Foundry", mad: 769, ft: 149, pt: 426, ot: 194, repos: 8364, color: "#555" },
  { name: "BNB Chain", mad: 731, ft: 57, pt: 362, ot: 312, repos: 21868, color: "#F3BA2F" },
  { name: "Sui", mad: 723, ft: 78, pt: 384, ot: 261, repos: 9394, color: "#4DA2FF" },
  { name: "Polkadot", mad: 619, ft: 112, pt: 352, ot: 155, repos: 8850, color: "#E6007A" },
  { name: "Stacks", mad: 568, ft: 14, pt: 120, ot: 434, repos: 11462, color: "#5546FF" },
  { name: "Aptos", mad: 531, ft: 28, pt: 216, ot: 287, repos: 8725, color: "#2DD8A3" },
  { name: "Optimism", mad: 499, ft: 57, pt: 263, ot: 179, repos: 5200, color: "#FF0420" },
  { name: "Avalanche", mad: 492, ft: 49, pt: 251, ot: 192, repos: 6800, color: "#E84142" },
  { name: "TON", mad: 456, ft: 42, pt: 228, ot: 186, repos: 4200, color: "#0098EA" },
];

function EcosystemDetail({ eco }: { eco: typeof ecosystemData[0] }) {
  const ftPct = ((eco.ft / eco.mad) * 100).toFixed(1);
  const ptPct = ((eco.pt / eco.mad) * 100).toFixed(1);
  const otPct = ((eco.ot / eco.mad) * 100).toFixed(1);

  return (
    <div className="px-4 py-6 bg-[#080808] border-b border-[#1a1a1a] animate-fadeIn">
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 border border-[#1a1a1a]">
          <div className="text-[10px] uppercase tracking-[2px] text-green-500 mb-1 font-mono">Full-time</div>
          <div className="text-2xl font-light text-gray-200">{eco.ft}</div>
          <div className="text-[11px] text-gray-600 font-mono">{ftPct}% · 10+ days/mo</div>
        </div>
        <div className="p-4 border border-[#1a1a1a]">
          <div className="text-[10px] uppercase tracking-[2px] text-blue-500 mb-1 font-mono">Part-time</div>
          <div className="text-2xl font-light text-gray-200">{eco.pt}</div>
          <div className="text-[11px] text-gray-600 font-mono">{ptPct}% · 2-9 days/mo</div>
        </div>
        <div className="p-4 border border-[#1a1a1a]">
          <div className="text-[10px] uppercase tracking-[2px] text-gray-500 mb-1 font-mono">One-time</div>
          <div className="text-2xl font-light text-gray-200">{eco.ot}</div>
          <div className="text-[11px] text-gray-600 font-mono">{otPct}% · 1 day</div>
        </div>
      </div>
      <div className="mt-3 text-[11px] text-gray-700 font-mono">
        {eco.repos.toLocaleString()} repos tracked
      </div>
    </div>
  );
}

export default function Home() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = ecosystemData.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200">
      <div className="max-w-[960px] mx-auto px-6 py-10">

        <div className="mb-10">
          <div className="text-[10px] uppercase tracking-[4px] text-gray-700 mb-2 font-mono">
            ecoscout
          </div>
          <h1 className="text-3xl font-light text-gray-200 tracking-tight">
            Crypto developer intelligence
          </h1>
          <p className="text-xs text-gray-600 mt-2 font-mono">
            Sep 10 – Oct 8, 2025 · 28-day MAD window
          </p>
        </div>

        <div className="grid grid-cols-4 gap-[1px] mb-10 bg-[#1a1a1a] border border-[#1a1a1a]">
          {[
            { label: "Developers", value: "96,074", sub: "tracked" },
            { label: "Commits", value: "10.5M", sub: "2024–2025" },
            { label: "Ecosystems", value: "50", sub: "indexed" },
            { label: "Sources", value: "2", sub: "GH Archive + API" },
          ].map((m) => (
            <div key={m.label} className="p-5 bg-[#0a0a0a]">
              <div className="text-[11px] uppercase tracking-[2px] text-gray-600 mb-2 font-mono">{m.label}</div>
              <div className="text-[28px] font-light text-gray-200">{m.value}</div>
              <div className="text-[11px] text-gray-700 mt-1 font-mono">{m.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-3">
          <input
            type="text"
            placeholder="Filter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#0a0a0a] border border-[#1a1a1a] px-3 py-2 text-xs text-gray-400 font-mono w-44 outline-none focus:border-[#333] transition-colors"
          />
          <div className="flex gap-5 text-[10px] font-mono ml-auto text-gray-500">
            <span><span className="text-green-500">—</span> full-time</span>
            <span><span className="text-blue-500">—</span> part-time</span>
            <span><span className="text-gray-600">—</span> one-time</span>
          </div>
        </div>

        <div className="border border-[#1a1a1a] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[32px_130px_70px_1fr_50px_50px_50px] gap-3 px-4 py-2 bg-[#080808] border-b border-[#1a1a1a] text-[10px] uppercase tracking-[1.5px] text-gray-700 font-mono">
            <div className="text-right">#</div>
            <div>Ecosystem</div>
            <div className="text-right">MAD</div>
            <div>Composition</div>
            <div className="text-right text-green-600">FT</div>
            <div className="text-right text-blue-600">PT</div>
            <div className="text-right text-gray-600">OT</div>
          </div>

          {filtered.map((eco, i) => {
            const ftPct = (eco.ft / eco.mad) * 100;
            const ptPct = (eco.pt / eco.mad) * 100;
            const otPct = (eco.ot / eco.mad) * 100;
            const isSelected = selected === eco.name;

            return (
              <div key={eco.name}>
                <div
                  onClick={() => setSelected(isSelected ? null : eco.name)}
                  className={`grid grid-cols-[32px_130px_70px_1fr_50px_50px_50px] gap-3 px-4 py-3 cursor-pointer border-b border-[#111] transition-colors hover:bg-[#0a0a0a] ${isSelected ? "bg-[#0c0c0c]" : ""}`}
                  style={{
                    animation: `fadeSlideIn 0.35s ease forwards`,
                    animationDelay: `${i * 30}ms`,
                    opacity: 0,
                  }}
                >
                  <div className="text-[11px] text-gray-700 font-mono text-right pt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 flex-shrink-0" style={{ background: eco.color }} />
                    <span className="text-[13px] text-gray-400">{eco.name}</span>
                  </div>
                  <div className="text-sm font-light text-gray-300 text-right">
                    {eco.mad.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-0 h-full">
                    <div
                      className="h-[12px] bg-green-500/80 transition-all duration-500"
                      style={{ width: `${ftPct}%` }}
                    />
                    <div
                      className="h-[12px] bg-blue-500/70 transition-all duration-500"
                      style={{ width: `${ptPct}%` }}
                    />
                    <div
                      className="h-[12px] bg-[#2a2a2a] transition-all duration-500"
                      style={{ width: `${otPct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-green-500/80 text-right font-mono">{eco.ft}</div>
                  <div className="text-[11px] text-blue-500/70 text-right font-mono">{eco.pt}</div>
                  <div className="text-[11px] text-gray-600 text-right font-mono">{eco.ot}</div>
                </div>
                {isSelected && <EcosystemDetail eco={eco} />}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-5 text-[10px] text-gray-800 font-mono">
          <span>Electric Capital taxonomy · GitHub Archive · GitHub Events API</span>
          <span>francium77.com</span>
        </div>
      </div>
    </div>
  );
}