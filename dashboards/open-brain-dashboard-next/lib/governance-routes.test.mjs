import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function source(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

const guardedRoutes = [
  {
    file: "app/api/audit/delete/route.ts",
    action: "audit_delete",
    mutation: "deleteThought(",
  },
  {
    file: "app/api/kanban/update/route.ts",
    action: "kanban_update",
    mutation: "updateThought(",
  },
  {
    file: "app/api/kanban/delete/route.ts",
    action: "kanban_delete",
    mutation: "deleteThought(",
  },
  {
    file: "app/api/thoughts/[id]/reflection/route.ts",
    action: "reflection_create",
    mutation: "/thought/${id}/reflection",
  },
  {
    file: "app/api/ingest/[id]/execute/route.ts",
    action: "ingest_execute",
    mutation: "/ingestion-jobs/${id}/execute",
  },
];

test("write-adjacent dashboard API routes block in governance read-only mode before mutation", () => {
  for (const route of guardedRoutes) {
    const text = source(route.file);
    const guardIndex = text.indexOf("if (isGovernanceReadOnly())");
    const mutationIndex = text.indexOf(route.mutation);

    assert.match(
      text,
      /governanceReadOnlyPayload,\s*\n\s*isGovernanceReadOnly,|isGovernanceReadOnly,\s*\n\s*governanceReadOnlyPayload,/,
      `${route.file} must import governance read-only helpers`,
    );
    assert.notEqual(guardIndex, -1, `${route.file} must check governance read-only mode`);
    assert.notEqual(mutationIndex, -1, `${route.file} must contain ${route.mutation}`);
    assert.ok(guardIndex < mutationIndex, `${route.file} must guard before mutation`);
    assert.match(
      text,
      new RegExp(`governanceReadOnlyPayload\\("${route.action}"\\)`),
      `${route.file} must use stable action ${route.action}`,
    );
    assert.match(text, /status:\s*403/, `${route.file} must return HTTP 403 when blocked`);
  }
});

test("audit bulk delete controls are disabled when governance read-only mode is active", () => {
  const text = source("app/audit/page.tsx");

  assert.match(text, /readGovernanceReadOnlyFromDom/, "audit page must read governance mode from the DOM");
  assert.match(text, /const governanceReadOnly = readGovernanceReadOnlyFromDom\(\)/);
  assert.match(text, /if \(governanceReadOnly\) \{/);
  assert.match(text, /disabled=\{governanceReadOnly\}/);
  assert.match(text, /Delete \{selected\.size\} selected \(Blocked\)/);
});

test("kanban write controls are disabled when governance read-only mode is active", () => {
  const board = source("components/KanbanBoard.tsx");
  const column = source("components/KanbanColumn.tsx");
  const card = source("components/KanbanCard.tsx");
  const modal = source("components/KanbanCardModal.tsx");
  const priority = source("components/PriorityDot.tsx");

  assert.match(board, /readGovernanceReadOnlyFromDom/, "kanban board must read governance mode");
  assert.match(board, /GOVERNANCE_READ_ONLY_ERROR/, "kanban board must report blocked writes");
  assert.match(board, /if \(readOnly\) \{/);
  assert.match(board, /sensors=\{readOnly \? \[\] : sensors\}/);
  assert.match(board, /readOnlyMode=\{readOnly\}/);

  assert.match(column, /readOnlyMode\?: boolean/);
  assert.match(column, /disabled: readOnlyMode/);
  assert.match(column, /showArchiveButton=\{status === "done" && !readOnlyMode\}/);

  assert.match(card, /readOnlyMode\?: boolean/);
  assert.match(card, /useSortable\(\{ id: thought\.id, disabled: readOnlyMode \}\)/);
  assert.match(card, /readOnlyMode \? undefined : listeners/);
  assert.match(card, /disabled=\{readOnlyMode\}/);

  assert.match(modal, /readOnlyMode\?: boolean/);
  assert.match(modal, /if \(readOnlyMode\) return/);
  assert.match(modal, /disabled=\{readOnlyMode\}/);
  assert.match(modal, /Save Blocked/);

  assert.match(priority, /disabled\?: boolean/);
  assert.match(priority, /if \(disabled\) return/);
  assert.match(priority, /disabled=\{disabled\}/);
});

test("ingest AddToBrain read-only rendering is hydration-stable", () => {
  const ingestPage = source("app/ingest/page.tsx");
  const ingestClient = source("app/ingest/IngestPageClient.tsx");
  const addToBrain = source("components/AddToBrain.tsx");

  assert.match(
    ingestPage,
    /import \{ isGovernanceReadOnly \} from "@\/lib\/governance"/,
    "ingest page must derive read-only governance on the server",
  );
  assert.match(
    ingestPage,
    /const governanceReadOnly = isGovernanceReadOnly\(\)/,
    "ingest page must compute the server read-only value before rendering AddToBrain",
  );
  assert.match(
    ingestPage,
    /<IngestPageClient governanceReadOnly=\{governanceReadOnly\} \/>/,
    "ingest page must pass server read-only state into its client renderer",
  );
  assert.match(
    ingestClient,
    /readOnlyMode=\{governanceReadOnly\}/,
    "ingest client must pass server read-only state into AddToBrain",
  );
  assert.doesNotMatch(
    addToBrain,
    /const readOnly = readOnlyMode \|\| readGovernanceReadOnlyFromDom\(\)/,
    "AddToBrain must not read DOM governance during its initial render",
  );
});
