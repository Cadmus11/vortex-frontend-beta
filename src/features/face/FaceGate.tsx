"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/context/ThemeToggler";
import { cn } from "@/lib/utils";
import { Camera, ScanLine } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type FaceGateProps = {
  onVerified?: () => void;
};

// Lightweight browser-based face gate with on-device detection
export default function FaceGate({ onVerified }: FaceGateProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<any>(null);
  const [streaming, setStreaming] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [verified, setVerified] = useState(false);
  const [lightingHint, setLightingHint] = useState<string | null>(null);
  const [embeddingInfo, setEmbeddingInfo] = useState<{
    id?: string;
    ok?: boolean;
  } | null>(null);

  // Initialize camera + face detector when available
  useEffect(() => {
    startCamera();
    // Init FaceDetector if available
    if (typeof window !== "undefined" && (window as any).FaceDetector) {
      try {
        // @ts-ignore
        detectorRef.current = new (window as any).FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      } catch {
        detectorRef.current = null;
      }
    }
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreaming(true);
    } catch (error) {
      console.error("Camera access denied");
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
  };

  // Detect if a face is visible in the current frame using FaceDetector when available
  const detectFaceInFrame = async (): Promise<boolean> => {
    try {
      if (!videoRef.current || !detectorRef.current) return false;
      // The detector can take the video element directly
      const faces = await detectorRef.current.detect(videoRef.current as any);
      return !!faces && faces.length > 0;
    } catch {
      return false;
    }
  };

  // Capture a frame into a canvas and compute simple brightness metric
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
      // perceived brightness
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

    // Step 1: detect face in frame
    const hasFace = await detectFaceInFrame();
    if (!hasFace) {
      setLightingHint(
        "No face detected. Please adjust your position and try again.",
      );
      setScanning(false);
      return;
    }

    // Step 2: capture frame & check lighting
    const { dataURL, brightness } = captureFrame();
    if (brightness > 0 && brightness < 60) {
      setLightingHint(
        "Lighting is a bit dim. Please improve lighting for better scanning.",
      );
      // Do not fail the scan; allow user to recenter and rescan
      setScanning(false);
      return;
    }

    // Step 3: send embeddings to server for storage
    try {
      const payload = { image: dataURL };
      const res = await fetch("/api/face/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        setEmbeddingInfo({
          id: json.id ?? json.embeddingId ?? undefined,
          ok: true,
        });
        setVerified(true);
        onVerified?.();
      } else {
        // server rejected/syntax error
        const text = await res.text();
        setLightingHint("Failed to save embeddings: " + text);
      }
    } catch (err) {
      setLightingHint("Network error saving embeddings. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const embeddingId = embeddingInfo?.id;

  // Derived UI hints
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
        {/* Camera Feed with responsive container */}
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

        {/* Status & guidance */}
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

        {/* Action Button */}
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
