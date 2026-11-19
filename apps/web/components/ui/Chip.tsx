import type { ComponentProps } from 'react';

/**
 * Tonos del chip. Los tres estados (`in-review`, `active`, `queued`) reproducen
 * el componente Chip de Figma (nodo 76:25); `neutral` es la variante de marca
 * que usa la landing para su insignia del hero.
 */
export type ChipTone = 'neutral' | 'in-review' | 'active' | 'queued';

type ToneDefinition = {
  /** Clases visuales completas del tono. */
  className: string;
  /** Color del punto de estado. */
  dotClassName: string;
  /** Etiqueta por defecto cuando no se pasan children. */
  label: string | null;
};

const TONES: Record<ChipTone, ToneDefinition> = {
  neutral: {
    className:
      'border-tertiary-fixed-dim bg-tertiary-fixed/60 px-3 py-1 text-label-md text-on-tertiary-fixed-variant',
    dotClassName: 'bg-attention',
    label: null,
  },
  'in-review': {
    className:
      'whitespace-nowrap border-chip-in-review-border bg-chip-in-review px-space-sm py-space-xs text-label-sm text-chip-in-review-text',
    dotClassName: 'bg-chip-in-review-text',
    label: 'En revisión',
  },
  active: {
    className:
      'whitespace-nowrap border-chip-active-border bg-chip-active px-space-sm py-space-xs text-label-sm text-chip-active-text',
    dotClassName: 'bg-chip-active-text',
    label: 'Activo',
  },
  queued: {
    className:
      'whitespace-nowrap border-chip-queued-border bg-chip-queued px-space-sm py-space-xs text-label-sm text-chip-queued-text',
    dotClassName: 'bg-chip-queued-text',
    label: 'En cola',
  },
};

export type ChipProps = ComponentProps<'span'> & {
  /** Tono visual y, si no se pasan children, texto por defecto. */
  tone?: ChipTone;
  /** Muestra un punto de estado a la izquierda del texto. */
  dot?: boolean;
};

/**
 * Chip de estado en cápsula.
 *
 * Sigue el componente Chip de Figma: fondo tintado, borde suave del mismo tono
 * y tipografía `label-sm`. Sin `children` usa la etiqueta del estado; con
 * `children` acepta copy propio, como la insignia del hero.
 */
export function Chip({
  tone = 'neutral',
  dot = false,
  children,
  className,
  ...props
}: ChipProps) {
  const { className: toneClassName, dotClassName, label } = TONES[tone];

  return (
    <span
      {...props}
      className={[
        'inline-flex items-center justify-center gap-space-xs rounded-full border text-center',
        toneClassName,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`}
        />
      ) : null}
      {children ?? label}
    </span>
  );
}
