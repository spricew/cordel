'use client';

import { IconUsersPlus, IconX } from '@tabler/icons-react';
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from 'react';

import { Button } from '@components/ui/Button';
import { PrimaryInput } from '@components/ui/PrimaryInput';

import { createTeamAction } from '@/actions/createTeamAction';
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  SLUG_MAX_LENGTH,
  SLUG_PATTERN,
  normalizeSlugInput,
  toSlug,
} from '@/lib/organizations/presentation';
import type { CreateTeamFieldErrors, CreateTeamState } from '@/types';

const INITIAL_STATE: CreateTeamState = { status: 'idle' };

type CreateTeamModalProps = {
  organizationSlug: string;
  organizationName: string;
  onClose: () => void;
};

export function CreateTeamModal({
  organizationSlug,
  organizationName,
  onClose,
}: CreateTeamModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const formId = useId();

  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;
  const nameId = `${formId}-name`;
  const nameErrorId = `${formId}-name-error`;
  const slugId = `${formId}-slug`;
  const slugHelpId = `${formId}-slug-help`;

  const [state, formAction, pending] = useActionState(createTeamAction, INITIAL_STATE);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [clientErrors, setClientErrors] = useState<CreateTeamFieldErrors>({});

  const errors: CreateTeamFieldErrors = { ...state.fieldErrors, ...clientErrors };
  const message = state.status === 'error' ? state.message : undefined;

  const requestClose = useCallback(() => {
    if (dialogRef.current?.open === true) {
      dialogRef.current.close();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null || dialog.open) return;

    dialog.showModal();
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.status === 'success') {
      requestClose();
    }
  }, [requestClose, state.status]);

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setName(value);
    setClientErrors((current) => ({ ...current, name: undefined }));

    if (!slugEdited) {
      setSlug(toSlug(value));
    }
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlug(normalizeSlugInput(event.target.value));
    setSlugEdited(true);
    setClientErrors((current) => ({ ...current, slug: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors: CreateTeamFieldErrors = {};
    const trimmedName = name.trim();

    if (trimmedName.length < NAME_MIN_LENGTH) {
      nextErrors.name = `El nombre debe tener al menos ${NAME_MIN_LENGTH} caracteres`;
    } else if (trimmedName.length > NAME_MAX_LENGTH) {
      nextErrors.name = `El nombre no puede superar los ${NAME_MAX_LENGTH} caracteres`;
    }

    if (slug.length === 0) {
      nextErrors.slug = 'El identificador es obligatorio';
    } else if (!SLUG_PATTERN.test(slug)) {
      nextErrors.slug = 'No puede empezar ni terminar con guion, ni tener guiones seguidos';
    }

    setClientErrors(nextErrors);

    if (nextErrors.name !== undefined || nextErrors.slug !== undefined) {
      event.preventDefault();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      requestClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={handleBackdropClick}
      className={[
        'm-auto max-h-[calc(100dvh-2rem)] w-[min(30rem,calc(100vw-2rem))] overflow-y-auto',
        'rounded-xl border border-border bg-panel p-0 text-on-surface shadow-level-3',
        'backdrop:bg-primary/35 backdrop:backdrop-blur-[2px]',
      ].join(' ')}
    >
      <form action={formAction} onSubmit={handleSubmit} className="flex flex-col">
        <input type="hidden" name="orgSlug" value={organizationSlug} />

        <header className="flex items-start gap-3 border-b border-border-subtle px-6 py-5">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary-container/60 text-secondary"
          >
            <IconUsersPlus className="size-5" stroke={1.75} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h2 id={titleId} className="text-headline-sm text-primary">
              Nuevo equipo
            </h2>
            <p id={descriptionId} className="text-body-sm text-muted">
              Cada equipo dentro de {organizationName} mantiene sus tareas y permisos aislados.
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Cerrar"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-hover-muted hover:text-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            <IconX aria-hidden="true" className="size-4.5" stroke={2} />
          </button>
        </header>

        <div className="flex flex-col gap-4 px-6 py-5">
          {message !== undefined ? (
            <p
              role="alert"
              className="rounded-md border border-error/20 bg-error-container/60 px-3 py-2 text-body-sm text-on-error-container"
            >
              {message}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <PrimaryInput
              ref={nameRef}
              id={nameId}
              name="name"
              label="Nombre del equipo"
              placeholder="Producto"
              autoComplete="off"
              maxLength={NAME_MAX_LENGTH}
              value={name}
              onChange={handleNameChange}
              aria-invalid={errors.name !== undefined || undefined}
              aria-describedby={errors.name !== undefined ? nameErrorId : undefined}
            />
            {errors.name !== undefined ? (
              <p id={nameErrorId} className="text-body-sm text-error">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <PrimaryInput
              id={slugId}
              name="slug"
              label="Identificador"
              placeholder="producto"
              autoComplete="off"
              spellCheck={false}
              maxLength={SLUG_MAX_LENGTH}
              value={slug}
              onChange={handleSlugChange}
              aria-invalid={errors.slug !== undefined || undefined}
              aria-describedby={slugHelpId}
            />
            <p
              id={slugHelpId}
              className={
                errors.slug !== undefined ? 'text-body-sm text-error' : 'text-body-sm text-muted'
              }
            >
              {errors.slug ??
                'Solo minúsculas, números y guiones. Se usará en la dirección del equipo.'}
            </p>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-surface-container-low/40 px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={requestClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" loading={pending}>
            Crear equipo
          </Button>
        </footer>
      </form>
    </dialog>
  );
}
