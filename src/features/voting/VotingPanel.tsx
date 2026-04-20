import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { Check, Vote, Loader2, Camera, ScanLine, AlertCircle } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFaceRecognition } from "@/hooks/useFaceRecognition";
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

interface Election {
  id: string;
  title: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

interface FaceDetectorAPI {
  detect: (source: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
}

declare global {
  interface Window {
    FaceDetector: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorAPI;
  }
}

function VotingPanel() {
  const { user, accessToken } = useAuth();
  const [activeElection, setActiveElection] = useState<Election | null>(null);
  const [nextElection, setNextElection] = useState<Election | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [candsByPos, setCandsByPos] = useState<Record<string, Candidate[]>>({});
  const [selected, setSelected] = useState<Record<string, string | null>>({});
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ open: boolean; title?: string; message?: string; variant?: 'success'|'info'|'warning'|'error' }>({ open: false });
  
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [pendingPositionId, setPendingPositionId] = useState<string | null>(null);
  const [faceStreaming, setFaceStreaming] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [faceSuccess, setFaceSuccess] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const { loaded: modelsLoaded, loading: loadingModels, loadModels, getDescriptor, detectFace } = useFaceRecognition();

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
    let mounted = true;
    (async () => {
      try {
        const electionsRes = await fetch(`${API_URL}/elections`, {
          credentials: 'include',
          headers: getAuthHeaders(),
        });
        if (electionsRes.ok && mounted) {
          const electionsPayload = await electionsRes.json();
          const electionsData: Election[] = electionsPayload?.success && Array.isArray(electionsPayload.data) ? electionsPayload.data : [];
          
          const active = electionsData.find((e: Election) => e.status === 'active');
          const upcoming = electionsData.find((e: Election) => e.status === 'draft' || new Date(e.startDate || '') > new Date());
          
          if (mounted) {
            setActiveElection(active || null);
            setNextElection(upcoming || null);
            
            if (active?.id) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (modelsLoaded) return;
    if (!loadingModels) {
      loadModels();
    }
  }, [modelsLoaded, loadingModels, loadModels]);

  const selectCandidate = (posId: string, candId: string) => {
    setSelected(prev => ({ ...prev, [posId]: candId }));
  };

  const openFaceVerification = (posId: string) => {
    if (!user?.isVerified) {
      setFaceError("Please complete face verification first.");
      return;
    }
    setPendingPositionId(posId);
    setFaceModalOpen(true);
    setFaceError(null);
    setFaceSuccess(false);
  };

  const startFaceCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setFaceStreaming(true);
      if (typeof window !== "undefined" && window.FaceDetector && !detectorRef.current) {
        try {
          detectorRef.current = new window.FaceDetector({
            fastMode: true,
            maxDetectedFaces: 1,
          });
        } catch {
          detectorRef.current = null;
        }
      }
    } catch {
      setFaceError("Camera access denied. Please enable camera permissions.");
    }
  };

  const stopFaceCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setFaceStreaming(false);
  };

  const detectFaceInFrame = async (): Promise<boolean> => {
    try {
      if (!videoRef.current) return false;
      
      if (!modelsLoaded) {
        return true;
      }
      
      const result = await detectFace(videoRef.current);
      return result !== null;
    } catch {
      return true;
    }
  };

  const captureFaceFrame = (): string => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return "";
    const w = Math.max(video.videoWidth || 0, 1);
    const h = Math.max(video.videoHeight || 0, 1);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleFaceScan = async () => {
    if (!faceStreaming || faceScanning) return;
    setFaceError(null);
    setFaceScanning(true);

    const hasFace = await detectFaceInFrame();
    if (!hasFace && modelsLoaded) {
      setFaceError("No face detected. Please position your face in the camera.");
      setFaceScanning(false);
      return;
    }

    const faceData = captureFaceFrame();
    if (!faceData) {
      setFaceError("Failed to capture face. Please try again.");
      setFaceScanning(false);
      return;
    }

    let descriptor: number[] | null = null;
    if (modelsLoaded && videoRef.current) {
      descriptor = await getDescriptor(videoRef.current);
    }

    try {
      const verifyRes = await fetch(`${API_URL}/face/verify`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          faceEmbedding: faceData,
          descriptor: descriptor 
        }),
      });
      
