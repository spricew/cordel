export default function Organizations() {
  return (
    <div className="grid grid-cols-[150px_1fr] w-full h-full">
      <aside className="flex flex-col items-center h-full py-space-xl">Home</aside>
      <section className="w-full h-full p-space-sm pt-0">
        <div className="flex flex-col gap-space-lg w-full h-full p-15 rounded-xl border border-border bg-panel">
          <h1 className="text-display-lg">Organizaciones</h1>

          <div className="grid grid-cols-3 w-full bg-amber-200">
            <div className="flex flex-col gap-space-md min-h-125 p-margin bg-panel rounded-xl border border-border">
              <div className="w-36 aspect-square rounded-lg bg-amber-100"></div>
              <span className="text-headline-lg">Ultra Hogar</span>

              <div className="flex flex-col gap-space-sm flex-1">
                <div className="flex gap-space-sm">
                  <div className="w-6 aspect-square bg-amber-100"></div>
                  <span className="text-label-xl">www.ultrahogar.com</span>
                </div>

                <div className="flex gap-space-sm">
                  <div className="w-6 aspect-square bg-amber-100"></div>
                  <span className="text-label-xl">Calle 23 x 32 Mérida, Yucatán</span>
                </div>
              </div>

              <footer className="flex justify-between items-center">
                <div className="text-label-xl px-3 py-2.5 bg-amber-100 rounded">Administrador</div>
                <div className="text-label-xl">50+ miembros</div>
              </footer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
