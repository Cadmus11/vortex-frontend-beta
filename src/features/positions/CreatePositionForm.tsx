import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface Election {
  id: string;
  title?: string;
}

interface CreatePositionFormProps {
  onCreated?: () => void;
}

export default function CreatePositionForm({ onCreated }: CreatePositionFormProps) {
  const { accessToken } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedElection, setSelectedElection] = useState("");
  const [name, setName] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = accessToken || localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/elections`, {
          method: 'GET',
          credentials: 'include',
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          const payload = (await res.json()) as { success?: boolean; data?: Election[] };
          setElections(payload.success && Array.isArray(payload.data) ? payload.data : []);
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to load elections.' });
      } finally {
        setFetching(false);
      }
    };

    fetchElections();
  }, [accessToken]);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && selectedElection.length > 0;
  }, [name, selectedElection]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!canSubmit) {
      setMessage({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/positions`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: name.trim(),
          electionId: selectedElection,
          order: order,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Failed to create position');
      }

      setMessage({ type: 'success', text: 'Position created successfully!' });
      setName('');
      setOrder(0);
      setSelectedElection('');
      onCreated?.();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Network error.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Election *</label>
        <select
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={selectedElection}
          onChange={(e) => setSelectedElection(e.target.value)}
          disabled={fetching}
          required
        >
          <option value="">
            {fetching ? "Loading elections..." : "Select an election"}
          </option>
          {elections.map((el) => (
            <option key={el.id} value={el.id}>
              {el.title ?? el.id}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Position Name *</label>
        <input
          type="text"
          placeholder="e.g. President, Secretary General"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Display Order</label>
        <input
          type="number"
          min={0}
          placeholder="0"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
        />
      </div>

      {message && (
        <div className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-destructive'}`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Position"}
      </button>
    </form>
  );
}
