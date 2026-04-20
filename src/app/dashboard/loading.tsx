export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-6 animate-pulse">

      {/* Hero skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-surface-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-5 w-5 bg-surface-200 rounded" />
            <div className="h-3 w-28 bg-surface-200 rounded-full" />
          </div>
          <div className="h-7 w-64 bg-surface-200 rounded-xl mb-2" />
          <div className="h-3 w-[440px] max-w-full bg-surface-100 rounded-full" />
        </div>
      </div>

      {/* KPIs skeleton — 7 cards (match real layout: 2 cols → 4 cols → 7 cols) */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="card-institution overflow-hidden"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Accent strip */}
            <div className="h-[3px] w-full bg-surface-100" />
            <div className="px-3.5 py-3">
              <div className="flex items-start justify-between mb-2">
                <div className="h-2.5 w-14 bg-surface-100 rounded-full" />
                <div className="h-6 w-6 bg-surface-100 rounded-md" />
              </div>
              <div className="h-7 w-16 bg-surface-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="card-institution p-5">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="h-[42px] w-48 bg-surface-100 rounded-xl" />
          <div className="h-[42px] w-72 bg-surface-100 rounded-xl" />
          <div className="h-[42px] w-24 bg-surface-100 rounded-xl ml-auto" />
        </div>
      </div>

      {/* Charts skeleton — Row 1 (2 charts) */}
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map(i => (
          <div key={i} className="card-institution p-6">
            <div className="h-4 w-40 bg-surface-200 rounded-full mb-1" />
            <div className="h-3 w-28 bg-surface-100 rounded-full mb-6" />
            <div className="h-[220px] bg-surface-50 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Charts skeleton — Row 2 (2 charts) */}
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map(i => (
          <div key={i} className="card-institution p-6">
            <div className="h-4 w-44 bg-surface-200 rounded-full mb-1" />
            <div className="h-3 w-32 bg-surface-100 rounded-full mb-6" />
            <div className="h-[220px] bg-surface-50 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="card-institution overflow-hidden">
        <div className="px-6 py-5 border-b border-surface-200">
          <div className="h-5 w-48 bg-surface-200 rounded-full mb-1.5" />
          <div className="h-3 w-36 bg-surface-100 rounded-full" />
        </div>
        {/* Table header */}
        <div className="px-6 py-3 border-b border-surface-100 flex gap-4">
          {[120, 180, 100, 80, 100].map((w, i) => (
            <div key={i} className={`h-3 bg-surface-100 rounded-full`} style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        <div className="divide-y divide-surface-50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-6 py-3.5 flex gap-4">
              {[120, 180, 100, 80, 100].map((w, j) => (
                <div key={j} className="h-3 bg-surface-50 rounded-full" style={{ width: w - (j % 2 * 20) }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
