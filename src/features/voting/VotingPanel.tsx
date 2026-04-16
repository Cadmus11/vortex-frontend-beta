import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Vote, Loader2, UserCheck, Shield, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Toast from "@/components/ui/toast";
import { API_URL } from "../../config/api";
import FaceGate from "@/features/face/FaceGate";

interface Candidate {
  id: string;
  name: string;
  party?: string;
  manifesto?: string;
  imageUrl?: string;
}

interface Position {
  id: string;
  name: string;
  electionId?: string;
  order?: number;
}

interface VotePayload {
  electionId: string;
  positionId: string;
  candidateId: string;
}

interface ActiveElection {
  id: string;
  title?: string;
  name?: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

function VotingPanel() {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [activeElection, setActiveElection] = useState<ActiveElection | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candsByPos, setCandsByPos] = useState<Record<string, Candidate[]>>({});
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [faceVerified, setFaceVerified] = useState(false);
  const [castingVote, setCastingVote] = useState(false);
  const [toast, setToast] = useState({ open: false, title: '', message: '', variant: 'success' as 'success' | 'info' | 'warning' | 'error' });

  const isVoter = user?.role === 'voter';
  const needsFaceVerify = isVoter && !user?.isVerified && !faceVerified;

  const getAuthHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = accessToken || localStorage.getItem('accessToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    if (user?.isVerified) {
      setFaceVerified(true);
    }
  }, [user?.isVerified]);

  useEffect(() => {
    if (!authLoading) {
      fetchElectionData();
    }
  }, [authLoading, accessToken]);

  const fetchElectionData = async () => {
    setIsLoading(true);
    try {
      const electionsRes = await fetch(`${API_URL}/elections`, {
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (electionsRes.ok) {
        const electionsData = await electionsRes.json() as { success?: boolean; data?: ActiveElection[] };
        const elections: ActiveElection[] = electionsData?.success && Array.isArray(electionsData.data) 
          ? electionsData.data 
          : [];
        
        const active = elections.find((e) => e.status === 'active') || elections[0];
        
        if (active?.id) {
          setActiveElection(active);

          const voteRes = await fetch(`${API_URL}/votes/check?electionId=${active.id}`, {
            credentials: 'include',
            headers: getAuthHeaders(),
          });
          if (voteRes.ok) {
            const voteData = await voteRes.json();
            if (voteData.hasVoted) {
              setHasVoted(true);
            }
          }

          const posRes = await fetch(`${API_URL}/positions`, {
            credentials: 'include',
            headers: getAuthHeaders(),
          });

          if (posRes.ok) {
            const posData = await posRes.json() as { success?: boolean; data?: Position[] };
            const positionsList: Position[] = (posData?.success && Array.isArray(posData.data))
              ? posData.data.filter((p) => p.electionId === active.id)
              : [];
            
            const sorted = [...positionsList].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setPositions(sorted);

            const candRes = await fetch(`${API_URL}/candidates`, {
              credentials: 'include',
              headers: getAuthHeaders(),
            });

            if (candRes.ok) {
              const candData = await candRes.json() as { success?: boolean; data?: Candidate[] };
              const allCandidates: Candidate[] = candData?.success && Array.isArray(candData.data)
                ? candData.data
                : [];

              const mapped: Record<string, Candidate[]> = {};
              sorted.forEach((pos) => {
                mapped[pos.id] = allCandidates.filter((c) => c.id === pos.id || (c as unknown as { positionId?: string }).positionId === pos.id);
              });
              setCandsByPos(mapped);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch election data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCandidate = (posId: string, candId: string) => {
    setSelected((prev) => ({ ...prev, [posId]: candId }));
  };

  const handleFaceVerified = () => {
    setFaceVerified(true);
    setShowFaceVerify(false);
  };

  const handleSubmitVotes = async () => {
    if (!activeElection?.id || !user) return;

    if (needsFaceVerify) {
      setShowFaceVerify(true);
      return;
    }

    setCastingVote(true);
    const positionIds = Object.keys(selected).filter((posId) => selected[posId]);

    for (const posId of positionIds) {
      const candidateId = selected[posId];
      if (!candidateId) continue;

      const payload: VotePayload = {
        electionId: activeElection.id,
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

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setToast({ open: true, title: 'Vote Error', message: errData?.error || 'Failed to cast vote', variant: 'error' });
          break;
        }
      } catch {
        setToast({ open: true, title: 'Network Error', message: 'Please check your connection', variant: 'error' });
        break;
      }
    }

    setHasVoted(true);
    setCastingVote(false);
  };

  if (showFaceVerify) {
    return (
      <FaceGate onVerified={handleFaceVerified} />
    );
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="w-full max-w-md bg-gradient-to-br from-success/10 to-accent/10 border-success/30">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-success" />
            </div>
            <CardTitle className="text-2xl">Vote Submitted!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Your vote for <span className="font-semibold text-foreground">{activeElection?.title || activeElection?.name}</span> has been recorded.
            </p>
            <div className="bg-card p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">You voted for:</p>
              {Object.entries(selected).map(([posId, candId]) => {
                const pos = positions.find((p) => p.id === posId);
                const cand = candsByPos[posId]?.find((c) => c.id === candId);
                if (!cand) return null;
                return (
                  <p key={posId} className="font-medium">
                    {cand.name} ({pos?.name})
                  </p>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              Thank you for participating in the election!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading election...</p>
        </div>
      </div>
    );
  }

  if (!activeElection?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>No Active Election</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              There is no active election at the moment. Please wait for an election to start.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPositions = positions.length;
  const votedPositions = Object.values(selected).filter(Boolean).length;
  const allPositionsVoted = votedPositions === totalPositions && totalPositions > 0;

  return (
    <div className="min-h-screen bg-background">
      <Toast open={toast.open} onClose={() => setToast({ open: false })} title={toast.title} message={toast.message} variant={toast.variant} />

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Vote className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{activeElection.title || activeElection.name}</h1>
                <p className="text-sm text-muted-foreground">Cast your vote</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
              Active
            </Badge>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {positions.slice(0, 4).map((pos) => (
                  <div
                    key={pos.id}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                      selected[pos.id]
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-muted-foreground border-background"
                    )}
                  >
                    {selected[pos.id] ? <Check className="w-4 h-4" /> : (pos.order ?? 0) + 1}
                  </div>
                ))}
                {positions.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                    +{positions.length - 4}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {votedPositions}/{totalPositions} positions
              </span>
            </div>

            {needsFaceVerify && (
              <Button size="sm" variant="outline" onClick={() => setShowFaceVerify(true)}>
                <Shield className="w-4 h-4 mr-1" />
                Verify Identity
              </Button>
            )}

            <Button
              onClick={handleSubmitVotes}
              disabled={!allPositionsVoted || castingVote || needsFaceVerify}
            >
              {castingVote ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Submit Vote
                </>
              )}
            </Button>
          </div>

          {needsFaceVerify && (
            <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-warning shrink-0" />
              <p className="text-sm text-warning">
                Please verify your identity before voting
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {positions.map((pos) => {
          const candidates = candsByPos[pos.id] ?? [];
          const currentlySelected = selected[pos.id];

          return (
            <Card key={pos.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                      {(pos.order ?? 0) + 1}
                    </span>
                    {pos.name}
                  </CardTitle>
                  {currentlySelected && (
                    <Badge className="bg-success/20 text-success border-success/30">
                      Selected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {candidates.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No candidates for this position</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {candidates.map((cand) => {
                      const isSelected = currentlySelected === cand.id;
                      return (
                        <div
                          key={cand.id}
                          onClick={() => selectCandidate(pos.id, cand.id)}
                          className={cn(
                            "relative p-4 rounded-lg border-2 cursor-pointer transition-all",
                            isSelected
                              ? "border-success bg-success/5"
                              : "border-border hover:border-primary/50 hover:bg-muted/50"
                          )}
                        >
                          {cand.imageUrl && (
                            <img
                              src={cand.imageUrl}
                              alt={cand.name}
                              className="w-full h-24 object-cover rounded-md mb-3"
                            />
                          )}
                          <div className="text-center">
                            <p className="font-semibold">{cand.name}</p>
                            {cand.party && (
                              <p className="text-sm text-muted-foreground">{cand.party}</p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default VotingPanel;
