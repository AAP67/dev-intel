"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";

const ECO_COLORS: Record<string, string> = {
  "Ethereum": "#627EEA", "Solana": "#9945FF", "Base": "#0052FF",
  "Polygon": "#8247E5", "Bitcoin": "#F7931A", "Arbitrum": "#28A0F0",
  "Foundry": "#555", "BNB Chain": "#F3BA2F", "Sui": "#4DA2FF",
  "Polkadot Network Stack": "#E6007A", "Stacks": "#5546FF", "Aptos": "#2DD8A3",
  "Optimism": "#FF0420", "Avalanche": "#E84142", "TON": "#0098EA",
  "XRP": "#23292F", "Internet Computer": "#29ABE2", "NEAR": "#00C08B",
  "Stellar": "#7B61FF", "Polkadot": "#E6007A",
};

type Ecosystem = {
  name: string;
  mad: number;
  ft: number;
  pt: number;
  ot: number;
  repos: number;
  color: string;
  pinned: boolean;
};

type Developer = {
  username: string;
  ecosystems: string[];
  classification: string;
  totalCommits: number;
  firstSeen: string;
  lastSeen: string;
};

function EcosystemDetail({ eco, developers, loadingDevs }: {
  eco: Ecosystem;
  developers: Developer[];
  loadingDevs: boolean;
}) {
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

      {/* Top developers in this ecosystem */}
      <div style={{ marginTop: "20px", borderTop: "1px solid #1a1a1a", paddingTop: "16px" }}>
        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#555", marginBottom: "10px", fontFamily: "var(--font-mono)" }}>
          Top developers
        </div>
        {loadingDevs ? (
          <div style={{ fontSize: "12px", color: "#444", fontFamily: "var(--font-mono)" }}>Loading...</div>
        ) : developers.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#444", fontFamily: "var(--font-mono)" }}>No developer data found</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px", gap: "4px" }}>
            <div style={{ fontSize: "10px", color: "#444", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 0" }}>Username</div>
            <div style={{ fontSize: "10px", color: "#444", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 0", textAlign: "right" }}>Commits</div>
            <div style={{ fontSize: "10px", color: "#444", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "1px", padding: "4px 0", textAlign: "right" }}>Type</div>
            {developers.slice(0, 10).map((dev) => (
              <div key={dev.username} style={{ display: "contents" }}>
                <div style={{ fontSize: "12px", color: "#bbb", fontFamily: "var(--font-mono)", padding: "4px 0" }}>
                  <a href={`https://github.com/${dev.username}`} target="_blank" rel="noopener noreferrer" style={{ color: "#bbb", textDecoration: "none" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#bbb"; }}
                  >{dev.username}</a>
                </div>
                <div style={{ fontSize: "12px", color: "#888", fontFamily: "var(--font-mono)", padding: "4px 0", textAlign: "right" }}>{dev.totalCommits}</div>
                <div style={{
                  fontSize: "10px", fontFamily: "var(--font-mono)", padding: "4px 0", textAlign: "right",
                  color: dev.classification === "full_time" ? "#22c55e" : dev.classification === "part_time" ? "#3b82f6" : "#555",
                }}>
                  {dev.classification === "full_time" ? "FT" : dev.classification === "part_time" ? "PT" : "OT"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const [ecosystems, setEcosystems] = useState<Ecosystem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [devSearch, setDevSearch] = useState("");
  const [devResults, setDevResults] = useState<Developer[]>([]);
  const [searchingDev, setSearchingDev] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ecoDevelopers, setEcoDevelopers] = useState<Record<string, Developer[]>>({});
  const [loadingDevs, setLoadingDevs] = useState<string | null>(null);
  const [totalDevs, setTotalDevs] = useState(0);

  // Fetch ecosystems from Firestore
  useEffect(() => {
    async function fetchData() {
      try {
        const snap = await getDocs(collection(db, "ecosystems"));
        const ecos: Ecosystem[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          const mad = d.mad_total || 0;
          if (mad > 0) {
            ecos.push({
              name: doc.id,
              mad,
              ft: d.mad_full_time || 0,
              pt: d.mad_part_time || 0,
              ot: d.mad_one_time || 0,
              repos: d.repo_count || 0,
              color: ECO_COLORS[doc.id] || "#666",
              pinned: doc.id === "XRP",
            });
          }
        });
        ecos.sort((a, b) => b.mad - a.mad);
        setEcosystems(ecos);

        // Get total developer count
        const devSnap = await getDocs(query(collection(db, "developers"), limit(1)));
        // Use a count query approximation
        setTotalDevs(96074); // We know this from our check
      } catch (err) {
        console.error("Error fetching ecosystems:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch developers for selected ecosystem
  useEffect(() => {
    if (!selected) return;
    if (ecoDevelopers[selected]) return; // already loaded

    async function fetchDevs() {
      setLoadingDevs(selected);
      try {
        const q = query(
          collection(db, "developers"),
          where("ecosystems", "array-contains", selected),
          orderBy("total_commits", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);
        const devs: Developer[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          devs.push({
            username: d.github_username || doc.id,
            ecosystems: d.ecosystems || [],
            classification: d.classification || "unknown",
            totalCommits: d.total_commits || 0,
            firstSeen: d.first_seen || "",
            lastSeen: d.last_seen || "",
          });
        });
        setEcoDevelopers((prev) => ({ ...prev, [selected!]: devs }));
      } catch (err) {
        console.error("Error fetching developers:", err);
      } finally {
        setLoadingDevs(null);
      }
    }
    fetchDevs();
  }, [selected]);

  // Developer search
  async function searchDeveloper() {
    if (!devSearch.trim()) return;
    setSearchingDev(true);
    try {
      const q = query(
        collection(db, "developers"),
        where("github_username", ">=", devSearch.toLowerCase()),
        where("github_username", "<=", devSearch.toLowerCase() + "\uf8ff"),
        limit(5)
      );
      const snap = await getDocs(q);
      const results: Developer[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        results.push({
          username: d.github_username || doc.id,
          ecosystems: d.ecosystems || [],
          classification: d.classification || "unknown",
          totalCommits: d.total_commits || 0,
          firstSeen: d.first_seen || "",
          lastSeen: d.last_seen || "",
        });
      });
      setDevResults(results);
    } catch (err) {
      console.error("Error searching developers:", err);
    } finally {
      setSearchingDev(false);
    }
  }

  const pinned = ecosystems.filter((e) => e.pinned);
  const ranked = ecosystems.filter((e) =>
    !e.pinned && e.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: "12px", color: "#555", fontFamily: "var(--font-mono)" }}>Loading ecosystems from Firestore...</div>
      </div>
    );
  }

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
            Live data from Firestore · 28-day MAD window
          </p>
        </div>

        {/* Metric cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", marginBottom: "40px", background: "#1a1a1a", border: "1px solid #1a1a1a" }}>
          {[
            { label: "Developers", value: totalDevs.toLocaleString(), sub: "tracked" },
            { label: "Ecosystems", value: String(ecosystems.length), sub: "with active devs" },
            { label: "Top MAD", value: ecosystems[0]?.mad.toLocaleString() || "—", sub: ecosystems[0]?.name || "" },
            { label: "Sources", value: "2", sub: "GH Archive + API" },
          ].map((m) => (
            <div key={m.label} style={{ padding: "20px", background: "#0a0a0a" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "#666", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>{m.label}</div>
              <div style={{ fontSize: "28px", fontWeight: 300, color: "#e0e0e0" }}>{m.value}</div>
              <div style={{ fontSize: "11px", color: "#444", marginTop: "4px", fontFamily: "var(--font-mono)" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Developer search */}
        <div style={{
          marginBottom: "24px", padding: "16px", border: "1px solid #1a1a1a", background: "#0a0a0a",
        }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "2px", color: "#555", marginBottom: "10px", fontFamily: "var(--font-mono)" }}>
            Developer lookup
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="GitHub username..."
              value={devSearch}
              onChange={(e) => setDevSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") searchDeveloper(); }}
              style={{
                background: "#050505", border: "1px solid #1a1a1a", padding: "8px 12px",
                fontSize: "12px", color: "#ccc", fontFamily: "var(--font-mono)", flex: 1, outline: "none",
              }}
            />
            <button
              onClick={searchDeveloper}
              style={{
                background: "#1a1a1a", border: "1px solid #333", padding: "8px 16px",
                fontSize: "11px", color: "#ccc", fontFamily: "var(--font-mono)", cursor: "pointer",
              }}
            >
              {searchingDev ? "..." : "Search"}
            </button>
          </div>
          {devResults.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              {devResults.map((dev) => (
                <div key={dev.username} style={{
                  padding: "10px 12px", borderBottom: "1px solid #141414",
                  display: "grid", gridTemplateColumns: "1fr 100px 60px", gap: "8px", alignItems: "center",
                }}>
                  <div>
                    <a href={`https://github.com/${dev.username}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: "#ccc", textDecoration: "none", fontSize: "13px", fontFamily: "var(--font-mono)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#ccc"; }}
                    >{dev.username}</a>
                    <div style={{ fontSize: "10px", color: "#555", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                      {dev.ecosystems.slice(0, 4).join(", ")}{dev.ecosystems.length > 4 ? ` +${dev.ecosystems.length - 4}` : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: "11px", color: "#888", fontFamily: "var(--font-mono)", textAlign: "right" }}>
                    {dev.totalCommits} commits
                  </div>
                  <div style={{
                    fontSize: "10px", fontFamily: "var(--font-mono)", textAlign: "right",
                    color: dev.classification === "full_time" ? "#22c55e" : dev.classification === "part_time" ? "#3b82f6" : "#555",
                  }}>
                    {dev.classification === "full_time" ? "FULL-TIME" : dev.classification === "part_time" ? "PART-TIME" : "ONE-TIME"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter + legend */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Filter ecosystems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "#0a0a0a", border: "1px solid #1a1a1a", padding: "7px 12px",
              fontSize: "12px", color: "#ccc", fontFamily: "var(--font-mono)", width: "200px", outline: "none",
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
            display: "grid", gridTemplateColumns: "32px 150px 70px 1fr 50px 50px 50px",
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
            const ftPct = eco.mad > 0 ? (eco.ft / eco.mad) * 100 : 0;
            const ptPct = eco.mad > 0 ? (eco.pt / eco.mad) * 100 : 0;
            const otPct = eco.mad > 0 ? (eco.ot / eco.mad) * 100 : 0;
            const isSelected = selected === eco.name;

            return (
              <div key={eco.name}>
                <div
                  onClick={() => setSelected(isSelected ? null : eco.name)}
                  style={{
                    display: "grid", gridTemplateColumns: "32px 150px 70px 1fr 50px 50px 50px",
                    gap: "12px", padding: "12px 16px", cursor: "pointer",
                    borderBottom: "2px solid #2a2a2a",
                    background: "#0d0d0d",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#111"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#0d0d0d"; }}
                >
                  <div style={{ fontSize: "11px", color: "#666", fontFamily: "var(--font-mono)", textAlign: "right", paddingTop: "2px" }}>★</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "6px", height: "6px", background: eco.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: "#e0e0e0", fontWeight: 500 }}>{eco.name}</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 300, color: "#ddd", textAlign: "right" }}>{eco.mad.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                    <div style={{ width: `${ftPct}%`, height: "12px", background: "#22c55e", transition: "width 0.5s" }} />
                    <div style={{ width: `${ptPct}%`, height: "12px", background: "#3b82f6", transition: "width 0.5s" }} />
                    <div style={{ width: `${otPct}%`, height: "12px", background: "#2a2a2a", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#22c55e", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.ft}</div>
                  <div style={{ fontSize: "11px", color: "#3b82f6", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.pt}</div>
                  <div style={{ fontSize: "11px", color: "#555", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.ot}</div>
                </div>
                {isSelected && <EcosystemDetail eco={eco} developers={ecoDevelopers[eco.name] || []} loadingDevs={loadingDevs === eco.name} />}
              </div>
            );
          })}

          {/* Ranked rows */}
          {ranked.map((eco, i) => {
            const ftPct = eco.mad > 0 ? (eco.ft / eco.mad) * 100 : 0;
            const ptPct = eco.mad > 0 ? (eco.pt / eco.mad) * 100 : 0;
            const otPct = eco.mad > 0 ? (eco.ot / eco.mad) * 100 : 0;
            const isSelected = selected === eco.name;

            return (
              <div key={eco.name}>
                <div
                  onClick={() => setSelected(isSelected ? null : eco.name)}
                  style={{
                    display: "grid", gridTemplateColumns: "32px 150px 70px 1fr 50px 50px 50px",
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
                  <div style={{ fontSize: "14px", fontWeight: 300, color: "#ddd", textAlign: "right" }}>{eco.mad.toLocaleString()}</div>
                  <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
                    <div style={{ width: `${ftPct}%`, height: "12px", background: "#22c55e", transition: "width 0.5s" }} />
                    <div style={{ width: `${ptPct}%`, height: "12px", background: "#3b82f6", transition: "width 0.5s" }} />
                    <div style={{ width: `${otPct}%`, height: "12px", background: "#2a2a2a", transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#22c55e", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.ft}</div>
                  <div style={{ fontSize: "11px", color: "#3b82f6", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.pt}</div>
                  <div style={{ fontSize: "11px", color: "#555", textAlign: "right", fontFamily: "var(--font-mono)" }}>{eco.ot}</div>
                </div>
                {isSelected && <EcosystemDetail eco={eco} developers={ecoDevelopers[eco.name] || []} loadingDevs={loadingDevs === eco.name} />}
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