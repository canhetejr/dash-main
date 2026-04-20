export default function DisciplinaLoading() {
  return (
    <div className="space-y-6 pb-12 animate-pulse">
      {/* Nav bar */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-44 bg-surface-200 rounded-full" />
        <div className="h-9 w-36 bg-surface-200 rounded-lg" />
      </div>

      {/* Hero skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-surface-200">
        <div className="flex-1 space-y-4">
          <div className="h-4 w-56 bg-surface-200 rounded-full" />
          <div className="h-10 w-80 bg-surface-200 rounded-xl" />
          <div className="flex gap-8">
            {[0, 1, 2].map(i => (
              <div key={i}>
                <div className="h-2.5 w-28 bg-surface-100 rounded-full mb-2" />
                <div className="h-4 w-20 bg-surface-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl bg-white p-6 border border-surface-200">
          <div>
            <div className="h-2.5 w-20 bg-surface-100 rounded-full mb-2 ml-auto" />
            <div className="h-10 w-16 bg-surface-200 rounded-xl" />
          </div>
          <div className="w-px h-14 bg-surface-200" />
          <div className="text-center">
            <div className="h-2.5 w-20 bg-surface-100 rounded-full mb-2 mx-auto" />
            <div className="h-8 w-24 bg-surface-200 rounded-lg" />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-4 xl:grid-cols-7">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="card-institution p-3.5">
            <div className="h-[3px] w-full bg-surface-100 rounded-full mb-3" />
            <div className="flex items-start justify-between mb-2">
              <div className="h-2.5 w-16 bg-surface-100 rounded-full" />
              <div className="h-6 w-6 bg-surface-100 rounded-md" />
            </div>
            <div className="h-7 w-20 bg-surface-200 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1].map(i => (
          <div key={i} className="card-institution p-6">
            <div className="h-4 w-40 bg-surface-200 rounded-full mb-1" />
            <div className="h-3 w-28 bg-surface-100 rounded-full mb-6" />
            <div className="h-[220px] bg-surface-50 rounded-xl" />
          </div>
        ))}
      </div>

      {/* Comments skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-surface-200 rounded" />
          <div className="h-5 w-48 bg-surface-200 rounded-full" />
          <div className="h-5 w-7 bg-surface-100 rounded-full ml-1" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card-institution px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-5 w-20 bg-surface-200 rounded-full" />
              <div className="h-3 w-14 bg-surface-100 rounded-full" />
              <div className="ml-auto flex gap-3">
                <div className="h-3 w-8 bg-surface-100 rounded-full" />
                <div className="h-3 w-24 bg-surface-100 rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-surface-100 rounded-full" />
              <div className="h-3 w-4/5 bg-surface-100 rounded-full" />
              <div className="h-3 w-3/5 bg-surface-100 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
