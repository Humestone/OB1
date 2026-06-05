import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  collectPackageSyncIssues,
  formatPackageSyncReport,
  RUNTIME_FILES,
} from "./check-supabase-package-sync.mjs";

async function writeRuntimeFiles(root, values = {}) {
  await mkdir(root, { recursive: true });
  for (const file of RUNTIME_FILES) {
    await writeFile(join(root, file), values[file] ?? `${file}\n`);
  }
}

test("collectPackageSyncIssues passes when runtime files match", async (t) => {
  const tempRoot = await mkdtemp(join(tmpdir(), "agent-memory-package-sync-"));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const source = join(tempRoot, "source");
  const pkg = join(tempRoot, "package");

  await writeRuntimeFiles(source);
  await writeRuntimeFiles(pkg);

  const issues = await collectPackageSyncIssues({ sourceDir: source, packageDir: pkg });

  assert.deepEqual(issues, []);
});

test("collectPackageSyncIssues reports missing and drifted runtime files", async (t) => {
  const tempRoot = await mkdtemp(join(tmpdir(), "agent-memory-package-sync-"));
  t.after(() => rm(tempRoot, { recursive: true, force: true }));
  const source = join(tempRoot, "source");
  const pkg = join(tempRoot, "package");

  await writeRuntimeFiles(source);
  await writeRuntimeFiles(pkg, { "index.ts": "stale\n" });
  await writeFile(join(pkg, "auth.ts"), "auth.ts\n");
  await rm(join(pkg, "policy.ts"));

  const issues = await collectPackageSyncIssues({ sourceDir: source, packageDir: pkg });

  assert.deepEqual(issues, [
    { file: "index.ts", reason: "content_mismatch" },
    { file: "policy.ts", reason: "missing_package_file" },
  ]);
});

test("formatPackageSyncReport explains source authority", () => {
  const report = formatPackageSyncReport([
    { file: "index.ts", reason: "content_mismatch" },
  ]);

  assert.match(report, /authoritative source/);
  assert.match(report, /index\.ts/);
  assert.match(report, /content_mismatch/);
});
