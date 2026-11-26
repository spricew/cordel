import { IconBuildingOff } from '@tabler/icons-react';

import { ButtonLink } from '@components/ui/Button';

export default function OrganizationNotFound() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col p-space-sm pt-0 lg:pl-0">
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-border bg-panel px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-md border border-border-strong bg-surface-container-low text-muted">
            <IconBuildingOff aria-hidden="true" className="size-6" stroke={1.5} />
          </span>
          <div className="flex max-w-md flex-col gap-1.5">
            <h1 className="text-headline-md text-primary">Organización no encontrada</h1>
            <p className="text-body-md text-muted">
              Esta organización no existe o tu cuenta no tiene acceso a ella.
            </p>
          </div>
          <ButtonLink href="/organizations" variant="secondary" className="mt-2">
            Volver a organizaciones
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
