'use client';

import { IconMailCheck, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useId, useRef, type MouseEvent } from 'react';

import { AcceptInvitationForm } from './AcceptInvitationForm';

type AcceptInvitationModalProps = {
  onClose: () => void;
};

export function AcceptInvitationModal({ onClose }: AcceptInvitationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const titleId = `${headingId}-title`;
  const descriptionId = `${headingId}-description`;

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
    inputRef.current?.focus();
  }, []);

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
      <header className="flex items-start gap-3 border-b border-border-subtle px-6 py-5">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary-container/60 text-secondary"
        >
          <IconMailCheck className="size-5" stroke={1.75} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 id={titleId} className="text-headline-sm text-primary">
            Aceptar invitación
          </h2>
          <p id={descriptionId} className="text-body-sm text-muted">
            Ingresa el código que recibiste para sumarte a una organización.
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

      <AcceptInvitationForm inputRef={inputRef} onCancel={requestClose} layout="modal" />
    </dialog>
  );
}
