/*
 * AppShell — the Mission Control shell root: spine + surface frame.
 *
 * This is the scaffold that, from Phase B, becomes the app's real shell: one
 * persistent spine driving router-based navigation between surfaces (Cockpit,
 * Approvals, Runs, Ask, Evidence, and the folded "Company Memory" surface).
 *
 * Phase A renders it as a fixed, full-bleed overlay on the `--mc-canvas`
 * background — the same non-destructive pattern the cockpit already uses to sit
 * over the legacy chrome without modifying it.
 */

export type AppShellProps = {
  /** The spine (left nav). Pass a configured <Spine /> here. */
  spine: React.ReactNode;
  /** The surface body — typically a <SurfaceFrame />. */
  children: React.ReactNode;
};

export function AppShell({ spine, children }: AppShellProps) {
  return (
    <div className="mc-root">
      <div className="mc-shell">
        {spine}
        {children}
      </div>
    </div>
  );
}

export default AppShell;
