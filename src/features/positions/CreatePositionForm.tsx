import { useEffect, useMemo, useState } from 'react';
import { api } from '@/utils/api';

interface Election {
  id: string;
  title?: string;
}

const getEnvVar = (key: string, fallback: string): string => {
  const val = (import.meta.env as Record<string, string>)[key];
  return typeof val === 'string' ? val : fallback;
};

export default function CreatePositionForm() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const [name, setName] = useState('');
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);

  const API_BASE = getEnvVar('VITE_API_URL', '/api');

  useEffect(() => {
    const fetchE = async () => {
      try {
        const res = await api(`${API_BASE}/elections`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json() as Election[];
          setElections(Array.isArray(data) ? data : []);
        }
      } catch {
        // ignore
      }
    };
    fetchE();
  }, [API_BASE]);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      selectedElection.length > 0 &&
      Number.isInteger(candidateCount) && candidateCount >= 0
    );
  }, [name, selectedElection, candidateCount]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!canSubmit) {
      setMessage('Please choose an election and enter a position name.');
      return;
    }
    setLoading(true);
    try {
      const res = await api(`${API_BASE}/positions`, {
        method: 'POST',
        body: JSON.stringify({ position: name, electionId: selectedElection, candidateCount }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setMessage('Position created.');
        setName('');
        setCandidateCount(0);
      } else {
        setMessage(data?.error ?? 'Failed to create position');
      }
    } catch {
      setMessage('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 bg-white/5 p-4 rounded" style={{ maxWidth: 420 }}>
      <div>
        <label className="block text-sm font-medium text-gray-200">Election</label>
        <select
          className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100"
          value={selectedElection}
          onChange={e => setSelectedElection(e.target.value)}
        >
          <option value="">Select an election</option>
          {elections.map(e => (
            <option key={e.id} value={e.id}>{e.title ?? e.id}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-200">Position Name</label>
        <input
          type="text"
          className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100"
          placeholder="e.g. Chief Justice"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-200">Candidate Count</label>
        <input
          type="number"
          min={0}
          className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100"
          placeholder="0"
          value={candidateCount}
          onChange={e => setCandidateCount(parseInt(e.target.value, 10) || 0)}
        />
      </div>
      <div>
        <button
          type="submit"
          className="w-full bg-green-600 text-white rounded px-4 py-2 hover:bg-green-500 disabled:opacity-60"
          disabled={!canSubmit || loading}
        >
          {loading ? 'Creating...' : 'Create Position'}
        </button>
      </div>
      {message && <p className="text-sm text-gray-300">{message}</p>}
    </form>
  );
}
