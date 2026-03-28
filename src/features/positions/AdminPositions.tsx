import { useEffect, useState } from 'react';
import { api } from '@/utils/api';
import CreatePositionForm from './CreatePositionForm';

interface Position {
  positionId?: string;
  id?: string;
  positionName?: string;
  position?: string;
  candidateCount?: number;
}

export default function AdminPositions() {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api('/api/positions', { method: 'GET' });
        if (res.ok) {
          const data = await res.json() as Position[];
          setPositions(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Positions (Admin)</h3>
      <CreatePositionForm />
      <div className="grid gap-2">
        {positions.map((p, index) => (
          <div key={p.positionId ?? p.id ?? `position-${index}`} className="p-2 border rounded">
            <div className="flex justify-between">
              <span>{p.positionName ?? p.position}</span>
              <span className="text-sm text-gray-500">{p.candidateCount ?? 0} candidates</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
