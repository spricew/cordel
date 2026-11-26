'use client';

import {
  IconCheck,
  IconClock,
  IconCopy,
  IconMailForward,
  IconMailPlus,
  IconTrash,
} from '@tabler/icons-react';
import type { Invitation } from '@cordel/types';
import { useState, useTransition } from 'react';

import { Button } from '@components/ui/Button';
import { Chip } from '@components/ui/Chip';

import { revokeInvitationAction } from '@/actions/revokeInvitationAction';
import { ROLE_LABELS, formatShortDate } from '@/lib/organizations/presentation';

type InvitationsSectionProps = {
  organizationSlug: string;
  invitations: Invitation[];
  renderedAt: number;
  onOpenInvite: () => void;
};

export function InvitationsSection({
  organizationSlug,
  invitations,
  renderedAt,
  onOpenInvite,
}: InvitationsSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCopyToken(invitation: Invitation) {
    try {
      await navigator.clipboard.writeText(invitation.token);
      setCopiedId(invitation.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === invitation.id ? null : current));
      }, 2000);
    } catch {
      setErrorMessage('No pudimos copiar el token al portapapeles.');
    }
  }

  function handleRevoke(invitationId: string) {
    setErrorMessage(null);
    setRevokingId(invitationId);

    startTransition(async () => {
      const result = await revokeInvitationAction(organizationSlug, invitationId);
      setRevokingId(null);
      setConfirmingId(null);

      if (!result.ok) {
        setErrorMessage(result.message ?? 'No pudimos revocar la invitación.');
      }
    });
  }

  if (invitations.length === 0) {
    return (
      <div className="rise-in mt-8 flex flex-1 flex-col items-center justify-center rounded-lg border border-border-subtle bg-surface-container-low/40 px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-md border border-secondary-fixed-dim bg-panel text-secondary">
          <IconMailForward aria-hidden="true" className="size-7" stroke={1.5} />
        </span>
        <div role="status" className="mt-4 flex max-w-md flex-col gap-1.5">
          <h2 className="text-headline-md text-primary">No hay invitaciones pendientes</h2>
          <p className="text-body-md text-muted">
            Invita por correo a nuevas personas para que se sumen con un rol asignado desde el
            primer día.
          </p>
        </div>
        <Button className="mt-6" onClick={onOpenInvite}>
          <IconMailPlus aria-hidden="true" className="size-4.5" stroke={2} />
          Invitar persona
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-muted">
          {invitations.length}{' '}
          {invitations.length === 1 ? 'invitación pendiente' : 'invitaciones pendientes'} · vigencia
          de 7 días desde su emisión.
        </p>
        <Button variant="secondary" onClick={onOpenInvite} className="self-start sm:self-auto">
          <IconMailPlus aria-hidden="true" className="size-4" stroke={1.75} />
          Invitar persona
        </Button>
      </div>

      {errorMessage !== null ? (
        <p
          role="alert"
          className="rounded-md border border-error/20 bg-error-container/60 px-4 py-2.5 text-body-sm text-on-error-container"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-panel">
        <ul className="divide-y divide-border-subtle">
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expiresAt).getTime() <= renderedAt;
            const isCopied = copiedId === invitation.id;
            const isConfirming = confirmingId === invitation.id;
            const isRevoking = isPending && revokingId === invitation.id;

            return (
              <li
                key={invitation.id}
                className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-label-lg text-primary">{invitation.email}</span>
                    <Chip tone="neutral">{ROLE_LABELS[invitation.role]}</Chip>
                    {isExpired ? <Chip tone="queued">Vencida</Chip> : null}
                  </div>
                  <p className="inline-flex items-center gap-1.5 text-data-sm text-muted">
                    <IconClock aria-hidden="true" className="size-3.5 shrink-0" stroke={1.5} />
                    <span>
                      Enviada el {formatShortDate(invitation.createdAt)} ·{' '}
                      {isExpired ? 'Venció' : 'Vence'} el {formatShortDate(invitation.expiresAt)}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => void handleCopyToken(invitation)}
                    disabled={isRevoking}
                    className="min-h-9 px-3 text-label-sm"
                  >
                    {isCopied ? (
                      <>
                        <IconCheck aria-hidden="true" className="size-4 text-resolved" stroke={2} />
                        Token copiado
                      </>
                    ) : (
                      <>
                        <IconCopy aria-hidden="true" className="size-4" stroke={1.75} />
                        Copiar token
                      </>
                    )}
                  </Button>

                  {isConfirming ? (
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        onClick={() => setConfirmingId(null)}
                        disabled={isRevoking}
                        className="min-h-9 px-3 text-label-sm"
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleRevoke(invitation.id)}
                        loading={isRevoking}
                        className="min-h-9 border-error/30 bg-error-container/50 px-3 text-label-sm text-on-error-container hover:border-error/50 hover:bg-error-container"
                      >
                        Confirmar revocación
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={() => setConfirmingId(invitation.id)}
                      disabled={isPending}
                      className="min-h-9 px-3 text-label-sm hover:bg-error-container/50 hover:text-on-error-container"
                    >
                      <IconTrash aria-hidden="true" className="size-4" stroke={1.75} />
                      Revocar
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
