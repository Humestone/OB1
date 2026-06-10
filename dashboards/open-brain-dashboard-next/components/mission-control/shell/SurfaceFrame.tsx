/*
 * SurfaceFrame — the right-hand surface container of the Mission Control shell.
 *
 * Every destination behind the spine (Cockpit today; the folded Company Memory
 * pages from Phase B) renders inside this frame: a top bar with a breadcrumb on
 * the left and a status indicator on the right, then the surface body within a
 * capped-width, generously-padded column.
 *
 * Phase A: presentational and token-driven, mirroring the cockpit's `.mc-main`
 * chrome so memory surfaces inherit identical framing in Phase C.
 */

export type SurfaceFrameProps = {
  /** Left-aligned breadcrumb, e.g. "Mission Control · Company Memory". */
  breadcrumb?: string;
  /** Right-aligned status node (e.g. a live/preview indicator). */
  status?: React.ReactNode;
  children: React.ReactNode;
};

export function SurfaceFrame({ breadcrumb, status, children }: SurfaceFrameProps) {
  return (
    <main className="mc-main">
      {breadcrumb || status ? (
        <div className="mc-topbar">
          <div className="mc-breadcrumb">{breadcrumb}</div>
          {status ? <div>{status}</div> : null}
        </div>
      ) : null}
      {children}
    </main>
  );
}

export default SurfaceFrame;
