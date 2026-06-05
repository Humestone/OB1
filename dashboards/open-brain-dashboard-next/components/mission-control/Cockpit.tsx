"use client";

/*
 * Mission Control — redesigned cockpit (Phase A).
 * ClaudeOS-inspired principles (big glowing numbers, micro-labels, off-card
 * light, whitespace, plain-language captions) in HumeStone's own palette.
 * Static sample data; no live data, no actions. Phases B–D wire it up.
 */

import { useState } from "react";
import {
  HERO,
  KPIS,
  APPROVALS,
  RUNS,
  GATES,
  HEALTH,
  NAV,
  ASK_SUGGESTIONS,
  ASK_DEMO,
  TONE_HEX,
  type Tone,
} from "./sample-data";

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className="mc-pill" style={{ ["--mc-tone" as string]: TONE_HEX[tone] }}>
      <span className="mc-dot" />
      {children}
    </span>
  );
}

function Dial({ pct, accent }: { pct: number; accent: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
      <circle className="mc-dial-track" cx="36" cy="36" r={r} fill="none" strokeWidth="6" />
      <circle
        className="mc-dial-fill"
        cx="36"
        cy="36"
        r={r}
        fill="none"
        strokeWidth="6"
        stroke={accent}
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ filter: `drop-shadow(0 0 5px ${accent}88)` }}
      />
    </svg>
  );
}

