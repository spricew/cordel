'use client';
import { useState, type SubmitEvent } from 'react';

interface TeamItem {
  id: string;
  name: string;
}

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = (): void => {
    setName('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const trimmed: string = name.trim();
    if (!trimmed) {
      setError('El nombre es obligatorio');
      return;
    }
    const newTeam: TeamItem = {
      id: `${Date.now()}-${teams.length}`,
      name: trimmed,
    };
    setTeams((prev: TeamItem[]): TeamItem[] => [...prev, newTeam]);
    setName('');
    setError(null);
    setIsModalOpen(false);
  };

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Equipos</h1>

      {teams.length === 0 ? (
        <p className="text-sm text-gray-500">Aún no hay equipos. Crea el primero.</p>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {teams.map((team: TeamItem) => (
            <div
              key={team.id}
              className="aspect-square w-60 rounded-2xl border border-black bg-white p-4"
            >
              {team.name}
            </div>
          ))}
        </div>
      )}
      <>
        {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50">
            <div className="flex h-fit w-90 flex-col gap-2 rounded-3xl bg-white p-6">
              <span className="text-2xl font-semibold tracking-tight">Crear equipo</span>

              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Nombre del equipo"
                  className="h-10 w-full rounded-md border border-gray-300 p-2"
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  value={name}
                  maxLength={50}
                  required
                  aria-label="Nombre del equipo"
                  autoFocus
                />
                {error !== null && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="h-10 w-full rounded-md bg-black text-white">
                  Crear
                </button>
              </form>
            </div>
          </div>
        )}
        <button
          onClick={handleOpen}
          className="h-fit w-fit rounded-full bg-black px-4 py-2 text-white"
        >
          Crear equipo
        </button>
      </>
    </div>
  );
}
