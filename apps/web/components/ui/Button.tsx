import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-action text-on-primary hover:bg-action-hover active:bg-action-hover',
  secondary:
    'border border-border bg-panel text-action hover:bg-hover-surface active:bg-hover-surface',
  ghost: 'text-muted hover:bg-hover-muted active:bg-hover-muted',
};

export type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
};

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
