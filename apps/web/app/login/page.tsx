import { Navbar } from '@/components/layout/Navbar';
import { PrimaryInput } from '@/components/ui/PrimaryInput';

export default function Login() {
  return (
    <div className="flex flex-col w-full h-screen bg-surface-container">
      <Navbar />
      <section className="flex w-full flex-1 p-space-md pt-0">
        <div className="flex flex-col justify-center items-center w-full h-full rounded-2xl bg-white">
          <div className="flex flex-col max-w-115 gap-y-space-md">
            <header>
              <h1 className="text-headline-lg text-on-surface">Iniciar sesión</h1>
              <p className="text-body-lg text-muted">
                Potencia la productividad de tu empresa ahora mismo.
              </p>
            </header>

            <form className="flex flex-col gap-y-space-sm">
              <PrimaryInput
                label="Correo electrónico"
                type="email"
                id="email"
                placeholder="example@email.com"
              />
              <PrimaryInput
                label="Contraseña"
                type="password"
                id="password"
                placeholder="********"
              />
              <button className="w-full px-space-md py-space-sm rounded-full bg-action text-label-xl text-on-primary">
                Crear cuenta
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
