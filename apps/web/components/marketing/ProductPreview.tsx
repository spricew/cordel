const teams = [
  {
    name: 'Producto',
    meta: '8 miembros · 12 tareas',
    chip: 'En marcha',
    chipClass: 'border-chip-in-review-border bg-chip-in-review text-chip-in-review-text',
    dotClass: 'bg-resolved',
    progressClass: 'w-2/3',
  },
  {
    name: 'Diseño',
    meta: '5 miembros · 7 tareas',
    chip: 'En revisión',
    chipClass: 'border-chip-active-border bg-chip-active text-chip-active-text',
    dotClass: 'bg-in-progress',
    progressClass: 'w-1/2',
  },
  {
    name: 'Ingeniería',
    meta: '14 miembros · 19 tareas',
    chip: 'En marcha',
    chipClass: 'border-chip-in-review-border bg-chip-in-review text-chip-in-review-text',
    dotClass: 'bg-resolved',
    progressClass: 'w-4/5',
  },
];

export function ProductPreview() {
  return (
    <div
      role="img"
      aria-label="Vista previa de Cordel: la organización Acme con sus equipos y tareas."
      className="relative mx-auto mt-16 w-full max-w-5xl"
    >
      <div
        aria-hidden="true"
        className="absolute -inset-x-10 -top-10 -z-10 h-72 rounded-[50%] bg-primary-fixed/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-border bg-panel shadow-level-3"
      >
        <div className="flex h-14 items-center justify-between border-b border-border-subtle px-5">
          <div className="flex items-center gap-2.5">
            <span className="h-6 w-6 rounded-md bg-primary" />
            <span className="text-label-md text-primary">Cordel</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-secondary-container text-[0.625rem] font-medium text-on-secondary-container">
              A
            </span>
            <span className="text-label-sm text-primary">Acme</span>
          </div>
          <span className="hidden text-data-sm text-muted sm:block">⌘ K</span>
        </div>

        <div className="flex min-h-[320px]">
          <div className="hidden w-14 flex-col items-center gap-3 border-r border-border-subtle py-5 sm:flex">
            <span className="h-8 w-8 rounded-lg bg-primary" />
            <span className="h-8 w-8 rounded-lg bg-surface-container-high" />
            <span className="h-8 w-8 rounded-lg bg-surface-container-high" />
            <span className="h-8 w-8 rounded-lg bg-surface-container-high" />
          </div>

          <div className="hidden w-60 flex-col gap-2 border-r border-border-subtle bg-surface/60 p-4 md:flex">
            <span className="px-2 pb-1 text-label-sm uppercase tracking-caps text-muted">
              Organizaciones
            </span>

            <div className="rounded-lg border border-border bg-panel p-3 shadow-level-2">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-secondary-container text-label-sm text-on-secondary-container">
                  A
                </span>
                <span className="text-label-md text-primary">Acme</span>
              </div>
              <span className="mt-1.5 block text-body-sm text-muted">8 equipos · 42 miembros</span>
            </div>

            <div className="rounded-lg border border-transparent p-3">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-tertiary-fixed text-label-sm text-on-tertiary-fixed-variant">
                  N
                </span>
                <span className="text-label-md text-muted">Norte</span>
              </div>
              <span className="mt-1.5 block text-body-sm text-muted">
                3 equipos · 11 miembros
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-5 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-label-sm uppercase tracking-caps text-muted">
                  Equipos
                </span>
                <span className="text-headline-sm text-primary">Acme</span>
              </div>
              <span className="shrink-0 rounded-full bg-action px-3.5 py-2 text-label-sm text-on-primary">
                Nuevo equipo
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {teams.map((team) => (
                <div
                  key={team.name}
                  className="flex items-center gap-4 rounded-lg border border-border-subtle bg-surface/50 px-4 py-3"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${team.dotClass}`} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-label-md text-primary">{team.name}</span>
                    <span className="text-data-sm text-muted">{team.meta}</span>
                  </div>
                  <div className="hidden w-24 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                      <div className={`h-full rounded-full ${team.dotClass} ${team.progressClass}`} />
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-label-sm ${team.chipClass}`}
                  >
                    {team.chip}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
