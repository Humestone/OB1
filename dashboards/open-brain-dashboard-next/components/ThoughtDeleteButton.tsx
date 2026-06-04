"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteModal } from "./DeleteModal";
import { readGovernanceReadOnlyFromDom } from "@/lib/governance";

export function ThoughtDeleteButton({
  deleteAction,
  readOnlyMode = false,
}: {
  deleteAction: () => Promise<void>;
  readOnlyMode?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const readOnly = readOnlyMode || readGovernanceReadOnlyFromDom();

  return (
    <>
      <button
        disabled={readOnly}
        title={
          readOnly
            ? "Blocked by read-only governance pilot"
            : "Delete this thought"
        }
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 text-xs font-medium text-danger/70 hover:text-danger border border-danger/20 hover:border-danger/40 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        {readOnly ? "Delete Blocked" : "Delete"}
      </button>
      {showModal && !readOnly && (
        <DeleteModal
          title="Delete Thought"
          message="This thought will be permanently deleted. This action cannot be undone."
          onConfirm={async () => {
            await deleteAction();
            router.push("/thoughts");
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  );
}
