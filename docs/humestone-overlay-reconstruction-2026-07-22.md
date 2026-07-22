# HumeStone Overlay Reconstruction Provenance

Date: 2026-07-22

## Boundary

- Clean base: upstream `origin/main` at `677910600de98067f61c120d65956b23f360aedb`.
- Local branch: `codex/ob1-humestone-overlay-reconstruction`.
- Scope: reconstruct the required HumeStone Agent Memory hardening and Mission Control overlay without changing production or replaying the stale deployment branch wholesale.
- Compatibility boundary: current upstream pin, the documented Agent Memory API, and the locally verified Mission Control behavior. There are no Git tags or published releases to use as a stronger boundary.
- Deployment package: `supabase/functions/agent-memory-api` is intentionally absent. The integration source remains authoritative; deployment stays blocked until a package is deliberately materialized, sync-checked, approved, and deployed.

## File provenance

| Files | Source | Treatment and conflict resolution | Verification |
| --- | --- | --- | --- |
| `integrations/agent-memory-api/auth.ts`, `auth.test.ts`, `policy.ts`, `policy.test.ts`, `read-only.ts`, `read-only.test.ts`, `endpoint-scope.test.ts`, `production-boundary.test.ts`, `smoke/read-only-smoke.mjs`, `smoke/read-only-smoke.test.mjs`; `dashboards/open-brain-dashboard-next/lib/governance.ts`; dashboard Agent Memory read-only guards and tests in `README.md`, `package.json`, `lib/agent-memory.test.mjs`, `app/agent-memory/page.tsx`, and `app/agent-memory/[id]/page.tsx` | HumeStone `097f60f9c1e2933a25b58b005d0ef837350cb610` and `e34361bc1d1e7eb2125df47440eafdcfbaad0910` | Cherry-picked whole because these commits are isolated Agent Memory hardening. Upstream files outside those commits remain unchanged. | Deno auth, policy, scope, read-only, and production-boundary tests; Node dry-run smoke tests; dashboard tests and build. |
| `integrations/agent-memory-api/index.ts`, `dual-key-auth.test.ts`, `smoke/live-smoke.mjs` | HumeStone `3b2705957b52f7b9049aad5cb993f1caeea0ee09` | Cherry-picked whole. Dedicated `AGENT_MEMORY_ACCESS_KEY` is preferred; `MCP_ACCESS_KEY` remains an intentional temporary fallback. Live smoke is preserved but not executed because it can write. | Dual-key Deno tests and production-boundary tests. |
| `dashboards/open-brain-dashboard-next/app/agent-memory/[id]/page.tsx`, `app/agent-memory/page.tsx`, `app/agent-memory/traces/page.tsx`, `lib/agent-memory.ts`, `lib/agent-memory.test.mjs`; `integrations/agent-memory-api/README.md`, `check-supabase-package-sync.mjs`, `check-supabase-package-sync.test.mjs` | Selective Agent Memory hunks from HumeStone `807c7fc126129d3eee9ef65a24f7f9df3c1d2c05` plus local reconciliation | Manually reconciled: preserve workspace/project scope on ID and trace reads, prefer the dedicated dashboard key, and add the deployment-package drift check. HumeStone rebranding, unrelated date formatting, and non-Agent-Memory changes from the composite commit were omitted. | Dashboard Agent Memory tests and Node package-sync tests. |
| `dashboards/open-brain-dashboard-next/app/mission-control/cockpit.css`, `page.tsx`, `tokens.css`; `components/mission-control/Cockpit.tsx`, `CockpitStatus.tsx`, `sample-data.ts`, `shell/Spine.tsx`; `lib/mission-control.ts` | Final Mission Control product state from HumeStone `a8b39b8` (lineage `2339565`, `4428f67`, `541114f`, `60a41ee`, `3332143`, `ca493d8`, `1a62c0e`, `0729ceb`, `a8b39b8`) | Copied as isolated Mission Control files. The stale branch's global reskin, governance workbench, package downgrade, build config, and unrelated product changes were omitted. Preview remains explicit-only; empty, stale, and unreachable states remain truthful. | Mission Control source assertions, TypeScript, lint, build, and fixture-only browser UAT. |
| `dashboards/open-brain-dashboard-next/lib/session.ts`, `lib/auth.ts`, `proxy.ts`, deleted `middleware.ts`, `app/login/page.tsx`, `app/login/LoginForm.tsx`, `.env.example` | HumeStone session-hardening design from `a8b39b8`, reconciled onto upstream branding and routes | Manually reconciled. Server-side Company Memory key and password login replace browser/session key storage. The proxy unseals sessions instead of trusting cookie existence. Nate B. Jones / OB1 branding is preserved. All upstream API routes remain self-authenticating. | Mission Control auth tests, lint, TypeScript, and build. |
| `dashboards/open-brain-dashboard-next/app/api/mission-control/ask/route.ts` | HumeStone `a8b39b8`, security-corrected locally | Copied then corrected: `requireSession()` runs before body parsing or search, unauthorized calls return 401, and external synthesis is default-off behind `MISSION_CONTROL_AI_ANSWERS_ENABLED=true`. This intentionally does not preserve the deployed branch's unauthenticated server-key search or automatic third-party snippet transfer. | Focused negative source test plus build. No production or OpenRouter call. |
| `dashboards/open-brain-dashboard-next/components/Sidebar.tsx` | Upstream pin plus one Mission Control entry | Manually reconciled. Adds only the Mission Control core link/icon and preserves upstream extensions and Nate B. Jones / OB1 provenance. | Focused sidebar assertion, lint, and build. |
| `dashboards/open-brain-dashboard-next/lib/mission-control.test.mjs`, `package.json` | New reconstruction evidence | Adds focused local tests for authenticated page access, forged-cookie resistance, Ask auth ordering, privacy opt-in, truthful state rendering, snapshot freshness, semantic-search degradation, and preserved sidebar provenance. | `node --test lib/*.test.mjs`. |
| `docs/humestone-overlay-reconstruction-2026-07-22.md` | This reconstruction | Records the clean base, source lineage, conflict choices, omissions, test evidence, and remaining gates. | `git diff --check` and final repository inventory. |

