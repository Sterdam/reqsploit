/**
 * Loading Skeleton Components
 * Professional loading states instead of spinners
 */

export function RequestListSkeleton() {
  return (
    <div className="divide-y divide-white/5 animate-pulse">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-center gap-3">
          <div className="w-12 h-6 bg-white/10 rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
          <div className="w-10 h-6 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <table className="w-full">
        <thead className="bg-[#0D1F2D]">
          <tr className="border-b border-white/10">
            {[...Array(columns)].map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <div className="h-4 bg-white/10 rounded w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <div className="h-4 bg-white/5 rounded w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PanelSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="px-6 py-4 border-b border-white/10 bg-[#0D1F2D]">
        <div className="h-6 bg-white/10 rounded w-48 mb-2" />
        <div className="h-4 bg-white/5 rounded w-64" />
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="h-4 bg-white/10 rounded w-full" />
        <div className="h-4 bg-white/5 rounded w-5/6" />
        <div className="h-4 bg-white/5 rounded w-4/6" />
        <div className="h-32 bg-white/5 rounded w-full mt-6" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 bg-white/5 rounded border border-white/10 animate-pulse">
      <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
        <div className="h-3 bg-white/5 rounded w-4/6" />
      </div>
    </div>
  );
}
