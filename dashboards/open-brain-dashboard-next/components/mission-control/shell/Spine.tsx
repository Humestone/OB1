"use client";

/*
 * Spine — the persistent left navigation of the Mission Control shell.
 *
 * Phase B: routes for real. Items with an `href` render a Next <Link>; the
 * active item is derived from the current path via usePathname (an explicit
 * `active` flag still wins when provided, e.g. the /design-system reference).
 * In-page section jumps (hrefs that carry a `#`) and hrefless scaffold items
 * never claim the active state — only a surface route does.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

export type SpineItem = {
  label: string;
  icon: string;
  /** Destination route. Hrefless items render as inert scaffold buttons. */
  href?: string;
  /** Explicit active override. When omitted, active is derived from the path. */
  active?: boolean;
};

/** Resolve whether an item is the active surface for the current path. */
function isItemActive(item: SpineItem, pathname: string): boolean {
  if (item.active !== undefined) return item.active; // explicit override wins
  if (!item.href || item.href.includes("#")) return false; // scaffold or in-page jump
  const base = item.href;
  return base === "/"
    ? pathname === "/"
    : pathname === base || pathname.startsWith(`${base}/`);
}

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

function SpineLink({ item, active }: { item: SpineItem; active: boolean }) {
  const content = (
    <>
      <span aria-hidden="true" style={{ width: 16, textAlign: "center", opacity: 0.8 }}>
        {item.icon}
      </span>
      {item.label}
    </>
  );

  // A real Next <Link> when we have a destination (client-side routing + hash
  // jumps); an inert button for scaffold-only items.
  if (item.href) {
    return (
      <Link
        className="mc-nav-item"
        href={item.href}
        data-active={active ? "true" : undefined}
        aria-current={active ? "page" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="mc-nav-item"
      data-active={active ? "true" : undefined}
      aria-current={active ? "page" : undefined}
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
  const pathname = usePathname();

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
            <SpineLink key={item.label} item={item} active={isItemActive(item, pathname)} />
          ))}
        </div>
      ))}

      {footer ? <div style={{ marginTop: "auto", paddingTop: 16 }}>{footer}</div> : null}
    </nav>
  );
}

export default Spine;
