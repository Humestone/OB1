import "../mission-control/cockpit.css";
import "./design-system.css";
import type { CSSProperties } from "react";
import { AppShell } from "@/components/mission-control/shell/AppShell";
import { Spine, type SpineGroup } from "@/components/mission-control/shell/Spine";
import { SurfaceFrame } from "@/components/mission-control/shell/SurfaceFrame";

export const metadata = {
  title: "Design System | Mission Control",
  description: "Mission Control shared design system — Phase A reference",
};

/** Allow inline CSS custom properties without fighting the type checker. */
function vars(v: Record<string, string>): CSSProperties {
  return v as CSSProperties;
}

const SPINE_GROUPS: SpineGroup[] = [
  {
    items: [
      { label: "Cockpit", icon: "◳" },
      { label: "Approvals", icon: "✓" },
      { label: "Runs", icon: "▷" },
      { label: "Ask Open Brain", icon: "✦" },
      { label: "Evidence", icon: "❏" },
    ],
  },
  {
    label: "Surfaces",
    items: [
      { label: "Company Memory", icon: "◇" },
      { label: "Gates", icon: "⊘" },
      { label: "System health", icon: "♥" },
    ],
  },
  {
    label: "Phase A",
    items: [{ label: "Design System", icon: "❖", active: true }],
  },
];

const CANVAS_SWATCHES = [
  { name: "Canvas", token: "--mc-canvas", value: "var(--mc-canvas)", concept: "App background. Deep blue-black; light comes from off-card, not fills." },
  { name: "Surface 0", token: "--mc-surface-0", value: "var(--mc-surface-0)", concept: "Spine background — the faintest lift off canvas." },
  { name: "Surface 1", token: "--mc-surface-1", value: "var(--mc-surface-1)", concept: "List row base." },
  { name: "Surface 2", token: "--mc-surface-2", value: "var(--mc-surface-2)", concept: "Card base." },
  { name: "Surface 3", token: "--mc-surface-3", value: "var(--mc-surface-3)", concept: "Row hover / chip." },
  { name: "Surface inset", token: "--mc-surface-inset", value: "var(--mc-surface-inset)", concept: "Inputs and dark result wells." },
];

const ACCENT_SWATCHES = [
  { name: "Good", token: "--mc-good", value: "var(--mc-good)", concept: "Healthy / live / in-sync. The only green." },
  { name: "Attention", token: "--mc-attention", value: "var(--mc-attention)", concept: "Needs you — items waiting on a decision." },
  { name: "Blocked", token: "--mc-blocked", value: "var(--mc-blocked)", concept: "Held / blocked by a gate." },
  { name: "Info", token: "--mc-info", value: "var(--mc-info)", concept: "Workers / informational signal." },
  { name: "Neutral", token: "--mc-neutral", value: "var(--mc-neutral)", concept: "Secondary / content queue." },
  { name: "Brand amber", token: "--mc-brand", value: "var(--mc-brand)", concept: "Identity only — washes, active nav, Ask, focus. Never encodes data." },
];

const TONES: { label: string; token: string }[] = [
  { label: "Healthy", token: "--mc-good" },
  { label: "Needs you", token: "--mc-attention" },
  { label: "Blocked", token: "--mc-blocked" },
  { label: "Workers", token: "--mc-info" },
  { label: "Queue", token: "--mc-neutral" },
];

const TYPE_SPECIMENS = [
  { tag: "--mc-fs-kpi 46", cls: "mc-kpi-num", text: "42" },
  { tag: "--mc-fs-hero 27", cls: "mc-hero-greeting", text: "Good evening, James." },
  { tag: "--mc-fs-title 17", cls: "mc-section-head", text: "Approval inbox" },
  { tag: "--mc-fs-row 14.5", cls: "mc-row-title", text: "Deploy the timezone fix" },
  { tag: "--mc-fs-caption 12", cls: "mc-caption", text: "One plain-English line under every instrument label." },
  { tag: "--mc-fs-eyebrow 10.5", cls: "mc-eyebrow", text: "Needs your approval" },
];

const RADII = [
  { token: "--mc-radius-1", label: "9 · nav, mark" },
  { token: "--mc-radius-2", label: "12 · input" },
  { token: "--mc-radius-3", label: "14 · row" },
  { token: "--mc-radius-4", label: "18 · card" },
  { token: "--mc-radius-pill", label: "pill" },
];

