import type { ComponentProps } from 'react';

/**
 * Hereda todas las props nativas de <input> (type, name, value, onChange,
 * required, autoComplete, ref, aria-*, ...) para no redeclarar nada a mano.
 */
export type PrimaryInputProps = ComponentProps<'input'>;

/**
 * Input de texto base de Cordel.
 *
 * Nota sobre estilos: `className` se concatena al final, pero en Tailwind el
 * orden del atributo no resuelve conflictos; gana la regla que aparezca después
 * en el CSS compilado. Úsalo para estilos adicionales, no para sobrescribir los base.
 */
export function PrimaryInput({ className = '', ...props }: PrimaryInputProps) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2.5 rounded-full border border-input-border bg-panel text-on-surface 
        transition-colors focus-visible:border-action aria-invalid:border-error 
        disabled:cursor-not-allowed disabled:opacity-60 outline-none ${className}`}
    />
  );
}
