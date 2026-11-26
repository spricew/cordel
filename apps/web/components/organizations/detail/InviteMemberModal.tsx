'use client';

import { IconCheck, IconCopy, IconMailPlus, IconX } from '@tabler/icons-react';
import {
  useActionState,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react';

import { Button } from '@components/ui/Button';
import { PrimaryInput } from '@components/ui/PrimaryInput';

import { createInvitationAction } from '@/actions/createInvitationAction';
import { ROLE_LABELS } from '@/lib/organizations/presentation';
import type { CreateInvitationFieldErrors, CreateInvitationState } from '@/types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INITIAL_STATE: CreateInvitationState = { status: 'idle' };

const INVITABLE_ROLES: readonly {
  value: 'MEMBER' | 'ADMIN';
  label: string;
  description: string;
}[] = [
  {
    value: 'MEMBER',
    label: 'Miembro',
    description: 'Participa en los equipos asignados y gestiona sus tareas.',
  },
  {
    value: 'ADMIN',
    label: 'Administrador',
    description: 'Crea equipos, invita personas y consulta la actividad.',
  },
];

type InviteMemberModalProps = {
  organizationSlug: string;
  organizationName: string;
  onClose: () => void;
};

export function InviteMemberModal({
  organizationSlug,
  organizationName,
  onClose,
}: InviteMemberModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const formId = useId();

  const titleId = `${formId}-title`;
  const descriptionId = `${formId}-description`;
  const emailId = `${formId}-email`;
  const emailErrorId = `${formId}-email-error`;

  const [state, formAction, pending] = useActionState(createInvitationAction, INITIAL_STATE);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [clientErrors, setClientErrors] = useState<CreateInvitationFieldErrors>({});
  const [copied, setCopied] = useState(false);

  const errors: CreateInvitationFieldErrors = { ...state.fieldErrors, ...clientErrors };
  const message = state.status === 'error' ? state.message : undefined;
  const createdInvitation = state.status === 'success' ? state.invitation : undefined;

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
    emailRef.current?.focus();
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors: CreateInvitationFieldErrors = {};
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedEmail.length === 0) {
      nextErrors.email = 'El correo electrónico es obligatorio';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = 'Ingresa un correo electrónico válido';
    }

    setClientErrors(nextErrors);

    if (nextErrors.email !== undefined) {
      event.preventDefault();
    }
  }

  async function handleCopyToken(token: string) {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
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
        'm-auto max-h-[calc(100dvh-2rem)] w-[min(31rem,calc(100vw-2rem))] overflow-y-auto',
        'rounded-xl border border-border bg-panel p-0 text-on-surface shadow-level-3',
        'backdrop:bg-primary/35 backdrop:backdrop-blur-[2px]',
      ].join(' ')}
    >
      <header className="flex items-start gap-3 border-b border-border-subtle px-6 py-5">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary-container/60 text-secondary"
        >
          <IconMailPlus className="size-5" stroke={1.75} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id={titleId} className="text-headline-sm text-primary">
            {createdInvitation !== undefined ? 'Invitación creada' : 'Invitar persona'}
          </h2>
          <p id={descriptionId} className="text-body-sm text-muted">
            {createdInvitation !== undefined
              ? `Comparte el código de acceso con ${createdInvitation.email}.`
              : `Suma a alguien a ${organizationName} con un rol inicial definido.`}
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

      {createdInvitation !== undefined ? (
        <div className="flex flex-col">
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="rounded-lg border border-chip-in-review-border bg-chip-in-review/60 px-4 py-3 text-body-sm text-chip-in-review-text">
              Invitación lista para{' '}
              <strong className="font-semibold">{createdInvitation.email}</strong> como{' '}
              <strong className="font-semibold">{ROLE_LABELS[createdInvitation.role]}</strong>.
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-label-md text-primary">Token de invitación</span>
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-data-sm text-primary">
                  {createdInvitation.token}
                </code>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => void handleCopyToken(createdInvitation.token)}
                  className="min-h-9 px-3 text-label-sm"
                >
                  {copied ? (
                    <>
                      <IconCheck aria-hidden="true" className="size-4 text-resolved" stroke={2} />
                      Copiado
                    </>
                  ) : (
                    <>
                      <IconCopy aria-hidden="true" className="size-4" stroke={1.75} />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-body-sm text-muted">
                La persona invitada podrá aceptar la invitación desde su cuenta con este mismo
                correo. Vence en 7 días.
              </p>
            </div>
          </div>

          <footer className="flex justify-end border-t border-border-subtle bg-surface-container-low/40 px-6 py-4">
            <Button onClick={requestClose}>Listo</Button>
          </footer>
        </div>
      ) : (
        <form action={formAction} onSubmit={handleSubmit} className="flex flex-col">
          <input type="hidden" name="orgSlug" value={organizationSlug} />

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
                ref={emailRef}
                id={emailId}
                name="email"
                type="email"
                label="Correo electrónico"
                placeholder="persona@empresa.com"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setClientErrors((current) => ({ ...current, email: undefined }));
                }}
                aria-invalid={errors.email !== undefined || undefined}
                aria-describedby={errors.email !== undefined ? emailErrorId : undefined}
              />
              {errors.email !== undefined ? (
                <p id={emailErrorId} className="text-body-sm text-error">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <fieldset className="flex flex-col gap-2">
              <legend className="text-label-lg text-primary">Rol en la organización</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {INVITABLE_ROLES.map((option) => {
                  const selected = role === option.value;

                  return (
                    <label
                      key={option.value}
                      className={[
                        'flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors',
                        selected
                          ? 'border-secondary-fixed-dim bg-secondary-container/40'
                          : 'border-border bg-panel hover:border-border-strong hover:bg-hover-surface',
                      ].join(' ')}
                    >
                      <span className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="role"
                          value={option.value}
                          checked={selected}
                          onChange={() => setRole(option.value)}
                          className="accent-action"
                        />
                        <span className="text-label-md text-primary">{option.label}</span>
                      </span>
                      <span className="pl-5 text-body-sm text-muted">{option.description}</span>
                    </label>
                  );
                })}
              </div>
              {errors.role !== undefined ? (
                <p className="text-body-sm text-error">{errors.role}</p>
              ) : null}
            </fieldset>
          </div>

          <footer className="flex flex-col-reverse gap-2 border-t border-border-subtle bg-surface-container-low/40 px-6 py-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={requestClose} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              Crear invitación
            </Button>
          </footer>
        </form>
      )}
    </dialog>
  );
}
