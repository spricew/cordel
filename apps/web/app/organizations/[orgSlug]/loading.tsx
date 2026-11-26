export default function OrganizationDetailLoading() {
  return (
    <div
      className="flex min-h-0 flex-1 overflow-hidden"
      aria-busy="true"
      aria-label="Cargando organización"
    >
      <aside className="hidden w-60 shrink-0 flex-col px-space-lg py-space-lg lg:flex">
        <div className="h-8 w-32 animate-pulse rounded-sm bg-surface-container-high" />
        <div className="mt-4 h-14 w-full animate-pulse rounded-md bg-surface-container-high" />
        <div className="mt-6 flex flex-col gap-2">
          <div className="h-9 w-full animate-pulse rounded-sm bg-surface-container-high" />
          <div className="h-9 w-full animate-pulse rounded-sm bg-surface-container-high" />
          <div className="h-9 w-full animate-pulse rounded-sm bg-surface-container-high" />
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col p-space-sm pt-0 lg:pl-0">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-panel px-6 py-8 lg:px-14 lg:py-12">
          <div className="h-4 w-44 animate-pulse rounded-sm bg-surface-container" />
          <div className="mt-5 flex items-center gap-4 border-b border-border-subtle pb-7">
            <div className="size-14 shrink-0 animate-pulse rounded-md bg-surface-container-high" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-8 w-56 animate-pulse rounded-sm bg-surface-container-high" />
              <div className="h-4 w-40 animate-pulse rounded-sm bg-surface-container" />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
            <div className="h-28 animate-pulse rounded-lg bg-surface-container-low" />
            <div className="h-28 animate-pulse rounded-lg bg-surface-container-low" />
            <div className="h-28 animate-pulse rounded-lg bg-surface-container-low" />
            <div className="h-28 animate-pulse rounded-lg bg-surface-container-low" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-space-lg xl:grid-cols-12">
            <div className="h-72 animate-pulse rounded-lg bg-surface-container-low xl:col-span-7" />
            <div className="h-72 animate-pulse rounded-lg bg-surface-container-low xl:col-span-5" />
          </div>
        </div>
      </section>
    </div>
  );
}
