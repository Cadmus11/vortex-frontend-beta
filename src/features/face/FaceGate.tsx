import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Camera, ScanLine, CheckCircle, AlertCircle, Loader2, Shield, User, Mail, BadgeCheck, Check, Vote } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { API_URL } from "../../config/api";
import { useAuth } from "@/context/AuthContext";
import { useFaceRecognition } from "@/hooks/useFaceRecognition";

interface FaceGateProps {
  onVerified?: () => void;
}

interface EmbeddingResponse {
  success: boolean;
  id?: string;
  embeddingId?: string;
  error?: string;
}

interface ActiveElection {
  id: string;
  title: string;
  status: string;
}

interface VoteCheckResponse {
  success: boolean;
  hasVoted: boolean;
  voteId?: string;
}

export default function FaceGate({ onVerified }: FaceGateProps) {
  const { user, accessToken } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [verified, setVerified] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [activeElection, setActiveElection] = useState<ActiveElection | null>(null);
  const [lightingHint, setLightingHint] = useState<string | null>(null);
  const [embeddingInfo, setEmbeddingInfo] = useState<{
    id?: string;
    ok?: boolean;
  } | null>(null);
  const [detectorAvailable, setDetectorAvailable] = useState<boolean | null>(null);
  const { loaded: modelsLoaded, error: modelError, loadModels, getDescriptor, detectFace } = useFaceRecognition();

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
    if (user?.isVerified) {
      setVerified(true);
    }
  }, [user?.isVerified]);

  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!user?.id) return;
      
      try {
        const electionsRes = await fetch(`${API_URL}/elections`, {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        
        if (electionsRes.ok) {
          const data = await electionsRes.json();
          const elections: ActiveElection[] = data?.data || [];
          const active = elections.find((e) => e.status === 'active') || elections[0];
          
          if (active) {
            setActiveElection(active);
            
            const voteRes = await fetch(`${API_URL}/votes/check?electionId=${active.id}`, {
              credentials: "include",
              headers: getAuthHeaders(),
            });
            
            if (voteRes.ok) {
              const voteData = await voteRes.json() as VoteCheckResponse;
              if (voteData.hasVoted) {
                setHasVoted(true);
              }
            }
          }
        }
      } catch {
        // Ignore errors
      }
    };
    
    checkVoteStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, accessToken]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreaming(true);
    } catch {
      console.error("Camera access denied");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
  };

  useEffect(() => {
    if (!verified) {
      loadModels();
      startCamera();
    }
    return () => stopCamera();
  }, [verified]);

  useEffect(() => {
    if (modelsLoaded) {
      setDetectorAvailable(true);
    } else if (modelError) {
      setDetectorAvailable(false);
    }
  }, [modelsLoaded, modelError]);

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

  const captureFrame = (): string => {
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

  const handleScan = async () => {
    if (!streaming || scanning) return;
    setLightingHint(null);
    setEmbeddingInfo(null);
    setScanning(true);

    const hasFace = await detectFaceInFrame();
    if (!hasFace && modelsLoaded) {
      setLightingHint(
        "No face detected. Please adjust your position and try again.",
      );
      setScanning(false);
      return;
    }

    const dataURL = captureFrame();
    if (!dataURL) {
      setLightingHint("Failed to capture image. Please try again.");
      setScanning(false);
      return;
    }

    let descriptor: number[] | null = null;
    
    if (modelsLoaded && videoRef.current) {
      descriptor = await getDescriptor(videoRef.current);
      if (!descriptor) {
        setLightingHint("Failed to generate face descriptor. Please try again.");
        setScanning(false);
        return;
      }
    }

    try {
      const payload = { 
        faceEmbedding: JSON.stringify(descriptor || []),
        imageData: dataURL 
      };
      const res = await fetch(`${API_URL}/face/register`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      
      const json = await res.json() as EmbeddingResponse;
      
      if (res.ok && json.success) {
        setEmbeddingInfo({
          id: json.id,
          ok: true,
        });
        setVerified(true);
        onVerified?.();
      } else {
        setLightingHint(json.error || "Failed to complete verification");
      }
    } catch {
      setLightingHint("Network error during verification. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const embeddingId = embeddingInfo?.id;
  const isAdmin = user?.role === 'admin';
  const cardColor = isAdmin ? "from-blue-500/20 to-blue-600/20 border-blue-500/50" : "from-emerald-500/20 to-emerald-600/20 border-emerald-500/50";
  const accentColor = isAdmin ? "text-blue-500" : "text-emerald-500";
  const bgAccent = isAdmin ? "bg-blue-500" : "bg-emerald-500";

  const lightingStatus = useMemo(() => {
    if (lightingHint) return lightingHint;
    if (verified) return "Identity Confirmed";
    if (detectorAvailable === null) return "Checking face detection...";
    if (detectorAvailable === false) return "Face detection unavailable. Ready to scan.";
    return "Position your face inside the frame";
  }, [lightingHint, verified, detectorAvailable]);

  if (verified && !hasVoted) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 md:p-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <div className={cn("w-80 h-80 rounded-full bg-linear-to-br opacity-20 blur-3xl", isAdmin ? "bg-blue-500" : "bg-emerald-500")} />
          </div>
          <div className="absolute -top-4 -left-4 w-8 h-8">
            <div className={cn("absolute w-full h-full rounded-full animate-orbit", bgAccent, "opacity-20")} />
            <div className={cn("absolute w-2 h-2 top-1 left-1 rounded-full animate-pulse", bgAccent)} />
          </div>
          <div className="absolute -top-4 -right-4 w-8 h-8">
            <div className={cn("absolute w-full h-full rounded-full animate-orbit-delayed", bgAccent, "opacity-20")} />
            <div className={cn("absolute w-2 h-2 top-1 left-1 rounded-full animate-pulse", bgAccent)} />
          </div>
          <div className="absolute -bottom-4 -left-4 w-8 h-8">
            <div className={cn("absolute w-full h-full rounded-full animate-orbit-slow", bgAccent, "opacity-20")} />
            <div className={cn("absolute w-2 h-2 top-1 left-1 rounded-full animate-pulse", bgAccent)} />
          </div>
          <div className="absolute -bottom-4 -right-4 w-8 h-8">
            <div className={cn("absolute w-full h-full rounded-full animate-orbit-delayed-slow", bgAccent, "opacity-20")} />
            <div className={cn("absolute w-2 h-2 top-1 left-1 rounded-full animate-pulse", bgAccent)} />
          </div>

          <Card className={cn("relative w-80 bg-linear-to-br backdrop-blur-xl border-2 shadow-2xl overflow-hidden", cardColor)}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-current to-transparent opacity-50" />
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 relative">
                <div className={cn("w-24 h-24 rounded-full bg-linear-to-br flex items-center justify-center shadow-lg", isAdmin ? "bg-blue-100 dark:bg-blue-900/30" : "bg-emerald-100 dark:bg-emerald-900/30")}>
                  <User className={cn("w-12 h-12", accentColor)} />
                </div>
                <div className={cn("absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md", bgAccent)}>
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                {user?.username || 'User'}
              </CardTitle>
              <p className="text-sm text-zinc-500">Identity Verified</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-500">Email</span>
                  </div>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                    {user?.email || 'N/A'}
                  </p>
                </div>
                <div className="bg-white/50 dark:bg-zinc-800/50 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-500">Role</span>
                  </div>
                  <Badge className={cn(
                    "text-xs font-medium capitalize",
                    isAdmin ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}>
                    {user?.role || 'voter'}
                  </Badge>
                </div>
              </div>

              <div className="bg-white/50 dark:bg-zinc-800/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className={cn("w-4 h-4", accentColor)} />
                  <span className="text-xs text-zinc-500">Verification Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", bgAccent)} />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {user?.isVerified ? 'Face Verified' : 'Email Verified'}
                  </span>
                </div>
              </div>

              {activeElection && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <p className="text-xs text-zinc-500 mb-2">Active Election</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {activeElection.title}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      Ready to Vote
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasVoted) {
    return (
      <div className="min-h-screen w-full bg-linear-to-br from-zinc-100 via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 md:p-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <div className="w-96 h-96 rounded-full bg-linear-to-br from-purple-500/10 to-purple-600/10 blur-3xl mx-auto" />
          </div>

          <Card className="relative w-96 bg-linear-to-br backdrop-blur-xl border-2 border-purple-500/30 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-purple-500 via-purple-400 to-purple-500" />
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-linear-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center shadow-lg">
                  <Vote className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                Vote Submitted!
              </CardTitle>
              <p className="text-sm text-zinc-500">Your vote has been recorded</p>
            </CardHeader>

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

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
          <CardHeader className="space-y-1 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Camera className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span>Identity Verification</span>
              </CardTitle>

              <div className="flex items-center gap-2">
                {verified ? (
                  <Badge className="bg-emerald-600 text-white px-3 py-1 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    Pending
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 md:p-6 lg:p-8">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="space-y-4">
                <div className="relative w-full aspect-4/3 sm:aspect-video lg:aspect-4/3 rounded-2xl overflow-hidden border-2 border-zinc-300 dark:border-zinc-700 bg-black shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {!streaming && (
                    <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                      <span className="text-zinc-400 text-sm">Starting camera...</span>
                    </div>
                  )}
                  
                  {!streaming && (
                    <div className="absolute inset-0 bg-zinc-900/90 flex flex-col items-center justify-center gap-3">
                      <AlertCircle className="w-8 h-8 text-yellow-500" />
                      <span className="text-zinc-300 text-sm text-center px-4">Camera access denied. Please allow camera permissions.</span>
                    </div>
                  )}
                  
                  {scanning && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                          <ScanLine className="w-16 h-16 text-emerald-400 animate-pulse relative z-10" />
                        </div>
                        <span className="text-white font-medium animate-pulse">Scanning...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 border-2 border-emerald-400/50 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 border border-dashed border-emerald-400/30 rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  {lightingHint ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{lightingHint}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {verified ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{lightingStatus}</span>
                      ) : (
                        lightingStatus
                      )}
                    </p>
                  )}
                </div>

                {!verified && (
                  <div className="flex justify-center pt-2">
                    <Button
                      onClick={handleScan}
                      disabled={!streaming || scanning}
                      size="lg"
                      className={cn(
                        "w-full sm:w-auto min-w-50 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all duration-200",
                        scanning && "opacity-70"
                      )}
                    >
                      {scanning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <ScanLine className="w-4 h-4 mr-2" />
                          Start Scan
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="hidden lg:flex flex-col justify-center space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                    Verification Tips
                  </h3>
                  <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded mt-0.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>Ensure your face is clearly visible and centered in the frame</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded mt-0.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>Use good lighting - avoid backlighting or shadows on your face</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded mt-0.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>Remove glasses, hats, or face coverings if possible</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded mt-0.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span>Look directly at the camera and stay still during scanning</span>
                    </li>
                  </ul>
                </div>

                {verified && embeddingId && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      <span>Verification Complete</span>
                    </div>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                      Your identity has been verified successfully.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {verified && (
              <div className="mt-6 lg:hidden p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  <span>Verification Complete</span>
                </div>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                  Your identity has been verified successfully.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <canvas ref={captureCanvasRef} className="hidden" />
      </div>
    </div>
  );
}
