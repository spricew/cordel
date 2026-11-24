import { LoginForm } from './LoginForm';

export default async function Login({ searchParams }: PageProps<'/login'>) {
  const { registered } = await searchParams;

  return (
    <div className="flex flex-col w-full h-screen">
      <section className="flex w-full flex-1 p-space-md pt-0">
        <div className="flex flex-col justify-center items-center w-full h-full rounded-xl bg-white border border-border">
          <div className="flex flex-col max-w-115 gap-y-space-md rise-in">
            <header>
              <h1 className="text-headline-lg text-primary">Iniciar sesión</h1>
              <p className="text-body-lg text-muted">
                Potencia la productividad de tu empresa ahora mismo.
              </p>
            </header>

            <LoginForm justRegistered={registered === '1'} />
          </div>
        </div>
      </section>
    </div>
  );
}
