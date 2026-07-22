/*
 * CockpitStatus — the honest no-live-data surface for Mission Control.
 *
 * Rendered by the page whenever the cockpit cannot show real status: either
 * Company Memory could not be reached (fetch/API failure) or it is reachable
 * but holds no STATUS RECORDs yet (empty). Keeps the shell (spine + topbar)
 * so the surface still reads as Mission Control, but renders NO section
 * content: a fake cockpit that looks real is worse than an honest blank one.
 * The sample cockpit is design-preview only, behind /mission-control?preview=1.
 */

import { Spine, type SpineGroup } from "./shell/Spine";
import { NAV, TONE_HEX, type Tone } from "./sample-data";

const SPINE_GROUPS: SpineGroup[] = [
  { items: NAV.primary },
  { label: "Surfaces", items: NAV.surfaces },
];

export type CockpitStatusProps = {
  /** Colour family from the shared tone palette (dot, pill, card wash). */
  tone: Tone;
  /** Short status pill text, e.g. "Company Memory unreachable". */
  pill: string;
  /** Plain-English headline, e.g. "Live status unavailable". */
  headline: string;
  /** One- or two-sentence explanation of what happened and what is true. */
  plain: string;
  /** Secondary detail line, e.g. when the fetch was attempted. */
  detail?: string;
  /** Spine footer status, e.g. "Offline · Company Memory unreachable". */
  footerLabel: string;
  /** Topbar status — replaces the live cockpit's "Stone online" claim. */
  topbarLabel: string;
};

export default function CockpitStatus({
  tone,
  pill,
  headline,
  plain,
  detail,
  footerLabel,
  topbarLabel,
}: CockpitStatusProps) {
  const toneHex = TONE_HEX[tone];

  return (
    <div className="mc-root">
      <div className="mc-shell">
        <Spine
          mark="HS"
          title="Mission Control"
          subtitle="HumeStone · Stone"
          groups={SPINE_GROUPS}
          footer={
            <div
              className="mc-caption"
              style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 7 }}
            >
              <span className="mc-dot" style={{ ["--mc-tone" as string]: toneHex }} />
              {footerLabel}
            </div>
          }
        />

        <div className="mc-main">
          <div className="mc-topbar">
            <div className="mc-breadcrumb">Stone · local cockpit</div>
            <div className="mc-online">
              <span className="mc-dot" style={{ ["--mc-tone" as string]: toneHex }} />
              {topbarLabel}
            </div>
          </div>

          <section role="status" aria-label={headline} style={{ maxWidth: 680 }}>
            <div
              className="mc-card mc-card-wash"
              style={{ ["--mc-accent" as string]: toneHex, padding: 26 }}
            >
              <div className="mc-glow-orb" />
              <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 14 }}>
                <span
                  className="mc-pill"
                  style={{ ["--mc-tone" as string]: toneHex, alignSelf: "flex-start" }}
                >
                  <span className="mc-dot" />
                  {pill}
                </span>
                <div className="mc-hero-greeting" style={{ fontSize: 22 }}>
                  {headline}
                </div>
                <div className="mc-caption" style={{ fontSize: 13.5, maxWidth: 560 }}>
                  {plain}
                </div>
                {detail && (
                  <div className="mc-caption" style={{ fontSize: 11.5 }}>
                    {detail}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
