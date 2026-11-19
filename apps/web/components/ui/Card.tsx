export function Card() {
  return (
    <div className="flex flex-col gap-space-md min-h-115 h-fit p-margin bg-panel rounded-xl border border-border">
      <div className="w-36 aspect-square rounded-lg bg-amber-100"></div>
      <span className="text-headline-lg">Ultra Hogar</span>

      <div className="flex flex-col gap-space-sm flex-1">
        <div className="flex gap-space-sm min-w-0">
          <div className="w-6 aspect-square shrink-0 bg-amber-100"></div>
          <span className="text-label-xl truncate">www.ultrahogar.com</span>
        </div>

        <div className="flex gap-space-sm min-w-0">
          <div className="w-6 aspect-square shrink-0 bg-amber-100"></div>
          <span className="text-label-xl truncate">Calle 23 x 32 Mérida, Yucatán</span>
        </div>
      </div>

      <footer className="flex justify-between items-center">
        <div className="text-label-xl px-3 py-2.5 bg-amber-100 rounded">Administrador</div>
        <div className="text-label-xl">50+ miembros</div>
      </footer>
    </div>
  );
}