export default function Cockpit() {
  const [range, setRange] = useState<"Today" | "7 days" | "28 days">("Today");
  const [active, setActive] = useState("Cockpit");
  const [asked, setAsked] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <div className="mc-root">
      <div className="mc-shell">
        {/* ---------------- sidebar ---------------- */}
        <nav className="mc-nav">
          <div className="mc-brand">
            <div className="mc-brand-mark">HS</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: "-0.01em" }}>
                Mission Control
              </div>
              <div style={{ fontSize: 11, color: "rgba(242,239,229,0.42)" }}>HumeStone · Stone</div>
            </div>
          </div>

          {NAV.primary.map((n) => (
            <button
              key={n.label}
              className="mc-nav-item"
              data-active={active === n.label}
              onClick={() => setActive(n.label)}
            >
              <span style={{ width: 16, textAlign: "center", opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div className="mc-nav-group">Surfaces</div>
          {NAV.surfaces.map((n) => (
            <button
              key={n.label}
              className="mc-nav-item"
              data-active={active === n.label}
              onClick={() => setActive(n.label)}
            >
              <span style={{ width: 16, textAlign: "center", opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          <div style={{ marginTop: "auto", paddingTop: 16 }}>
            <div className="mc-caption" style={{ fontSize: 11 }}>
              Preview · sample data
            </div>
          </div>
        </nav>

        {/* ---------------- main ---------------- */}
        <div className="mc-main">
          <div className="mc-topbar">
            <div className="mc-breadcrumb">Stone · local cockpit</div>
            <div className="mc-online">
              <span className="mc-dot" style={{ ["--mc-tone" as string]: "#87d18a" }} />
              Stone online
            </div>
          </div>

          {/* hero */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 26,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div className="mc-hero-greeting">
                  Good evening, {HERO.name}. <span className="dim">{HERO.greeting}</span>
                </div>
                <Pill tone={HERO.status.tone}>{HERO.status.label}</Pill>
              </div>
              <div className="mc-caption" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span>Working on: {HERO.workingOn}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>Updated {HERO.updated}</span>
              </div>
            </div>

            <div
              style={{
                display: "inline-flex",
                gap: 2,
                padding: 3,
                borderRadius: 11,
                border: "1px solid rgba(236,229,209,0.12)",
                background: "rgba(0,0,0,0.18)",
              }}
            >
              {(["Today", "7 days", "28 days"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  style={{
                    padding: "6px 13px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    border: 0,
                    cursor: "pointer",
                    background: range === r ? "#f2efe5" : "transparent",
                    color: range === r ? "#1a1d1b" : "rgba(242,239,229,0.6)",
                    fontWeight: range === r ? 600 : 400,
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* KPI row */}
          <div className="mc-grid-3" style={{ marginBottom: 28 }}>
            {KPIS.map((k) => (
              <div
                key={k.eyebrow}
                className="mc-card mc-card-wash mc-kpi"
                style={{ ["--mc-accent" as string]: k.accent, padding: 20 }}
              >
                <div className="mc-glow-orb" />
                <div style={{ position: "relative" }}>
                  <div className="mc-eyebrow" style={{ marginBottom: 14 }}>
                    {k.eyebrow}
                  </div>
                  <div
                    className="mc-kpi-num"
                    style={{ color: k.accent, textShadow: `0 0 38px ${k.accent}55`, marginBottom: 12 }}
                  >
                    {k.value}
                  </div>
                  <div className="mc-caption">{k.caption}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Ask Open Brain */}
          <div className="mc-ask" style={{ padding: 22, marginBottom: 28 }}>
            <div className="mc-eyebrow" style={{ marginBottom: 12 }}>
              <span style={{ color: "#ff8a4c" }}>✦</span> Ask Open Brain
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input
                className="mc-ask-input"
                placeholder="Ask anything about HumeStone in plain English…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setAsked(true)}
              />
              <button
                onClick={() => setAsked(true)}
                style={{
                  flexShrink: 0,
                  padding: "0 18px",
                  borderRadius: 12,
                  border: 0,
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 13.5,
                  color: "#2a1407",
                  background: "linear-gradient(160deg, #ffc371, #ff8a4c 60%, #d97757)",
                }}
              >
                Ask
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {ASK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="mc-chip"
                  onClick={() => {
                    setQuery(s);
                    setAsked(true);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {asked && (
              <div
                style={{
                  marginTop: 18,
                  padding: 18,
                  borderRadius: 14,
                  background: "rgba(0,0,0,0.22)",
                  border: "1px solid rgba(236,229,209,0.1)",
                }}
              >
                <div className="mc-eyebrow" style={{ marginBottom: 8 }}>
                  {query || ASK_DEMO.question}
                </div>
                <div style={{ fontSize: 14.5, lineHeight: 1.6, color: "rgba(242,239,229,0.92)" }}>
                  {ASK_DEMO.answer}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  {ASK_DEMO.sources.map((s) => (
                    <span
                      key={s}
                      style={{
                        fontSize: 11,
                        padding: "4px 9px",
                        borderRadius: 7,
                        background: "rgba(167,139,250,0.12)",
                        border: "1px solid rgba(167,139,250,0.26)",
                        color: "rgba(238,241,247,0.8)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mc-caption" style={{ marginTop: 12, fontStyle: "italic", fontSize: 11.5 }}>
                  {ASK_DEMO.note}
                </div>
              </div>
            )}
          </div>

          {/* two-column body */}
          <div className="mc-grid-2">
            {/* left: approvals + runs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <section>
                <div style={{ marginBottom: 14 }}>
                  <div className="mc-eyebrow" style={{ marginBottom: 6 }}>
                    Approval inbox
                  </div>
                  <div className="mc-section-head">Waiting on you</div>
                  <div className="mc-caption">Stone has these ready — it just needs your yes or no.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {APPROVALS.map((a) => (
                    <div key={a.title} className="mc-row" style={{ flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div className="mc-row-title">{a.title}</div>
                        <Pill tone={a.tone}>{a.why}</Pill>
                      </div>
                      <div className="mc-caption">{a.plain}</div>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div style={{ marginBottom: 14 }}>
                  <div className="mc-eyebrow" style={{ marginBottom: 6 }}>
                    Current runs
                  </div>
                  <div className="mc-section-head">What's happening now</div>
                  <div className="mc-caption">Live work by Stone and its workers.</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {RUNS.map((r) => {
                    const tone: Tone = r.state === "done" ? "good" : r.state === "building" ? "info" : "neutral";
                    const label = r.state === "done" ? "Done" : r.state === "building" ? "Building" : "Healthy";
                    return (
                      <div key={r.title} className="mc-row" style={{ alignItems: "flex-start" }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                          <div className="mc-row-title">{r.title}</div>
                          <div className="mc-caption">{r.plain}</div>
                        </div>
                        <Pill tone={tone}>{label}</Pill>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* right: gates + health */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <section>
                <div style={{ marginBottom: 14 }}>
                  <div className="mc-eyebrow" style={{ marginBottom: 6 }}>
                    Gate ledger
                  </div>
                  <div className="mc-section-head">Held for safety</div>
                  <div className="mc-caption">Things Stone will never do without asking you first.</div>
                </div>
                <div className="mc-card" style={{ padding: 6 }}>
                  {GATES.map((g, i) => (
                    <div
                      key={g.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "13px 14px",
                        borderTop: i === 0 ? "none" : "1px solid rgba(236,229,209,0.07)",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{g.label}</div>
                        <div className="mc-caption" style={{ fontSize: 11.5 }}>{g.plain}</div>
                      </div>
                      <Pill tone={g.tone}>{g.state}</Pill>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <div style={{ marginBottom: 14 }}>
                  <div className="mc-eyebrow" style={{ marginBottom: 6 }}>
                    System health
                  </div>
                  <div className="mc-section-head">All systems</div>
                  <div className="mc-caption">The brain, the workers, and the content pipeline.</div>
                </div>
                <div className="mc-card" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
                  {HEALTH.map((h) => (
                    <div key={h.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                        <Dial pct={h.pct} accent={h.accent} />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            display: "grid",
                            placeItems: "center",
                            fontSize: 14,
                            fontWeight: 600,
                            color: h.accent,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {h.pct}%
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{h.label}</div>
                        <div className="mc-caption" style={{ fontSize: 12 }}>{h.caption}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
