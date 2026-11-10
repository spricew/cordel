import { LoginForm } from './LoginForm';

export default function Login() {
  return (
    <div className="flex flex-col w-full h-screen">
      <section className="flex w-full flex-1 p-space-md pt-0">
        <div className="flex flex-col justify-center items-center w-full h-full rounded-xl bg-white border border-border">
          <div className="flex flex-col max-w-115 gap-y-space-md">
            <header>
              <h1 className="text-headline-lg text-on-surface">Iniciar sesión</h1>
              <p className="text-body-lg text-muted">
                Potencia la productividad de tu empresa ahora mismo.
              </p>
            </header>

            <LoginForm />
          </div>
        </div>
      </section>
    </div>
  );
}
