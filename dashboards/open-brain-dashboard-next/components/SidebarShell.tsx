"use client";

import { useState } from "react";
import { HumeStoneMark } from "@/components/HumeStoneMark";
import { Sidebar } from "@/components/Sidebar";

export function SidebarShell({
  governanceReadOnly = false,
}: {
  governanceReadOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="ob1-glass-panel md:hidden fixed top-0 left-0 right-0 z-50 h-12 border-x-0 border-t-0 flex items-center px-4 gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="text-text-secondary hover:text-text-primary transition-colors"
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <HumeStoneMark className="h-6 w-6 text-[9px]" />
        <div className="min-w-0">
          <span className="block text-text-primary font-semibold text-base leading-tight tracking-tight">
            Company Memory
          </span>
          <span className="ob1-brand-kicker">HumeStone</span>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        governanceReadOnly={governanceReadOnly}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
