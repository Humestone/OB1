export function HumeStoneMark({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`cm-brand-mark ${className}`}>
      HS
    </div>
  );
}
