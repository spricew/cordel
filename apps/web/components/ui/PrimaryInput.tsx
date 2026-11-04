import type { ComponentProps, ReactNode } from 'react';

/**
 * Hereda todas las props nativas de <input> (type, name, value, onChange,
 * required, autoComplete, ref, aria-*, ...) para no redeclarar nada a mano.
 *
 * Si se pasa `label`, `id` es obligatorio: el <label> se asocia mediante htmlFor.
 */
export type PrimaryInputProps = ComponentProps<'input'> &
  ({ label: ReactNode; id: string } | { label?: undefined });

/**
 * Input de texto base de Cordel, con label opcional.
 *
 * Se renderiza como hermano del <input>, así que el espaciado lo controla el
 * contenedor (por ejemplo, un `flex flex-col` con `gap-y-*`).
 *
 * Nota sobre estilos: `className` se concatena al final, pero en Tailwind el
 * orden del atributo no resuelve conflictos; gana la regla que aparezca después
 * en el CSS compilado. Úsalo para estilos adicionales, no para sobrescribir los base.
 */
export function PrimaryInput({ label, id, className = '', ...props }: PrimaryInputProps) {
  return (
    <>
      {label != null && (
        <label htmlFor={id} className="text-label-lg">
          {label}
        </label>
      )}
      <input
        id={id}
        {...props}
        className={`w-full px-3 py-2.5 mb-space-xs rounded-full border border-input-border bg-panel text-on-surface 
          transition-colors focus-visible:border-action aria-invalid:border-error 
          disabled:cursor-not-allowed disabled:opacity-60 outline-none ${className}`}
      />
    </>
  );
}
