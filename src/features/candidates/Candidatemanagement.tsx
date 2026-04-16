import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, User, FileText, Trash2, Edit } from "lucide-react";

import { useEffect, useMemo, useState } from "react";
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
  manifesto?: string;
  imageUrl?: string;
}

interface NewCandidate {
  name: string;
  positionId: string;
  party: string;
  manifesto?: string;
}

export default function CandidatesManagement() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCand, setNewCand] = useState<NewCandidate>({
    name: "",
    positionId: "",
    party: "",
    manifesto: "",
  });

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = accessToken || localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [posRes, candRes] = await Promise.all([
        fetch(`${API_URL}/positions`, { credentials: "include", headers: getAuthHeaders() }),
        fetch(`${API_URL}/candidates`, { credentials: "include", headers: getAuthHeaders() }),
      ]);

      if (posRes.ok) {
        const posPayload = await posRes.json() as { success?: boolean; data?: Position[] };
        const list = posPayload.success && Array.isArray(posPayload.data) ? posPayload.data : [];
        setPositions(list.filter((p) => p.id).map((p) => ({ id: p.id!, name: p.name ?? "Unnamed" })));
      }

      if (candRes.ok) {
        const candPayload = await candRes.json() as { success?: boolean; data?: Candidate[] };
        const list = candPayload.success && Array.isArray(candPayload.data) ? candPayload.data : [];
        setCandidates(list.map((c) => ({
          id: c.id,
          name: c.name,
          positionId: c.positionId,
          party: c.party ?? "",
          manifesto: c.manifesto as string | undefined,
          imageUrl: c.imageUrl as string | undefined,
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, accessToken]);

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
      body: JSON.stringify(newCand),
    });

    if (!res.ok) return;

    const payload = await res.json() as { success?: boolean; data?: Candidate };
    const c = payload.success ? payload.data : null;
    if (!c?.id) return;

    setCandidates((prev) => [...prev, {
      id: c.id!,
      name: c.name,
      positionId: c.positionId,
      party: c.party ?? "",
      manifesto: c.manifesto as string | undefined,
      imageUrl: c.imageUrl as string | undefined,
    }]);
    setNewCand({ name: "", positionId: "", party: "", manifesto: "" });
    setShowAddForm(false);
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
        manifesto: editing.manifesto,
      }),
    });
    if (!res.ok) return;

    setCandidates((prev) =>
      prev.map((c) => (c.id === editing.id ? editing : c))
    );
    setEditing(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Candidates Management</h1>
          <p className="text-sm text-muted-foreground">Manage election candidates</p>
        </div>
        <Badge variant="secondary">Admin Panel</Badge>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel' : '+ Add Candidate'}
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create New Candidate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name *</label>
                <Input 
                  placeholder="Candidate name" 
                  value={newCand.name} 
                  onChange={(e) => setNewCand({ ...newCand, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Party *</label>
                <Input 
                  placeholder="Political party" 
                  value={newCand.party} 
                  onChange={(e) => setNewCand({ ...newCand, party: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Position *</label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3"
                value={newCand.positionId} 
                onChange={(e) => setNewCand({ ...newCand, positionId: e.target.value })}
              >
                <option value="">Select Position</option>
                {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Manifesto</label>
              <Textarea 
                placeholder="Campaign manifesto..." 
                className="min-h-20"
                value={newCand.manifesto ?? ""} 
                onChange={(e) => setNewCand({ ...newCand, manifesto: e.target.value })} 
              />
            </div>
            <Button onClick={createCandidate} className="w-full">Create Candidate</Button>
          </CardContent>
        </Card>
      )}

      {candidates.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No candidates found. Create one to get started.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((candidate) => (
            <Card key={candidate.id} className="overflow-hidden">
              {candidate.imageUrl && (
                <div className="h-32 bg-secondary overflow-hidden">
                  <img 
                    src={candidate.imageUrl} 
                    alt={candidate.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{candidate.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{candidate.party || "Independent"}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {positionNameById[candidate.positionId] ?? "Unknown"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.manifesto && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{candidate.manifesto}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setEditing(candidate)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => deleteCandidate(candidate.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Candidate</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Party</label>
                <Input 
                  value={editing.party} 
                  onChange={(e) => setEditing({ ...editing, party: e.target.value })} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Position</label>
                <select 
                  className="w-full h-10 rounded-md border border-input bg-background px-3"
                  value={editing.positionId} 
                  onChange={(e) => setEditing({ ...editing, positionId: e.target.value })}
                >
                  <option value="">Select Position</option>
                  {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Manifesto</label>
                <Textarea 
                  value={editing.manifesto ?? ""} 
                  onChange={(e) => setEditing({ ...editing, manifesto: e.target.value })} 
                />
              </div>
              <Button onClick={saveEdit} className="w-full">Save Changes</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
