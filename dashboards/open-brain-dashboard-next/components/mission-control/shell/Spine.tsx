/*
 * Spine — the persistent left navigation of the Mission Control shell.
 *
 * Phase A: presentational and token-driven. It renders the same `.mc-nav`
 * chrome the cockpit uses, but as a reusable component that accepts a real
 * item list (with optional `href`). Phase B swaps the items' `href` onto
 * Next <Link> + usePathname to make the spine route for real; nothing here
 * needs to change shape for that.
 */

export type SpineItem = {
  label: string;
  icon: string;
  /** Destination route. Phase A items may omit this (scaffold only). */
  href?: string;
  active?: boolean;
};

export type SpineGroup = {
  /** Optional uppercase group label, e.g. "Surfaces". */
  label?: string;
  items: SpineItem[];
};

export type SpineProps = {
  /** Short mark shown in the brand badge, e.g. "MC". */
  mark?: string;
  title?: string;
  subtitle?: string;
  groups: SpineGroup[];
  /** Optional footer node (e.g. a live/preview status dot). */
  footer?: React.ReactNode;
};

function SpineLink({ item }: { item: SpineItem }) {
  const content = (
    <>
      <span aria-hidden="true" style={{ width: 16, opacity: 0.8 }}>
        {item.icon}
      </span>
      {item.label}
    </>
  );

  // A real anchor when we have a destination (forward-compatible with Phase B
  // routing); an inert button for scaffold-only items.
  if (item.href) {
    return (
      <a
        className="mc-nav-item"
        href={item.href}
        data-active={item.active ? "true" : undefined}
        aria-current={item.active ? "page" : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className="mc-nav-item"
      data-active={item.active ? "true" : undefined}
      aria-current={item.active ? "page" : undefined}
    >
      {content}
    </button>
  );
}

export function Spine({
  mark = "MC",
  title = "Mission Control",
  subtitle = "HumeStone · Stone",
  groups,
  footer,
}: SpineProps) {
  return (
    <nav className="mc-nav" aria-label="Mission Control">
      <div className="mc-brand">
        <div className="mc-brand-mark" aria-hidden="true">
          {mark}
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-0.01em" }}>
            {title}
          </div>
          <div style={{ fontSize: 11, color: "var(--mc-text-5)" }}>{subtitle}</div>
        </div>
      </div>

      {groups.map((group, gi) => (
        <div key={group.label ?? `group-${gi}`}>
          {group.label ? <div className="mc-nav-group">{group.label}</div> : null}
          {group.items.map((item) => (
            <SpineLink key={item.label} item={item} />
          ))}
        </div>
      ))}

      {footer ? <div style={{ marginTop: "auto", paddingTop: 16 }}>{footer}</div> : null}
    </nav>
  );
}

export default Spine;
