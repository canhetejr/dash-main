import type { ReactNode } from 'react';

export function PageHero({
  title,
  subtitle,
  right,
  badges,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  badges?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-surface-300 bg-white shadow-card">
      <div className="p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <div className="flex flex-col gap-2">
              <div>
                <h1 className="text-xl font-bold text-surface-900 sm:text-2xl">{title}</h1>
                {subtitle ? (
                  <p className="mt-1 text-sm text-surface-600">{subtitle}</p>
                ) : null}
              </div>
              {badges ? <div className="flex flex-wrap items-center gap-2">{badges}</div> : null}
            </div>
          </div>

          {right ? <div className="lg:col-span-5">{right}</div> : <div className="lg:col-span-5" />}
        </div>
      </div>
    </section>
  );
}

