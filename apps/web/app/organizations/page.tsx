import { Card } from '@/components/ui/Card';

export default function Organizations() {
  return (
    <div className="grid grid-cols-[150px_1fr] w-full h-full overflow-hidden">
      <aside className="flex flex-col items-center h-full py-space-xl">Home</aside>
      <section className="w-full h-full p-space-sm pt-0 overflow-hidden">
        <div className="flex flex-col w-full h-full rounded-lg border border-border bg-panel overflow-hidden">
          <div className="flex flex-col gap-space-lg flex-1 px-15 py-14 overflow-y-auto scrollbar-calm">
            <h1 className="text-display-lg">Organizaciones</h1>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] content-start gap-space-md w-full">
              <Card />
              <Card />
              <Card />
              <Card />
              <Card />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
