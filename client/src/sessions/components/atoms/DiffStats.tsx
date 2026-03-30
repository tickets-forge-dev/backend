'use client';

interface DiffStatsProps {
  additions?: number;
  deletions?: number;
}

export function DiffStats({ additions, deletions }: DiffStatsProps) {
  if (!additions && !deletions) return null;
  return (
    <span className="flex gap-1.5 text-[11px]">
      {additions !== undefined && additions > 0 && <span className="text-emerald-500">+{additions}</span>}
      {deletions !== undefined && deletions > 0 && <span className="text-red-500">-{deletions}</span>}
    </span>
  );
}
