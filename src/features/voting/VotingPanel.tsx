
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { Check, Vote, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/toast";
import { API_URL } from "../../config/api";

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
  electionId: string;
  positionId: string;
  candidateId: string;
}

interface ActiveElection {
  id: string;
  title: string;
  status: string;
}

function VotingPanel() {
  const { user, accessToken } = useAuth();
  const [activeElectionId, setActiveElectionId] = useState<string | null>(null);
  const [activeElection, setActiveElection] = useState<ActiveElection | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candsByPos, setCandsByPos] = useState<Record<string, Candidate[]>>({});
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ open: boolean; title?: string; message?: string; variant?: 'success'|'info'|'warning'|'error' }>({ open: false });

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const electionsRes = await fetch(`${API_URL}/elections`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        if (electionsRes.ok && mounted) {
          const electionsPayload = await electionsRes.json();
          const elections: ActiveElection[] = electionsPayload?.success && Array.isArray(electionsPayload.data) ? electionsPayload.data : [];
          const active = elections.find((e: { status?: string }) => e.status === 'active') || elections[0];
          if (mounted && active?.id) {
            setActiveElectionId(active.id);
            setActiveElection(active);
            
            const voteRes = await fetch(`${API_URL}/votes/check?electionId=${active.id}`, {
              credentials: 'include',
              headers: getAuthHeaders(),
            });
            if (voteRes.ok && mounted) {
              const voteData = await voteRes.json();
              if (voteData.hasVoted) {
                setHasVoted(true);
              }
            }
          }
        }
        
        const resPos = await fetch(`${API_URL}/positions`, {
          credentials: 'include',
          headers: getAuthHeaders(),
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
            headers: getAuthHeaders(),
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
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [accessToken]);

  const selectCandidate = (posId: string, candId: string) => {
    setSelected(prev => ({ ...prev, [posId]: candId }));
  };

  const castVote = async (posId: string) => {
    const candidateId = selected[posId];
    if (!candidateId || !activeElectionId || !user) return;
    const payload: VotePayload = {
      electionId: activeElectionId,
      positionId: posId,
      candidateId,
    };
    try {
      const res = await fetch(`${API_URL}/votes`, {
        method: 'POST',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSelected(prev => ({ ...prev, [posId]: null }));
        setToast({ open: true, title: 'Vote Cast', message: 'Your vote has been recorded.', variant: 'success' });
        
        const voteRes = await fetch(`${API_URL}/votes/check?electionId=${activeElectionId}`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        if (voteRes.ok) {
          const voteData = await voteRes.json();
          if (voteData.hasVoted) {
            setHasVoted(true);
          }
        }
      } else {
        setToast({ open: true, title: 'Vote Failed', message: 'Could not cast vote. Try again.', variant: 'error' });
      }
    } catch {
      setToast({ open: true, title: 'Vote Error', message: 'Network error. Please retry.', variant: 'error' });
    }
  };

  if (hasVoted) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 md:p-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <div className="w-96 h-96 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-600/10 blur-3xl mx-auto" />
          </div>

          <Card className="relative w-96 bg-gradient-to-br backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-purple-400 to-purple-500" />
            
            <div className="text-center p-6 pb-2">
              <div className="mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center shadow-lg">
                  <Vote className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                Vote Submitted!
              </CardTitle>
              <p className="text-sm text-zinc-500">Your vote has been recorded</p>
            </div>

            <CardContent className="space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-semibold text-purple-700 dark:text-purple-300">
                    Successfully Voted
                  </span>
                </div>
                {activeElection && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    for <span className="font-medium">{activeElection.title}</span>
                  </p>
                )}
              </div>

              <div className="bg-white/50 dark:bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-500 mb-2 text-center">
                  Voter Information
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Name</span>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {user?.username || 'User'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-500">Status</span>
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs">
                      Verified Voter
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-zinc-400">
                You cannot vote again for this election.
                <br />
                Thank you for participating!
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-[#0b1022] via-[#1e1b44] to-[#0b1022] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">Loading election...</p>
        </div>
      </div>
    );
  }

  if (!activeElectionId) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-[#0b1022] via-[#1e1b44] to-[#0b1022] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-2">No Active Election</p>
          <p className="text-white/50">Please wait for an election to start.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial' }} className="min-h-screen bg-linear-to-br from-[#0b1022] via-[#1e1b44] to-[#0b1022] text-white">
      <Toast open={toast.open} onClose={() => setToast({ open: false })} title={toast.title} message={toast.message} variant={toast.variant} />
      <div className="flex justify-between p-4 items-center">
        <h1 className="text-lg capitalize flex items-center gap-2">
          <Check className="ring-1 rounded-full p-2 text-green-400" /> Voting Panel
        </h1>
        <div className="flex gap-4 items-center">
          {activeElection && (
            <Badge variant="outline" className="text-white border-white/30">
              {activeElection.title}
            </Badge>
          )}
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
