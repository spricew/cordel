import { PrimaryInput } from '@components/ui/PrimaryInput';

export default function Register() {
  return (
    <div className="flex flex-col w-full h-screen">
      <div className="absolute inset-0 -z-10 w-full h-full bg-black/10 mask-l-from-0"></div>
      <div className="absolute inset-0 -z-50">
        <img src={'images/register-bg.jpg'} className="w-full h-full object-cover" />
      </div>

      <nav className="flex justify-between items-center w-full h-16 px-space-xl">
        <span className="text-headline-lg">Cordel</span>
        <ul className="flex gap-x-gutter text-label-xl">
          <li>
            <a href="">Nosotros</a>
          </li>
          <li>
            <a href="">Legal</a>
          </li>
          <li>
            <a href="">Políticas</a>
          </li>
        </ul>
      </nav>

      <div className="w-full flex-1 flex items-center justify-center">
        <div className="grid grid-cols-[1fr_600px] w-350 h-full justify-center items-center px-space-lg pb-space-md pt-0">
          <div className="flex justify-center pt-30 h-full">
            <div className="flex flex-col gap-y-space-sm max-w-md">
              <p className="text-label-lg text-on-primary-fixed">CORDEL MULTI TENANCY</p>
              <p className="text-display-lg">
                Retoma tu ritmo de trabajo con serenidad y claridad.
              </p>
              <p className="text-body-lg text-on-primary-fixed-variant">
                Un santuario digital concebido para disipar el ruido cognitivo y desplegar tu
                pensamiento más profundo.
              </p>
            </div>
          </div>

          {/* Login content */}
          <div className="relative flex items-center justify-center w-full h-full overflow-clip z-0">
            <div className="glass-surface absolute inset-0 z-40"></div>
            <form className="flex flex-col gap-y-space-md w-115 z-100">
              <header>
                <span className="text-headline-lg">Crear cuenta</span>
                <p className="text-body-lg text-muted/90">
                  Potencia la productividad de tu empresa ahora mismo
                </p>
              </header>
              <div className="flex flex-col gap-y-space-xs">
                <PrimaryInput label="Nombre" type="text" id="name" placeholder="@username" />
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
                <PrimaryInput
                  label="Confirmar contraseña"
                  type="password"
                  id="confirm-password"
                  placeholder="********"
                />
              </div>

              <div className='flex flex-col gap-y-space-sm'>
                <button className="w-full px-space-md py-space-sm rounded-full bg-action text-label-xl text-on-primary">
                  Crear cuenta
                </button>

                <button className="w-full px-space-md py-space-sm rounded-full text-label-lg text-on-surface-variant">
                  Ya tengo cuenta
                </button>

                <p className="text-body-sm text-center text-muted">
                  Al crear tu cuenta estás aceptando todos nuestros <a>Términos y condiciones</a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
