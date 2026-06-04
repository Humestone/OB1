"use client";

import { formatDate } from "@/lib/format";

/**
 * Renders a date string formatted as MM/DD/YYYY HH:MM in UTC.
 * Use this in server components to keep hydration stable across timezones.
 */
export function FormattedDate({
  date,
  className,
}: {
  date: string;
  className?: string;
}) {
  return <span className={className}>{formatDate(date)}</span>;
}
