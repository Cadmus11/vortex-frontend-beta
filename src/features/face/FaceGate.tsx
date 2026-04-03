import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/context/ThemeToggler";
import { cn } from "@/lib/utils";
import { Camera, ScanLine } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "../../config/api";

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
      const payload = { image: dataURL };
      const res = await fetch(`${API_URL}/face/embeddings`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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
        setLightingHint("Failed to save embeddings: " + text);
      }
    } catch {
      setLightingHint("Network error saving embeddings. Please try again.");
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
    <Card className="bg-zinc-100 dark:bg-zinc-900 w-full max-w-md mx-auto h-dvh border-zinc-200 dark:border-zinc-800 backdrop-blur">
      <CardHeader className="flex items-center justify-between p-4 text-lg">
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-6 h-6" />
          Identity Verification
        </CardTitle>

        <div className="flex items-center gap-4 justify-center">
          {verified && (
            <Badge className="bg-emerald-600 text-white px">Verified</Badge>
          )}
          <ThemeToggle />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 px-4 pb-6">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-700">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {scanning && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <ScanLine className="w-12 h-12 animate-pulse text-emerald-500" />
            </div>
          )}
        </div>

        <div className="text-center space-y-2">
          {lightingHint && (
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              {lightingHint}
            </div>
          )}
          {!lightingHint && (
            <div className="text-sm text-zinc-500">{lightingStatus}</div>
          )}
        </div>

        {!verified && (
          <div className="flex justify-center">
            <Button
              onClick={handleScan}
              disabled={!streaming || scanning}
              className={cn(
                "bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2",
              )}
            >
              {scanning ? "Processing..." : "Start Scan"}
            </Button>
          </div>
        )}

        {embeddingId && (
          <div className="text-center text-sm text-zinc-600">
            Embedding stored: {embeddingId}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
