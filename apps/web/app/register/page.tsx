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

      <div className="grid grid-cols-2 w-full flex-1 p-space-lg pt-0">
        <div className="flex justify-center py-54 w-full h-full">
          <div className="flex flex-col">
            <p>CORDEL MULTI TENANCY</p>
            <p>Retoma tu ritmo de trabajo con serenidad y claridad.</p>
            <p>
              Un santuario digital concebido para disipar el ruido cognitivo y desplegar tu
              pensamiento más profundo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
