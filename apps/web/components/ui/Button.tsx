import Link from 'next/link';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'inverse-outline';

export type ButtonSize = 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-action text-on-primary hover:bg-action-hover active:bg-action-hover',
  secondary:
    'border border-border bg-panel text-action hover:bg-hover-surface active:bg-hover-surface',
  ghost: 'text-muted hover:bg-hover-muted active:bg-hover-muted',
  inverse: 'bg-white text-primary hover:bg-primary-fixed active:bg-primary-fixed',
  'inverse-outline':
    'border border-white/20 text-primary-fixed hover:border-white/40 hover:text-white active:border-white/40 active:text-white',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  md: 'px-space-md py-space-sm text-label-md',
  lg: 'h-12 px-7 text-label-lg',
};

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

export type ButtonProps = ComponentProps<'button'> & ButtonStyleOptions;

export type ButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleOptions;

export function buttonClassName({
  variant = 'primary',
  size = 'md',
  className,
}: ButtonStyleOptions = {}): string {
  return [
    'inline-flex items-center justify-center rounded-full whitespace-nowrap transition-colors',
    'disabled:pointer-events-none disabled:opacity-50',
    SIZE_CLASSES[size],
    VARIANT_CLASSES[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button type={type} {...props} className={buttonClassName({ variant, size, className })} />
  );
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLinkProps) {
  return <Link {...props} className={buttonClassName({ variant, size, className })} />;
}
