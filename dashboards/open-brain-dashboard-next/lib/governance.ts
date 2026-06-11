export const GOVERNANCE_READ_ONLY_ENV = "OB1_GOVERNANCE_READ_ONLY";

export const GOVERNANCE_READ_ONLY_NOTICE =
  "Read-only governance pilot is active. Write actions are blocked.";

export const GOVERNANCE_READ_ONLY_ERROR =
  "Read-only governance pilot mode is enabled. Write actions are blocked.";

export const GOVERNANCE_READ_ONLY_CODE = "OB1_GOVERNANCE_READ_ONLY";

export function isGovernanceReadOnly(): boolean {
  return process.env.OB1_GOVERNANCE_READ_ONLY === "true";
}

export function governanceReadOnlyPayload(action?: string) {
  return {
    error: GOVERNANCE_READ_ONLY_ERROR,
    code: GOVERNANCE_READ_ONLY_CODE,
    action: action ?? null,
  };
}

export function readGovernanceReadOnlyFromDom(): boolean {
  if (typeof document === "undefined") return false;
  return document.body?.dataset.ob1GovernanceReadOnly === "true";
}
