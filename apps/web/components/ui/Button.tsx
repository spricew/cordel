import type { ComponentProps } from 'react';

/** Variantes visuales del botón, tal como se definen en Figma (nodo 76:18). */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-action text-on-primary hover:bg-action-hover active:bg-action-hover',
  secondary:
    'border border-border bg-panel text-action hover:bg-hover-surface active:bg-hover-surface',
  ghost: 'text-muted hover:bg-hover-muted active:bg-hover-muted',
};

export type ButtonProps = ComponentProps<'button'> & {
  /** Estilo visual del botón. */
  variant?: ButtonVariant;
};

/**
 * Botón base de Cordel.
 *
 * Reproduce el componente Button de Figma: cápsula, padding 8/14 y `label-md`.
 * Los estados `Default` y `Hover` de Figma se resuelven con CSS (`hover:` y
 * `active:`) en vez de exponerse como props, para que el botón mantenga el
 * comportamiento nativo del navegador.
 */
export function Button({
  variant = 'primary',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      {...props}
      className={[
        'inline-flex items-center justify-center rounded-full px-space-md py-space-sm text-label-md whitespace-nowrap transition-colors',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
