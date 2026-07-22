import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function source(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("Mission Control page validates session before preview or live reads", () => {
  const page = source("app/mission-control/page.tsx");
  const auth = page.indexOf("await requireSessionOrRedirect()");
  const preview = page.indexOf('params.preview === "1"');
  const liveRead = page.indexOf("await getCockpitLive(apiKey)");
  assert.ok(auth >= 0, "page must validate a real session");
  assert.ok(auth < preview, "preview must remain authenticated");
  assert.ok(auth < liveRead, "live data must remain authenticated");
});

test("request proxy validates sealed sessions instead of trusting cookie presence", () => {
  const proxy = source("proxy.ts");
  assert.match(proxy, /getIronSession<SessionData>/);
  assert.match(proxy, /if \(!session\.loggedIn\)/);
  assert.match(proxy, /catch \{\s*return NextResponse\.redirect/s);
  assert.doesNotMatch(proxy, /cookies\.get\("open_brain_session"\)/);
});

test("Ask rejects unauthenticated requests before parsing or searching", () => {
  const route = source("app/api/mission-control/ask/route.ts");
  const auth = route.indexOf("await requireSession()");
  const parse = route.indexOf("await req.json()");
  const search = route.indexOf("await searchThoughts");
  assert.ok(auth >= 0, "Ask must require a session");
  assert.ok(auth < parse, "Ask must authenticate before parsing the body");
  assert.ok(auth < search, "Ask must authenticate before Company Memory search");
  assert.match(route, /error instanceof AuthError/);
  assert.match(route, /status: 401/);
});

test("external answer synthesis is explicit opt-in and defaults off", () => {
  const route = source("app/api/mission-control/ask/route.ts");
  assert.match(
    route,
    /process\.env\.MISSION_CONTROL_AI_ANSWERS_ENABLED !== "true"/,
  );
  assert.ok(
    route.indexOf("MISSION_CONTROL_AI_ANSWERS_ENABLED") <
      route.indexOf("OPENROUTER_API_KEY"),
    "privacy gate must be checked before the OpenRouter key",
  );
});

test("Mission Control renders honest preview, unreachable, and empty states", () => {
  const page = source("app/mission-control/page.tsx");
  assert.match(page, /params\.preview === "1"/);
  assert.match(page, /headline="Live status unavailable"/);
  assert.match(page, /headline="No status records yet"/);
  assert.match(page, /if \(!live\)/);
  assert.doesNotMatch(
    page.slice(page.indexOf("catch {"), page.indexOf("if (!live)")),
    /<Cockpit \/>/,
    "failed live reads must not fall back to sample data",
  );
});

test("queue and health claims are based on fresh snapshots and degrade honestly", () => {
  const library = source("lib/mission-control.ts");
  assert.match(library, /const snapshotFresh = snapshot !== null && snapshotAgeMs <= SNAPSHOT_STALE_MS/);
  assert.match(library, /const approvals = snapshotFresh/);
  assert.match(library, /const openCount = snapshotFresh \? snapshot!\.open_count : null/);
  assert.match(library, /Decision queue snapshot unavailable/);
  assert.match(library, /Snapshot is stale/);
  assert.match(library, /let aiOk = true;[\s\S]*catch \{\s*aiOk = false;/);
  assert.match(library, /pct: aiOk \? 100 : 55/);
});

test("sidebar preserves upstream provenance and extensions while adding Mission Control", () => {
  const sidebar = source("components/Sidebar.tsx");
  assert.match(sidebar, /href: "\/mission-control"/);
  assert.match(sidebar, /\.\.\.EXTENSIONS\.map/);
  assert.match(sidebar, /Nate B\. Jones/);
  assert.match(sidebar, /NBJ \/ OB1/);
});
