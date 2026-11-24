'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'inverse-outline';

export type ButtonSize = 'md' | 'lg' | 'xl';

type VariantDefinition = {
  /** Colores de reposo, hover y pulsado. */
  className: string;
  focusClassName: string;
};

const VARIANT_CLASSES: Record<ButtonVariant, VariantDefinition> = {
  primary: {
    className: 'bg-action text-on-primary hover:bg-action-hover active:bg-action-hover',
    focusClassName: 'focus-visible:outline-action',
  },
  secondary: {
    className:
      'border-border bg-panel text-action hover:border-border-strong hover:bg-hover-surface active:bg-hover-surface',
    focusClassName: 'focus-visible:outline-action',
  },
  ghost: {
    className:
      'text-muted hover:bg-hover-muted hover:text-action active:bg-hover-muted active:text-action',
    focusClassName: 'focus-visible:outline-action',
  },
  inverse: {
    className: 'bg-white text-primary hover:bg-primary-fixed active:bg-primary-fixed',
    focusClassName: 'focus-visible:outline-white',
  },
  'inverse-outline': {
    className:
      'border-white/20 text-primary-fixed hover:border-white/40 hover:text-white active:border-white/40 active:text-white',
    focusClassName: 'focus-visible:outline-white',
  },
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'min-h-11 min-w-11 px-5 py-2 text-label-md',
  lg: 'min-h-12 min-w-12 px-6 py-2.5 text-label-lg tracking-tight',
  xl: 'min-h-13 min-w-13 px-7 py-3 text-label-xl tracking-tight',
};

const BASE_CLASSES = [
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap leading-tight',
  'rounded-full border border-transparent text-center align-middle',
  'cursor-pointer appearance-none touch-manipulation [-webkit-tap-highlight-color:transparent]',
  'transition duration-150 ease-out motion-safe:active:scale-[0.97] active:duration-75',
  'focus-visible:outline-2 focus-visible:outline-offset-2',
  'disabled:pointer-events-none disabled:opacity-50',
  'aria-disabled:pointer-events-none aria-disabled:opacity-50',
  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
].join(' ');

export type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ocupa todo el ancho del contenedor. */
  fullWidth?: boolean;
  className?: string;
};

type ButtonStateProps = {
  loading?: boolean;
};

export type ButtonProps = ComponentProps<'button'> & ButtonStyleOptions & ButtonStateProps;

export type ButtonLinkProps = ComponentProps<typeof Link> &
  ButtonStyleOptions &
  ButtonStateProps & {
    /**
     * Los enlaces no admiten `disabled` nativo. Cuando es `true` se aplica
     * `aria-disabled`, se retira del orden de tabulación y se cancela la
     * navegación, conservando el aspecto deshabilitado.
     */
    disabled?: boolean;
  };

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  const { className: variantClassName, focusClassName } = VARIANT_CLASSES[variant];

  return [
    BASE_CLASSES,
    SIZE_CLASSES[size],
    variantClassName,
    focusClassName,
    fullWidth && 'w-full',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

type ButtonContentProps = {
  loading: boolean;
  children: ReactNode;
};

function ButtonContent({ loading, children }: ButtonContentProps) {
  if (!loading) {
    return <>{children}</>;
  }

  return (
    <>
      <span className="inline-flex items-center justify-center gap-2 opacity-0">{children}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid place-items-center"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="size-[1.1em] animate-spin"
        >
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeOpacity="0.25"
            strokeWidth="2.5"
          />
          <path
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  type = 'button',
  className,
  disabled,
  onClick,
  'aria-disabled': ariaDisabled,
  children,
  ...props
}: ButtonProps) {
  const isAriaDisabled = ariaDisabled === true || ariaDisabled === 'true';

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-disabled={ariaDisabled}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      onClick={(event) => {
        if (isAriaDisabled) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      className={buttonClassName({ variant, size, fullWidth, className })}
    >
      <ButtonContent loading={loading}>{children}</ButtonContent>
    </button>
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  onClick,
  tabIndex,
  'aria-disabled': ariaDisabled,
  children,
  ...props
}: ButtonLinkProps) {
  const isInactive = disabled || loading || ariaDisabled === true || ariaDisabled === 'true';

  return (
    <Link
      {...props}
      aria-disabled={isInactive ? true : undefined}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      tabIndex={isInactive ? -1 : tabIndex}
      onClick={(event) => {
        if (isInactive) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      className={buttonClassName({ variant, size, fullWidth, className })}
    >
      <ButtonContent loading={loading}>{children}</ButtonContent>
    </Link>
  );
}
