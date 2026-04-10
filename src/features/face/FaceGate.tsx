import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { Camera, ScanLine, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";
import { useUser } from "@clerk/clerk-react";

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

export default function FaceGate({ onVerified }: FaceGateProps) {
  const { user: clerkUser } = useUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<FaceDetectorAPI | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [verified, setVerified] = useState(false);
  const [lightingHint, setLightingHint] = useState<string | null>(null);
  const [embeddingInfo, setEmbeddingInfo] = useState<{
    id?: string;
    ok?: boolean;
  } | null>(null);

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
    return () => stopCamera();
  }, []);

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
        headers: { 
          "Content-Type": "application/json",
          ...(clerkUser?.id ? { 'x-clerk-user-id': clerkUser.id } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json() as EmbeddingResponse;
        setEmbeddingInfo({
          id: json.id ?? json.embeddingId ?? undefined,
          ok: true,
        });
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

  const lightingStatus = useMemo(() => {
    if (lightingHint) return lightingHint;
    return verified
      ? "Identity Confirmed"
      : "Position your face inside the frame";
  }, [lightingHint, verified]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-4 md:p-8 flex items-center justify-center">
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
                <div className="relative w-full aspect-[4/3] sm:aspect-video lg:aspect-[4/3] rounded-2xl overflow-hidden border-2 border-zinc-300 dark:border-zinc-700 bg-black shadow-inner">
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
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
                        "w-full sm:w-auto min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all duration-200",
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
