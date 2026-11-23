import { IconSearch } from '@tabler/icons-react';
import type { ComponentProps } from 'react';

export type SearchFieldProps = ComponentProps<'input'>;

/**
 * Campo de búsqueda de Cordel.
 *
 * Mantiene la forma de cápsula del sistema y delega el estado al consumidor:
 * el `value` y el `onChange` llegan como props nativas de <input>.
 */
export function SearchField({ className, ...props }: SearchFieldProps) {
  return (
    <div
      className={[
        'flex h-10 items-center gap-2 rounded-full border border-input-border bg-surface px-3.5',
        'text-muted transition-colors focus-within:border-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <IconSearch aria-hidden="true" className="h-4 w-4 shrink-0" stroke={1.5} />
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent text-body-md text-primary outline-none placeholder:text-placeholder"
        {...props}
      />
    </div>
  );
}