## Intentionally omitted

- No wholesale cherry-pick of composite commits `807c7fc` or `60a41ee`.
- No replay of the dirty deployed Mission Control branch or policy-only commit `dae05d2`.
- No Next.js downgrade, package-lock replacement, removal of OpenNext/Cloudflare support, global rebrand/reskin, or replacement of upstream extension navigation.
- No materialized Supabase function package, schema/data mutation, live smoke, native OpenClaw smoke, real endpoint call, Vercel change, deployment, push, pull request, merge, branch deletion, or worktree cleanup.
- No claim of byte-for-byte parity with the live Vercel deployment because its recorded source was dirty. The target is documented functional parity with the security and privacy defects corrected.

## Remaining gates

1. All local tests, lint, typecheck, build, plugin schema/build, and fixture-only browser checks must pass.
2. A separate review decision is required before push or pull request creation.
3. Production configuration, secrets, materialization, deployment, or data/schema work require explicit production approval.

## Local verification evidence

- Dashboard boundary tests: 11 passed, including Agent Memory scope/key behavior and Mission Control auth, privacy, truthfulness, and provenance assertions.
- Agent Memory API: `deno fmt --check` passed; 44 Deno tests passed.
- Agent Memory dry-run harness: 10 Node tests passed; 15 planned checks; output explicitly confirmed `No network calls were made.`
- Dashboard: ESLint passed, TypeScript no-emit passed, and the Next.js 16.2.4 production build passed with all expected routes, including `/mission-control` and `/api/mission-control/ask`.
- Browser fixtures at `127.0.0.1` only: preview loaded with an explicit sample-data banner; connected-empty rendered `No status records yet`; an unavailable loopback API rendered `Live status unavailable`; all three had content and no Next.js error overlay.
- Runtime auth negatives: malformed unauthenticated Ask request returned `401 Unauthorized` before JSON parsing; a garbage `open_brain_session` cookie returned `307` to `/login`; unauthenticated browser navigation landed on the upstream-branded password screen.
- OpenClaw plugin 0.1.6: schema check passed and bundling completed. Rebuilding the untouched upstream pin does not reproduce its committed `dist/index.js`; the generated file was restored to the exact upstream version. This is inherited upstream build-artifact debt and was not folded into the HumeStone overlay.
- Package sync checker correctly failed closed because `supabase/functions/agent-memory-api` is absent, naming all five missing runtime files. This is the intended deployment blocker, not a test failure to bypass.
