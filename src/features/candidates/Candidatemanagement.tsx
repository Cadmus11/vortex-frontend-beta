import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/context/ThemeToggler";
import { useEffect, useMemo, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { useAuth } from "@/context/AuthContext";

interface Position {
  id: string;
  name: string;
}

interface Candidate {
  id: string;
  name: string;
  positionId: string;
  party: string;
}

interface CandidatePayload {
  id: string;
  name: string;
  positionId: string;
  party?: string;
}

interface NewCandidate {
  name: string;
  positionId: string;
  party: string;
}

export default function CandidatesManagement() {
  const { accessToken } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [newCand, setNewCand] = useState<NewCandidate>({
    name: "",
    positionId: "",
    party: "",
  });

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  }, [accessToken]);

  useEffect(() => {
    const load = async () => {
      const [posRes, candRes] = await Promise.all([
        fetch(`${API_URL}/positions`, { credentials: "include", headers: getAuthHeaders() }),
        fetch(`${API_URL}/candidates`, { credentials: "include", headers: getAuthHeaders() }),
      ]);

      if (posRes.ok) {
        const posPayload = await posRes.json() as { success?: boolean; data?: Array<{ id?: string; name?: string }> };
        const list = posPayload.success && Array.isArray(posPayload.data) ? posPayload.data : [];
        setPositions(list.map((p) => ({ id: p.id ?? "", name: p.name ?? "Unnamed Position" })).filter((p) => p.id));
      }

      if (candRes.ok) {
        const candPayload = await candRes.json() as { success?: boolean; data?: CandidatePayload[] };
        const list = candPayload.success && Array.isArray(candPayload.data) ? candPayload.data : [];
        setCandidates(list.map((c) => ({
          id: c.id,
          name: c.name,
          positionId: c.positionId,
          party: c.party ?? "",
        })));
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const positionNameById = useMemo(() => {
    const map: Record<string, string> = {};
    positions.forEach((p) => {
      map[p.id] = p.name;
    });
    return map;
  }, [positions]);

  const createCandidate = async () => {
    if (!newCand.name || !newCand.positionId) return;

    const res = await fetch(`${API_URL}/candidates`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: newCand.name,
        positionId: newCand.positionId,
        party: newCand.party,
      }),
    });

    if (!res.ok) return;

    const payload = await res.json() as { success?: boolean; data?: CandidatePayload };
    const c = payload.success ? payload.data : null;
    if (!c?.id) return;

    setCandidates((prev) => [
      ...prev,
      { id: c.id, name: c.name, positionId: c.positionId, party: c.party ?? "" },
    ]);
    setNewCand({ name: "", positionId: "", party: "" });
  };

  const deleteCandidate = async (id: string) => {
    await fetch(`${API_URL}/candidates/${id}`, { 
      method: "DELETE", 
      credentials: "include",
      headers: getAuthHeaders(),
    });
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const saveEdit = async () => {
    if (!editing) return;
    const res = await fetch(`${API_URL}/candidates/${editing.id}`, {
      method: "PUT",
      credentials: "include",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name: editing.name,
        positionId: editing.positionId,
        party: editing.party,
      }),
    });
    if (!res.ok) return;

    setCandidates((prev) =>
      prev.map((c) => (c.id === editing.id ? editing : c))
    );
    setEditing(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border rounded-md p-4 bg-zinc-50 dark:bg-zinc-900">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold">Create Candidate</h2>
          <ThemeToggle />
        </div>
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <Input placeholder="Name" value={newCand.name} onChange={(e) => setNewCand({ ...newCand, name: e.target.value })} />
          <select className="h-10 rounded-md border px-3 bg-background" value={newCand.positionId} onChange={(e) => setNewCand({ ...newCand, positionId: e.target.value })}>
            <option value="">Select Position</option>
            {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Input placeholder="Party" value={newCand.party} onChange={(e) => setNewCand({ ...newCand, party: e.target.value })} />
        </div>
        <div className="mt-3">
          <Button onClick={createCandidate}>Create Candidate</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {candidates.map((candidate) => (
          <Card key={candidate.id} className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex justify-between">
              <CardTitle>{candidate.name}</CardTitle>
              <Badge>{positionNameById[candidate.positionId] ?? candidate.positionId}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-zinc-500">{candidate.party || "No party"}</p>
              <div className="flex gap-3">
                <Button size="sm" variant="secondary" onClick={() => setEditing({ ...candidate })}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => deleteCandidate(candidate.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
            <DialogDescription>
              Update the candidate information below.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <select className="h-10 rounded-md border px-3 bg-background" value={editing.positionId} onChange={(e) => setEditing({ ...editing, positionId: e.target.value })}>
                <option value="">Select Position</option>
                {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Input value={editing.party} onChange={(e) => setEditing({ ...editing, party: e.target.value })} />
              <Button onClick={saveEdit} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
