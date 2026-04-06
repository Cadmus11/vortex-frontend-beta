import { useEffect, useMemo, useState } from "react";
import { api } from "@/utils/api";

interface Election {
  id: string;
  title?: string;
}

interface CreatePositionFormProps {
  onCreated?: () => void;
}

export default function CreatePositionForm({ onCreated }: CreatePositionFormProps) {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [selectedElection, setSelectedElection] = useState("");
  const [name, setName] = useState("");
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);

  // 🔄 Fetch elections
  useEffect(() => {
    const fetchElections = async () => {
      try {
        const res = await api("/elections", { method: "GET" });

        if (!res.ok) throw new Error("Failed to fetch elections");

        const data = (await res.json()) as Election[];
        setElections(Array.isArray(data) ? data : []);
      } catch {
        setMessage("Failed to load elections.");
      } finally {
        setFetching(false);
      }
    };

    fetchElections();
  }, []);

  // ✅ Validation
  const canSubmit = useMemo(() => {
    return (
      name.trim().length >= 2 &&
      selectedElection.length > 0 &&
      Number.isInteger(candidateCount) &&
      candidateCount >= 0
    );
  }, [name, selectedElection, candidateCount]);

  // 🚀 Submit
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!canSubmit) {
      setMessage("Fill all fields correctly.");
      return;
    }

    setLoading(true);

    try {
      const res = await api("/positions", {
        method: "POST",
        body: JSON.stringify({
          position: name.trim(),
          electionId: selectedElection,
          candidateCount,
        }),
      });

      let data: { error?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        // Unable to parse JSON
      }

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create position");
      }

      // ✅ Reset form
      setMessage("✅ Position created successfully.");
      setName("");
      setCandidateCount(0);
      setSelectedElection("");

      // ✅ Notify parent to refresh list
      onCreated?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error.";
      setMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 shadow-sm"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Create Position
      </h2>

      {/* Election Select */}
      <div className="space-y-1">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Election
        </label>

        <select
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          value={selectedElection}
          onChange={(e) => setSelectedElection(e.target.value)}
          disabled={fetching}
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

      {/* Position Name */}
      <div className="space-y-1">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Position Name
        </label>

        <input
          type="text"
          placeholder="e.g. Chief Justice"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Candidate Count */}
      <div className="space-y-1">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Candidate Count
        </label>

        <input
          type="number"
          min={0}
          placeholder="0"
          className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          value={candidateCount}
          onChange={(e) => {
            const value = e.target.value;
            setCandidateCount(value === "" ? 0 : Number(value));
          }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black px-4 py-2 text-sm font-medium transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Position"}
      </button>

      {/* Message */}
      {message && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {message}
        </p>
      )}
    </form>
  );
}