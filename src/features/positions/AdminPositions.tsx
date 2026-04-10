import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import CreatePositionForm from './CreatePositionForm';
import Menu from '@/components/custom/Menu';

interface Position {
  id?: string;
  name?: string;
  positionId?: string;
  positionName?: string;
  position?: string;
  candidateCount?: number;
  order?: number;
}

export default function AdminPositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await api('/positions', { method: 'GET' });

      if (!res.ok) {
        throw new Error('Failed to fetch positions');
      }

      const payload = (await res.json()) as { success?: boolean; data?: Position[] };
      setPositions(payload.success && Array.isArray(payload.data) ? payload.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center p-2">
        <h3 className="text-lg font-semibold">Positions (Admin)</h3>
        <Menu />
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <CreatePositionForm onCreated={fetchPositions} />

        <div className="grid gap-2 flex-1">
          {loading && <p>Loading positions...</p>}

          {error && <p className="text-red-500">{error}</p>}

          {!loading && positions.length === 0 && (
            <p className="text-gray-500">No positions found.</p>
          )}

          {positions.map((p, index) => (
            <div
              key={p.id ?? p.positionId ?? `position-${index}`}
              className="p-2 border rounded"
            >
              <div className="flex justify-between">
                <span>{p.name ?? p.positionName ?? p.position}</span>
                <span className="text-sm text-gray-500">
                  order: {p.order ?? p.candidateCount ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}