      if (verifyRes.ok) {
        const verifyData = await verifyRes.json();
        if (verifyData.verified === true) {
          setFaceSuccess(true);
          setTimeout(() => {
            setFaceModalOpen(false);
            stopFaceCamera();
            if (pendingPositionId) {
              submitVote(pendingPositionId);
            }
          }, 1500);
        } else {
          setFaceError("Face verification failed. Please try again.");
        }
      } else {
        setFaceError("Verification failed. Please try again.");
      }
    } catch {
      setFaceError("Network error during verification. Please try again.");
    } finally {
      setFaceScanning(false);
    }
  };

  const submitVote = async (posId: string) => {
    const candidateId = selected[posId];
    if (!candidateId || !activeElection || !user) return;
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
      if (res.ok) {
        setSelected(prev => ({ ...prev, [posId]: null }));
        setToast({ open: true, title: 'Vote Cast', message: 'Your vote has been recorded.', variant: 'success' });
        
        const voteRes = await fetch(`${API_URL}/votes/check?electionId=${activeElection.id}`, {
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

  const handleVoteSubmit = (posId: string) => {
    openFaceVerification(posId);
  };

  useEffect(() => {
    if (faceModalOpen && !faceStreaming) {
      startFaceCamera();
    }
  }, [faceModalOpen, faceStreaming]);

  useEffect(() => {
    return () => {
      stopFaceCamera();
    };
  }, []);

  const formatNextElectionTime = () => {
    if (!nextElection?.startDate) return null;
    const start = new Date(nextElection.startDate);
    const now = new Date();
    const diff = start.getTime() - now.getTime();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${days}d ${hours}h ${mins}m`;
  };

  if (hasVoted) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 md:p-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <div className="w-96 h-96 rounded-full bg-linear-to-br from-purple-500/10 to-purple-600/10 blur-3xl mx-auto" />
          </div>

          <Card className="relative w-96 bg-linear-to-br backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 via-purple-400 to-purple-500" />
            
            <div className="text-center p-6 pb-2">
              <div className="mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center shadow-lg">
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

  if (!activeElection) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-[#0b1022] via-[#1e1b44] to-[#0b1022] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Vote className="w-10 h-10 text-white/50" />
            </div>
          </div>
          <p className="text-white text-xl font-semibold mb-2">No Active Election at the Moment</p>
          <p className="text-white/50 mb-6">Please wait for an election to start.</p>
          {nextElection && (
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-white/70 text-sm mb-1">Next election:</p>
              <p className="text-white font-medium">{nextElection.title}</p>
              {formatNextElectionTime() && (
                <p className="text-purple-400 text-sm mt-2">Starts in: {formatNextElectionTime()}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial' }} className="min-h-screen bg-linear-to-br from-[#0b1022] via-[#1e1b44] to-[#0b1022] text-white">
      <Toast open={toast.open} onClose={() => setToast({ open: false })} title={toast.title} message={toast.message} variant={toast.variant} />
      
      <Dialog open={faceModalOpen} onOpenChange={(open) => {
        if (!open) {
          stopFaceCamera();
        }
        setFaceModalOpen(open);
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Face Verification
            </DialogTitle>
            <DialogDescription aria-describedby={undefined} className="sr-only">
              Position your face in the camera frame for identity verification.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={captureCanvasRef} className="hidden" />
              
              {!faceStreaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white/70">Starting camera...</p>
                </div>
              )}
              
              {faceSuccess && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-500/30">
                  <div className="text-center">
                    <Check className="w-16 h-16 text-green-400 mx-auto mb-2" />
                    <p className="text-green-400 font-semibold">Verified!</p>
                  </div>
                </div>
              )}
            </div>
            
            {faceError && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm">{faceError}</p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleFaceScan}
                disabled={!faceStreaming || faceScanning || faceSuccess}
                className="flex-1"
              >
                {faceScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Scanning...
                  </>
                ) : faceSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : (
                  <>
                    <ScanLine className="w-4 h-4 mr-2" />
                    Scan Face
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  stopFaceCamera();
                  setFaceModalOpen(false);
                }}
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
            </div>
            
            <p className="text-xs text-zinc-400 text-center">
              Position your face in the camera frame for verification
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
                <Button disabled={!currentlySelected || !activeElection} onClick={() => handleVoteSubmit(pos.id)}>Vote for {pos.name}</Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VotingPanel;