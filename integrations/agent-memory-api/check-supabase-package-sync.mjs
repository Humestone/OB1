#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const RUNTIME_FILES = [
  "deno.json",
  "auth.ts",
  "index.ts",
  "policy.ts",
  "read-only.ts",
];

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SOURCE_DIR = HERE;
const DEFAULT_PACKAGE_DIR = resolve(HERE, "../../supabase/functions/agent-memory-api");

async function readMaybe(filePath) {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function collectPackageSyncIssues({
  sourceDir = DEFAULT_SOURCE_DIR,
  packageDir = DEFAULT_PACKAGE_DIR,
  runtimeFiles = RUNTIME_FILES,
} = {}) {
  const issues = [];

  for (const file of runtimeFiles) {
    const source = await readMaybe(resolve(sourceDir, file));
    const materialized = await readMaybe(resolve(packageDir, file));

    if (!source) {
      issues.push({ file, reason: "missing_source_file" });
      continue;
    }
    if (!materialized) {
      issues.push({ file, reason: "missing_package_file" });
      continue;
    }
    if (!source.equals(materialized)) {
      issues.push({ file, reason: "content_mismatch" });
    }
  }

  return issues;
}

export function formatPackageSyncReport(issues, {
  sourceDir = DEFAULT_SOURCE_DIR,
  packageDir = DEFAULT_PACKAGE_DIR,
} = {}) {
  const header = [
    "Agent Memory API package sync check",
    `Authoritative source: ${sourceDir}`,
    `Materialized package: ${packageDir}`,
  ];

  if (issues.length === 0) {
    return [
      ...header,
      "Result: OK - runtime files match the authoritative source.",
    ].join("\n");
  }

  return [
    ...header,
    "Result: FAILED - materialized package drift detected.",
    ...issues.map((issue) => `- ${issue.file}: ${issue.reason}`),
    "",
    "Refresh the package from the authoritative source before deploying it.",
  ].join("\n");
}

function parseArgs(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--source-dir" || arg === "--package-dir") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) {
        throw new Error(`${arg} requires a value`);
      }
      options[arg.slice(2).replace("-", "_")] = value;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

export async function runCli(args = process.argv.slice(2), stdout = process.stdout, stderr = process.stderr) {
  let options;
  try {
    options = parseArgs(args);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    return 2;
  }

  const sourceDir = options.source_dir
    ? resolve(options.source_dir)
    : DEFAULT_SOURCE_DIR;
  const packageDir = options.package_dir
    ? resolve(options.package_dir)
    : DEFAULT_PACKAGE_DIR;
  const issues = await collectPackageSyncIssues({ sourceDir, packageDir });

  if (options.json) {
    stdout.write(`${JSON.stringify({ sourceDir, packageDir, issues }, null, 2)}\n`);
  } else {
    stdout.write(`${formatPackageSyncReport(issues, { sourceDir, packageDir })}\n`);
  }

  return issues.length === 0 ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli().then((code) => {
    process.exitCode = code;
  }).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
