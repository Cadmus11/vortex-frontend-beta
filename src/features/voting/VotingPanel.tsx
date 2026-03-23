import Menu from "@/components/custom/Menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/context/ThemeToggler";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import Toast from "@/components/ui/toast";

type Candidate = {
  id: string;
  name: string;
  party: string;
  slogan: string;
  color: string;
};

type Position = {
  id: string;
  name: string;
};

const VotingPanel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [positions, setPositions] = useState<Position[]>([]);
  const [candsByPos, setCandsByPos] = useState<Record<string, Candidate[]>>({});
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [toast, setToast] = useState<{ open: boolean; title?: string; message?: string; variant?: 'success'|'info'|'warning'|'error' }>({ open: false });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resPos = await fetch('/api/positions');
        if (resPos.ok) {
          const pos = await resPos.json();
          if (!mounted) return;
          const positionsList: Position[] = pos.map((p: any) => ({ id: p.id ?? p.positionId ?? p.name ?? '', name: p.name ?? p.positionName ?? '' }));
          setPositions(positionsList);
          const fetches = positionsList.map(p => fetch(`/api/candidates/${p.id}`).then(r => r.ok ? r.json() : []));
          const results = await Promise.all(fetches);
          const m: Record<string, Candidate[]> = {};
          positionsList.forEach((p, idx) => {
            m[p.id] = results[idx] ?? [];
          });
          if (mounted) setCandsByPos(m);
        }
      } catch {
        // ignore for lightweight demo
      }
    })();
    return () => { mounted = false; };
  }, []);

  const selectCandidate = (posId: string, candId: string) => {
    setSelected(prev => ({ ...prev, [posId]: candId }));
  };

  const castVote = async (posId: string) => {
    const candidateId = selected[posId];
    if (!candidateId) return;
    const payload: any = {
      userId: user?.id,
      candidates: [{ id: candidateId }],
    };
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // reset selection for this position and show success toast
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
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial' }} className="min-h-screen bg-gradient-to-br from-[#0b1022] via-[#1e1b44] to-[#0b1022] text-white">
      <Toast open={toast.open} onClose={() => setToast({ open: false })} title={toast.title} message={toast.message} variant={toast.variant} />
      <div className="flex justify-between p-4 items-center">
        <h1 className="text-lg capitalize flex items-center gap-2">
          <Check className="ring-1 rounded-full p-2 text-green-400" /> Voting Panel
        </h1>
        <div className="flex gap-4 items-center">
          {Object.values(selected).some(v => v) && <Badge className="px bg-emerald-500">selected</Badge>}
          <span className="hidden sm:block"><ThemeToggle /></span>
          <Menu />
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
                <Button disabled={!currentlySelected} onClick={() => castVote(pos.id)}>Vote for {pos.name}</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VotingPanel;
