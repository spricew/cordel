export function Navbar() {
  return (
    <nav className="flex justify-between items-center w-full h-14 px-space-xl">
      <a href="/">
        <span className="text-headline-lg">Cordel</span>
      </a>
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
  );
}
