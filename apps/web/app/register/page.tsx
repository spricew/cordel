export default function Register() {
  return (
    <div className="flex flex-col w-full h-screen">
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

        <div className="grid grid-cols-[1fr_500px] w-7xl h-full justify-center items-center p-space-lg pt-0">

          <div className="flex justify-center pt-30 h-full">
            <div className="flex flex-col gap-y-space-sm max-w-md">
              <p className="text-label-lg">CORDEL MULTI TENANCY</p>
              <p className="text-display-lg">
                Retoma tu ritmo de trabajo con serenidad y claridad.
              </p>
              <p className="text-body-lg">
                Un santuario digital concebido para disipar el ruido cognitivo y desplegar tu
                pensamiento más profundo.
              </p>
            </div>
          </div>

          {/* Login content */}
          <div className="w-full h-full rounded-xl bg-white/50 backdrop-blur-2xl"></div>

        </div>
      </div>
    </div>
  );
}
