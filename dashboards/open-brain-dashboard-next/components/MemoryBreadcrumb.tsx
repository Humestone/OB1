"use client";

import { usePathname } from "next/navigation";

/*
 * Phase C: the SurfaceFrame top-bar treatment for the Company Memory surface.
 * The memory page files cannot move (the guard test suites are static
 * source-path checks), so instead of nesting them inside the shell's
 * <SurfaceFrame>, the root layout renders this breadcrumb above every memory
 * page body — same eyebrow typography, hairline rule, and "surface / area"
 * reading as the cockpit's mc-topbar.
 */

const SURFACES: Array<[string, string]> = [
  ["/thoughts", "Thoughts"],
  ["/search", "Search"],
  ["/kanban", "Workflow"],
  ["/agent-memory/traces", "Agent Memory · Traces"],
  ["/agent-memory", "Agent Memory"],
  ["/audit", "Audit"],
  ["/duplicates", "Duplicates"],
  ["/ingest", "Add to Brain"],
  ["/workbench", "Workbench"],
  ["/promotion-review", "Promotion Review"],
];

function surfaceLabel(pathname: string): string | null {
  if (pathname === "/") return "Dashboard";
  for (const [prefix, label] of SURFACES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return label;
  }
  return null;
}

export function MemoryBreadcrumb() {
  const pathname = usePathname();

  if (
    pathname === "/login" ||
    pathname.startsWith("/mission-control") ||
    pathname.startsWith("/design-system")
  ) {
    return null;
  }

  const label = surfaceLabel(pathname);
  if (!label) return null;

  return (
    <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-5 md:px-8">
      <ol className="flex items-center gap-2 border-b border-border-subtle pb-3 text-[11px] font-medium uppercase tracking-[0.14em]">
        <li className="text-text-secondary">Company Memory</li>
        <li className="text-text-muted" aria-hidden="true">
          /
        </li>
        <li className="text-text-primary" aria-current="page">
          {label}
        </li>
      </ol>
    </nav>
  );
}
