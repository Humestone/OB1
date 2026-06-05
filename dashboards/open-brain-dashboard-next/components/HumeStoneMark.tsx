export function HumeStoneMark({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-center justify-center border border-violet/35 bg-violet-surface font-mono font-semibold text-violet ${className}`}
    >
      HS
    </div>
  );
}