const SPACES = ["1", "2", "3", "4", "5", "6", "7", "8"];

function Dial({ pct, accent }: { pct: number; accent: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" style={{ transform: "rotate(-90deg)" }}>
      <circle className="mc-dial-track" cx={36} cy={36} r={r} fill="none" strokeWidth={6} />
      <circle
        className="mc-dial-fill"
        cx={36}
        cy={36}
        r={r}
        fill="none"
        strokeWidth={6}
        stroke={accent}
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ filter: `drop-shadow(0 0 5px ${accent}88)` }}
      />
    </svg>
  );
}

export default function DesignSystemPage() {
  return (
    <AppShell
      spine={
        <Spine
          mark="MC"
          title="Mission Control"
          subtitle="HumeStone · Stone"
          groups={SPINE_GROUPS}
          footer={
            <div className="mc-online">
              <span className="mc-dot" style={vars({ "--mc-tone": "var(--mc-neutral)" })} />
              Preview · design system
            </div>
          }
        />
      }
    >
      <SurfaceFrame
        breadcrumb="Mission Control · Design System"
        status={
          <span className="mc-pill" style={vars({ "--mc-tone": "var(--mc-neutral)" })}>
            <span className="mc-dot" style={vars({ "--mc-tone": "var(--mc-neutral)" })} />
            Phase A · Preview
          </span>
        }
      >
        {/* Hero */}
        <div className="ds-section">
          <div className="mc-eyebrow">Mission Control · Design System</div>
          <h1 className="mc-hero-greeting" style={{ marginTop: 10 }}>
            Phase A — the shared token layer.
          </h1>
          <p className="mc-caption ds-lede">
            One palette, type scale, and set of shell components, promoted out of the cockpit so the
            Company Memory surfaces inherit the same look instead of drifting. Everything below reads
            from <code>tokens.css</code>. Nothing here changes the live cockpit or the memory pages.
          </p>
        </div>

        {/* Canvas & surfaces */}
        <section className="ds-section">
          <div className="mc-eyebrow">Canvas &amp; surfaces</div>
          <div className="ds-swatches">
            {CANVAS_SWATCHES.map((s) => (
              <div className="ds-swatch" key={s.token}>
                <div className="ds-swatch-chip" style={{ background: s.value }} />
                <div className="ds-swatch-meta">
                  <div className="ds-swatch-name">{s.name}</div>
                  <div className="ds-swatch-token">{s.token}</div>
                  <div className="ds-swatch-concept">{s.concept}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Accents — colour = concept */}
        <section className="ds-section">
          <div className="mc-eyebrow">Accents — colour = concept</div>
          <p className="mc-caption ds-lede" style={{ marginBottom: 16 }}>
            Each accent earns one meaning and carries it everywhere. Colour only ever lands on data;
            amber is identity, never a data colour.
          </p>
          <div className="ds-swatches">
            {ACCENT_SWATCHES.map((s) => (
              <div className="ds-swatch" key={s.token}>
                <div className="ds-swatch-chip" style={{ background: s.value }} />
                <div className="ds-swatch-meta">
                  <div className="ds-swatch-name">{s.name}</div>
                  <div className="ds-swatch-token">{s.token}</div>
                  <div className="ds-swatch-concept">{s.concept}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Text steps */}
        <section className="ds-section">
          <div className="mc-eyebrow">Text steps</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { token: "--mc-text", note: "primary" },
              { token: "--mc-text-1", note: "secondary body / chip" },
              { token: "--mc-text-2", note: "online status" },
              { token: "--mc-text-3", note: "nav idle" },
              { token: "--mc-text-4", note: "eyebrow / caption" },
              { token: "--mc-text-5", note: "breadcrumb" },
              { token: "--mc-text-6", note: "nav group label" },
            ].map((t) => (
              <div key={t.token} style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <span style={{ color: `var(${t.token})`, fontSize: 15 }}>
                  The quick brown fox jumps
                </span>
                <span className="ds-swatch-token">{t.token}</span>
                <span className="ds-swatch-concept" style={{ marginTop: 0 }}>{t.note}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Type scale */}
        <section className="ds-section">
          <div className="mc-eyebrow">Type scale</div>
          {TYPE_SPECIMENS.map((t) => (
            <div className="ds-type-row" key={t.tag}>
              <div className="ds-type-tag">{t.tag}</div>
              <div className={t.cls}>{t.text}</div>
            </div>
          ))}
        </section>

        {/* Radius + spacing */}
        <section className="ds-section">
          <div className="mc-eyebrow">Radius &amp; spacing</div>
          <div className="ds-scale" style={{ marginBottom: 28 }}>
            {RADII.map((rad) => (
              <div className="ds-scale-item" key={rad.token}>
                <div className="ds-radius-demo" style={{ borderRadius: `var(${rad.token})` }} />
                {rad.label}
              </div>
            ))}
          </div>
          <div className="ds-scale">
            {SPACES.map((n) => (
              <div className="ds-scale-item" key={n}>
                <div className="ds-space-demo" style={{ width: `var(--mc-space-${n})` }} />
                {n}
              </div>
            ))}
          </div>
        </section>

        {/* Components */}
        <section className="ds-section">
          <div className="mc-eyebrow">Core components</div>

          <div className="mc-grid-2" style={{ alignItems: "start", marginBottom: 20 }}>
            {/* KPI glow card */}
            <div
              className="mc-card mc-card-wash mc-kpi"
              style={vars({ "--mc-accent": "var(--mc-attention)", padding: "20px" })}
            >
              <div className="mc-glow-orb" />
              <div className="mc-eyebrow" style={{ marginBottom: 14 }}>
                Needs your approval
              </div>
              <div
                className="mc-kpi-num"
                style={{ color: "var(--mc-attention)", textShadow: "0 0 38px rgba(255,180,84,0.33)" }}
              >
                2
              </div>
              <div className="mc-caption" style={{ marginTop: 8 }}>
                One big glowing number, one plain caption. The metric is the content.
              </div>
            </div>

            {/* Health dials */}
            <div className="mc-card" style={{ padding: 18 }}>
              <div className="mc-eyebrow" style={{ marginBottom: 14 }}>
                System health
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Dial pct={100} accent="#3ddc97" />
                  <div>
                    <div className="mc-row-title">Company Memory</div>
                    <div className="mc-caption">Live &amp; in sync</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Dial pct={82} accent="#7c8cff" />
                  <div>
                    <div className="mc-row-title">Workers</div>
                    <div className="mc-caption">Nominal</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status pills */}
          <div className="ds-pill-wrap" style={{ marginBottom: 20 }}>
            {TONES.map((t) => (
              <span className="mc-pill" key={t.token} style={vars({ "--mc-tone": `var(${t.token})` })}>
                <span className="mc-dot" style={vars({ "--mc-tone": `var(${t.token})` })} />
                {t.label}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="ds-row-wrap" style={{ marginBottom: 20 }}>
            <div className="mc-row">
              <span className="mc-dot" style={vars({ "--mc-tone": "var(--mc-attention)" })} />
              <div>
                <div className="mc-row-title">Deploy the dashboard timezone fix</div>
                <div className="mc-caption">A small fix so the memory detail page reads correctly.</div>
              </div>
            </div>
            <div className="mc-row">
              <span className="mc-dot" style={vars({ "--mc-tone": "var(--mc-blocked)" })} />
              <div>
                <div className="mc-row-title">Hermes provider retry</div>
                <div className="mc-caption">Held until you approve the runtime change.</div>
              </div>
            </div>
          </div>

          {/* Ask dock */}
          <div className="mc-ask" style={{ padding: 22, maxWidth: 560 }}>
            <div className="mc-eyebrow" style={{ marginBottom: 12 }}>
              Ask Open Brain
            </div>
            <input
              className="mc-ask-input"
              placeholder="What repos did we add in the last 30 days?"
              readOnly
            />
            <div className="ds-chip-wrap">
              <span className="mc-chip">What needs my approval?</span>
              <span className="mc-chip">Latest deploys</span>
              <span className="mc-chip">Open gates</span>
            </div>
          </div>
        </section>

        {/* Shell note */}
        <section className="ds-section">
          <div className="mc-eyebrow">Shell scaffold</div>
          <p className="mc-caption ds-lede">
            This page is rendered inside the Phase A shell: <code>AppShell</code> →{" "}
            <code>Spine</code> (left) + <code>SurfaceFrame</code> (this column). In Phase B the spine
            items gain real routes and the folded Company Memory surface appears under “Surfaces”.
          </p>
        </section>
      </SurfaceFrame>
    </AppShell>
  );
}
