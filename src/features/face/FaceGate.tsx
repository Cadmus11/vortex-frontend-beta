import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Camera, ScanLine, CheckCircle, AlertCircle, Loader2, Shield, User, Mail, BadgeCheck, Check, Vote } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { useAuth } from "@/context/AuthContext";

interface FaceGateProps {
  onVerified?: () => void;
}

interface FaceDetectorAPI {
  detect: (source: HTMLVideoElement) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
}

declare global {
  interface Window {
    FaceDetector: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorAPI;
  }
}

interface EmbeddingResponse {
  id?: string;
  embeddingId?: string;
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
  const detectorRef = useRef<FaceDetectorAPI | null>(null);
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
    if (user?.isVerified) {
      setVerified(true);
      stopCamera();
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
      startCamera();
      if (typeof window !== "undefined" && window.FaceDetector) {
        try {
          detectorRef.current = new window.FaceDetector({
            fastMode: true,
            maxDetectedFaces: 1,
          });
        } catch {
          detectorRef.current = null;
        }
      }
    }
    return () => stopCamera();
  }, [verified]);

  const detectFaceInFrame = async (): Promise<boolean> => {
    try {
      if (!videoRef.current || !detectorRef.current) return false;
      const faces = await detectorRef.current.detect(videoRef.current);
      return !!faces && faces.length > 0;
    } catch {
      return false;
    }
  };

  const captureFrame = (): {
    dataURL: string;
    brightness: number;
    w: number;
    h: number;
  } => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) {
      return { dataURL: "", brightness: 0, w: 0, h: 0 };
    }
    const w = Math.max(video.videoWidth || 0, 1);
    const h = Math.max(video.videoHeight || 0, 1);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { dataURL: "", brightness: 0, w, h };
    }
    ctx.drawImage(video, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h).data;
    let sum = 0;
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sum += lum;
    }
    const brightness = sum / (imageData.length / 4);
    const dataURL = canvas.toDataURL("image/jpeg", 0.92);
    return { dataURL, brightness, w, h };
  };

  const handleScan = async () => {
    if (!streaming || scanning) return;
    setLightingHint(null);
    setEmbeddingInfo(null);
    setScanning(true);

    const hasFace = await detectFaceInFrame();
    if (!hasFace) {
      setLightingHint(
        "No face detected. Please adjust your position and try again.",
      );
      setScanning(false);
      return;
    }

    const { dataURL, brightness } = captureFrame();
    if (brightness > 0 && brightness < 60) {
      setLightingHint(
        "Lighting is a bit dim. Please improve lighting for better scanning.",
      );
      setScanning(false);
      return;
    }

    try {
      const payload = { faceEmbedding: dataURL };
      const res = await fetch(`${API_URL}/face/register`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json() as EmbeddingResponse;
        setEmbeddingInfo({
          id: json.id ?? json.embeddingId ?? undefined,
          ok: true,
        });
        stopCamera();
        setVerified(true);
        onVerified?.();
      } else {
        const text = await res.text();
        setLightingHint("Failed to complete verification: " + text);
      }
    } catch {
      setLightingHint("Network error during verification. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const embeddingId = embeddingInfo?.id;
  const isAdmin = user?.role === 'admin';
  const cardColor = isAdmin ? "from-primary/20 to-primary/10 border-primary/50" : "from-success/20 to-success/10 border-success/50";
  const accentColor = isAdmin ? "text-primary" : "text-success";
  const bgAccent = isAdmin ? "bg-primary" : "bg-success";

  const lightingStatus = useMemo(() => {
    if (lightingHint) return lightingHint;
    return verified
      ? "Identity Confirmed"
      : "Position your face inside the frame";
  }, [lightingHint, verified]);

  if (verified && !hasVoted) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-secondary/30 to-background p-4 md:p-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <div className={cn("w-80 h-80 rounded-full bg-gradient-to-br opacity-20 blur-3xl", isAdmin ? "bg-primary" : "bg-success")} />
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

          <Card className={cn("relative w-80 bg-gradient-to-br backdrop-blur-xl border-2 shadow-2xl overflow-hidden", cardColor)}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 relative">
                <div className={cn("w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg", isAdmin ? "bg-primary/10 dark:bg-primary/20" : "bg-success/10 dark:bg-success/20")}>
                  <User className={cn("w-12 h-12", accentColor)} />
                </div>
                <div className={cn("absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-md", bgAccent)}>
                  <CheckCircle className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {user?.username || 'User'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">Identity Verified</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Email</span>
                  </div>
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email || 'N/A'}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Role</span>
                  </div>
                  <Badge className={cn(
                    "text-xs font-medium capitalize",
                    isAdmin ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  )}>
                    {user?.role || 'voter'}
                  </Badge>
                </div>
              </div>

              <div className="bg-secondary/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className={cn("w-4 h-4", accentColor)} />
                  <span className="text-xs text-muted-foreground">Verification Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full animate-pulse", bgAccent)} />
                  <span className="text-sm font-medium text-foreground">
                    {user?.isVerified ? 'Face Verified' : 'Email Verified'}
                  </span>
                </div>
              </div>

              {activeElection && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Active Election</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
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
      <div className="min-h-screen w-full bg-gradient-to-br from-background via-secondary/30 to-background p-4 md:p-8 flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 animate-pulse">
            <div className="w-96 h-96 rounded-full bg-gradient-to-br from-accent/10 to-accent/5 blur-3xl mx-auto" />
          </div>

          <Card className="relative w-96 bg-gradient-to-br backdrop-blur-xl border-2 border-accent/30 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-accent/80 to-accent" />
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center shadow-lg">
                  <Vote className="w-12 h-12 text-accent" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Vote Submitted!
              </CardTitle>
              <p className="text-sm text-muted-foreground">Your vote has been recorded</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="bg-accent/10 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-accent" />
                  <span className="font-semibold text-accent">
                    Successfully Voted
                  </span>
                </div>
                {activeElection && (
                  <p className="text-sm text-muted-foreground">
                    for <span className="font-medium text-foreground">{activeElection.title}</span>
                  </p>
                )}
              </div>

              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2 text-center">
                  Voter Information
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="text-sm font-medium text-foreground">
                      {user?.username || 'User'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-accent/20 text-accent text-xs">
                      Verified Voter
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-muted-foreground">
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
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-secondary/20 to-background p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <Card className="bg-card/80 backdrop-blur-xl border shadow-2xl">
          <CardHeader className="space-y-1 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Camera className="w-5 h-5 md:w-6 md:h-6 text-success" />
                </div>
                <span>Identity Verification</span>
              </CardTitle>

              <div className="flex items-center gap-2">
                {verified ? (
                  <Badge className="bg-success text-success-foreground px-3 py-1 text-sm">
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
                <div className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border bg-black shadow-inner">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  
                  {!streaming && (
                    <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground text-sm">Starting camera...</span>
                    </div>
                  )}
                  
                  {!streaming && (
                    <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-3">
                      <AlertCircle className="w-8 h-8 text-warning" />
                      <span className="text-foreground text-sm text-center px-4">Camera access denied. Please allow camera permissions.</span>
                    </div>
                  )}
                  
                  {scanning && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
                          <ScanLine className="w-16 h-16 text-success animate-pulse relative z-10" />
                        </div>
                        <span className="text-primary-foreground font-medium animate-pulse">Scanning...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 border-2 border-success/50 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 border border-dashed border-success/30 rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="text-center space-y-1">
                  {lightingHint ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-warning bg-warning/10 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{lightingHint}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {verified ? (
                        <span className="text-success font-medium">{lightingStatus}</span>
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
                        "w-full sm:w-auto min-w-[200px] shadow-lg transition-all duration-200",
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
                  <h3 className="text-lg font-semibold text-foreground">
                    Verification Tips
                  </h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-success/10 rounded mt-0.5">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <span>Ensure your face is clearly visible and centered in the frame</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-success/10 rounded mt-0.5">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <span>Use good lighting - avoid backlighting or shadows on your face</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-success/10 rounded mt-0.5">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <span>Remove glasses, hats, or face coverings if possible</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="p-1 bg-success/10 rounded mt-0.5">
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <span>Look directly at the camera and stay still during scanning</span>
                    </li>
                  </ul>
                </div>

                {verified && embeddingId && (
                  <div className="p-4 bg-success/10 rounded-xl border border-success/30">
                    <div className="flex items-center gap-2 text-success font-medium">
                      <CheckCircle className="w-5 h-5" />
                      <span>Verification Complete</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your identity has been verified successfully.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {verified && (
              <div className="mt-6 lg:hidden p-4 bg-success/10 rounded-xl border border-success/30">
                <div className="flex items-center gap-2 text-success font-medium">
                  <CheckCircle className="w-5 h-5" />
                  <span>Verification Complete</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
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
