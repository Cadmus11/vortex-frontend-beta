
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import Toast from "@/components/ui/toast";
import { API_URL } from "../../config/api";
import { useUser } from "@clerk/clerk-react";

interface Candidate {
  id: string;
  name: string;
  party: string;
  slogan?: string;
  color?: string;
}

interface Position {
  id: string;
  name: string;
  electionId?: string;
}

interface PositionResponse {
  id?: string;
  positionId?: string;
  name?: string;
  positionName?: string;
  electionId?: string;
}

interface VotePayload {
  clerkId?: string;
  electionId: string;
  positionId: string;
  candidateId: string;
}

function VotingPanel() {
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const [activeElectionId, setActiveElectionId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candsByPos, setCandsByPos] = useState<Record<string, Candidate[]>>({});
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<{ open: boolean; title?: string; message?: string; variant?: 'success'|'info'|'warning'|'error' }>({ open: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const electionsRes = await fetch(`${API_URL}/elections`, {
          credentials: 'include',
          headers: clerkUser?.id ? { 'x-clerk-user-id': clerkUser.id } : {},
        });
        if (electionsRes.ok) {
          const electionsPayload = await electionsRes.json();
          const elections = electionsPayload?.success && Array.isArray(electionsPayload.data) ? electionsPayload.data : [];
          const active = elections.find((e: { status?: string }) => e.status === 'active') || elections[0];
          if (mounted && active?.id) setActiveElectionId(active.id);
        }
        const resPos = await fetch(`${API_URL}/positions`, {
          credentials: 'include',
          headers: clerkUser?.id ? { 'x-clerk-user-id': clerkUser.id } : {},
        });
        if (resPos.ok) {
          const posRes = await resPos.json();
          if (!mounted || !posRes.success) return;
          const positionsList: Position[] = posRes.data.map((p: PositionResponse) => ({ 
            id: p.id ?? p.positionId ?? p.name ?? '', 
            name: p.name ?? p.positionName ?? '',
            electionId: p.electionId,
          }));
          setPositions(positionsList);
          const fetches = positionsList.map(p => fetch(`${API_URL}/candidates/${p.id}`, {
            credentials: 'include',
            headers: clerkUser?.id ? { 'x-clerk-user-id': clerkUser.id } : {},
          }).then(async r => {
            if (!r.ok) return [];
            const data = await r.json();
            return data.success ? data.data : [];
          }));
          const results = await Promise.all(fetches);
          const m: Record<string, Candidate[]> = {};
          positionsList.forEach((p, idx) => {
            m[p.id] = results[idx] as Candidate[] ?? [];
          });
          if (mounted) setCandsByPos(m);
        }
      } catch {
        // ignore for lightweight demo
      }
    })();
    return () => { mounted = false; };
  }, [clerkUser?.id]);

  const selectCandidate = (posId: string, candId: string) => {
    setSelected(prev => ({ ...prev, [posId]: candId }));
  };

  const castVote = async (posId: string) => {
    const candidateId = selected[posId];
    if (!candidateId || !activeElectionId || !user?.clerkId) return;
    const payload: VotePayload = {
      clerkId: user.clerkId,
      electionId: activeElectionId,
      positionId: posId,
      candidateId,
    };
    try {
      const res = await fetch(`${API_URL}/votes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          ...(clerkUser?.id ? { 'x-clerk-user-id': clerkUser.id } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSelected(prev => ({ ...prev, [posId]: null }));
        setToast({ open: true, title: 'Vote Cast', message: 'Your vote has been recorded.', variant: 'success' });
      } else {
        setToast({ open: true, title: 'Vote Failed', message: 'Could not cast vote. Try again.', variant: 'error' });
      }
    } catch {
      setToast({ open: true, title: 'Vote Error', message: 'Network error. Please retry.', variant: 'error' });
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial' }} className="min-h-screen bg-linear-to-br from-[#0b1022] via-[#1e1b44] to-[#0b1022] text-white">
      <Toast open={toast.open} onClose={() => setToast({ open: false })} title={toast.title} message={toast.message} variant={toast.variant} />
      <div className="flex justify-between p-4 items-center">
        <h1 className="text-lg capitalize flex items-center gap-2">
          <Check className="ring-1 rounded-full p-2 text-green-400" /> Voting Panel
        </h1>
        <div className="flex gap-4 items-center">
          {Object.values(selected).some(v => v) && <Badge className="px bg-emerald-500">selected</Badge>}
         
        </div>
      </div>

      <div className="flex flex-wrap justify-center items-center w-full px-4 pb-8">
        {positions.map((pos) => {
          const candidates = candsByPos[pos.id] ?? [];
          const currentlySelected = selected[pos.id] ?? null;
          return (
            <div key={pos.id} className="w-full md:w-1/2 lg:w-1/3 p-2">
              <h3 className="text-center font-semibold mb-2">{pos.name}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidates.map((c) => {
                  const isActive = currentlySelected === c.id;
                  return (
                    <Card key={c.id} className={cn("p-4 border rounded-md cursor-pointer bg-white/10 backdrop-blur-md border-white/20", isActive ? 'border-green-500 border-4' : '')} onClick={() => selectCandidate(pos.id, c.id)}>
                      <CardTitle className="text-center">{c.name}</CardTitle>
                      <CardContent className="text-center text-sm">{c.party}</CardContent>
                    </Card>
                  );
                })}
              </div>
              <div className="flex justify-center mt-2">
                <Button disabled={!currentlySelected || !activeElectionId} onClick={() => castVote(pos.id)}>Vote for {pos.name}</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VotingPanel;
