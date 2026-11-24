import { RegisterForm } from './RegisterForm';

export default function Register() {
  return (
    <div className="flex flex-col w-full h-screen">
      <div className="absolute inset-0 -z-10 w-full h-full bg-black/10 mask-l-from-0"></div>
      <div className="absolute inset-0 -z-50">
        <img src={'images/register-bg.jpg'} className="w-full h-full object-cover" />
      </div>

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

          {/* Contenido del registro */}
          <div className="relative flex items-center justify-center w-full h-full overflow-clip z-0">
            <div className="glass-surface absolute inset-0 z-40"></div>
            <RegisterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
