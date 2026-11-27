'use client';

import { IconArrowRight, IconCheck, IconMailCheck } from '@tabler/icons-react';
import { useActionState, useId, useState, type FormEvent, type RefObject } from 'react';

import { Button, ButtonLink } from '@components/ui/Button';
import { Chip } from '@components/ui/Chip';
import { PrimaryInput } from '@components/ui/PrimaryInput';

import { acceptInvitationAction } from '@/actions/acceptInvitationAction';
import {
  INVITATION_TOKEN_MAX_LENGTH,
  validateInvitationToken,
} from '@/lib/organizations/accept-invitation';
import { ROLE_LABELS } from '@/lib/organizations/presentation';
import type { AcceptInvitationFieldErrors, AcceptInvitationState } from '@/types';

const INITIAL_STATE: AcceptInvitationState = { status: 'idle' };

type AcceptInvitationFormProps = {
  userEmail?: string;
  initialToken?: string;
  inputRef?: RefObject<HTMLInputElement | null>;
  onCancel?: () => void;
  cancelLabel?: string;
  layout?: 'modal' | 'page';
};

export function AcceptInvitationForm({
  userEmail,
  initialToken,
  inputRef,
  onCancel,
  cancelLabel = 'Cancelar',
  layout = 'modal',
}: AcceptInvitationFormProps) {
  const formId = useId();
  const tokenId = `${formId}-token`;
  const tokenErrorId = `${formId}-token-error`;

  const [state, formAction, pending] = useActionState(acceptInvitationAction, INITIAL_STATE);
  const [token, setToken] = useState(initialToken ?? '');
  const [clientErrors, setClientErrors] = useState<AcceptInvitationFieldErrors>({});

  const errors: AcceptInvitationFieldErrors = { ...state.fieldErrors, ...clientErrors };
  const message = state.status === 'error' ? state.message : undefined;
  const acceptedOrganization = state.status === 'success' ? state.organization : undefined;
  const acceptedRole = state.status === 'success' ? state.role : undefined;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const validation = validateInvitationToken(token);
    const nextErrors: AcceptInvitationFieldErrors = {};

    if (validation.error !== undefined) {
      nextErrors.token = validation.error;
    }

    setClientErrors(nextErrors);

    if (nextErrors.token !== undefined) {
      event.preventDefault();
    }
  }

  const bodyPadding = layout === 'modal' ? 'px-6 py-5' : '';
  const footerClass =
    layout === 'modal'
      ? 'flex flex-col-reverse gap-2 border-t border-border-subtle bg-surface-container-low/40 px-6 py-4 sm:flex-row sm:justify-end'
      : 'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end';

  if (acceptedOrganization !== undefined && acceptedRole !== undefined) {
    return (
      <div className="flex flex-col">
        <div className={`flex flex-col gap-4 ${bodyPadding}`}>
          <div className="flex items-start gap-3 rounded-lg border border-chip-in-review-border bg-chip-in-review/60 px-4 py-3.5 text-chip-in-review-text">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-panel text-resolved">
              <IconCheck aria-hidden="true" className="size-4" stroke={2.25} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-body-sm">
                Te uniste a <strong className="font-semibold">{acceptedOrganization.name}</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-data-sm">
                <span>/{acceptedOrganization.slug}</span>
                <Chip tone="in-review">{ROLE_LABELS[acceptedRole]}</Chip>
              </div>
            </div>
          </div>
        </div>

        <footer className={footerClass}>
          {onCancel !== undefined ? (
            <Button variant="secondary" onClick={onCancel}>
              Cerrar
            </Button>
          ) : (
            <ButtonLink href="/organizations" variant="secondary">
              Ver organizaciones
            </ButtonLink>
          )}
          <ButtonLink href={`/organizations/${encodeURIComponent(acceptedOrganization.slug)}`}>
            Ir a la organización
            <IconArrowRight aria-hidden="true" className="size-4" stroke={2} />
          </ButtonLink>
        </footer>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex flex-col">
      <div className={`flex flex-col gap-4 ${bodyPadding}`}>
        {message !== undefined ? (
          <p
            role="alert"
            className="rounded-md border border-error/20 bg-error-container/60 px-3 py-2 text-body-sm text-on-error-container"
          >
            {message}
          </p>
        ) : null}

        {userEmail !== undefined ? (
          <p className="rounded-md border border-border-subtle bg-surface-container-low/60 px-3.5 py-2.5 text-body-sm text-on-surface-variant">
            Sesión actual: <strong className="font-medium text-primary">{userEmail}</strong>. Solo
            puedes aceptar invitaciones enviadas a este correo.
          </p>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <PrimaryInput
            ref={inputRef}
            id={tokenId}
            name="token"
            type="text"
            label="Código de invitación"
            placeholder="Pega aquí el token que recibiste"
            autoComplete="off"
            spellCheck={false}
            maxLength={INVITATION_TOKEN_MAX_LENGTH}
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setClientErrors((current) => ({ ...current, token: undefined }));
            }}
            aria-invalid={errors.token !== undefined || undefined}
            aria-describedby={errors.token !== undefined ? tokenErrorId : undefined}
          />
          {errors.token !== undefined ? (
            <p id={tokenErrorId} className="text-body-sm text-error">
              {errors.token}
            </p>
          ) : (
            <p className="text-data-sm text-muted">
              Debe coincidir con el correo de tu cuenta actual y no haber vencido.
            </p>
          )}
        </div>
      </div>

      <footer className={footerClass}>
        {onCancel !== undefined ? (
          <Button variant="secondary" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
        ) : (
          <ButtonLink href="/organizations" variant="secondary">
            Volver
          </ButtonLink>
        )}
        <Button type="submit" loading={pending}>
          <IconMailCheck aria-hidden="true" className="size-4.5" stroke={1.75} />
          Aceptar invitación
        </Button>
      </footer>
    </form>
  );
}
