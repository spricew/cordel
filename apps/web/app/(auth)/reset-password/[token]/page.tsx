import { PrimaryInput } from '@/components/ui/PrimaryInput';
import Link from 'next/link';

export default async function ResetPassword({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="flex flex-col w-full h-screen bg-surface-container">
      <section className="flex w-full flex-1 p-space-md pt-0">
        <div className="flex flex-col justify-center items-center w-full h-full rounded-xl bg-white">
          <div className="flex flex-col max-w-115 gap-y-space-md">
            <header>
              <h1 className="text-headline-lg text-on-surface">Restablecer contraseña</h1>
              <p className="text-body-lg text-muted">
                Escribe tu nueva contraseña para volver a entrar.
              </p>
            </header>

            <form className="flex flex-col gap-y-space-sm">
              <PrimaryInput
                label="Nueva contraseña"
                type="password"
                id="new-password"
                placeholder="********"
              />
              <PrimaryInput
                label="Confirmar contraseña"
                type="password"
                id="confirm-password"
                placeholder="********"
              />
              <button className="w-full px-space-md py-space-sm rounded-full bg-action text-label-xl text-on-primary">
                Guardar contraseña
              </button>
            </form>

            <Link
              href="/login"
              className="self-end text-label-md text-action underline-offset-4 transition-colors hover:underline"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
