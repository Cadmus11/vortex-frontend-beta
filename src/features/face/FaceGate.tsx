"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/context/ThemeToggler"
import { cn } from "@/lib/utils"
import { Camera, Loader2, ScanLine, ShieldCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"

type FaceGateProps = {
  onVerified: () => void
}

export default function FaceGate({ onVerified }: FaceGateProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [streaming, setStreaming] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStreaming(true)
    } catch (error) {
      console.error("Camera access denied")
    }
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream
    stream?.getTracks().forEach((track) => track.stop())
  }

  const handleScan = async () => {
    setScanning(true)

    // Simulated AI delay
    setTimeout(() => {
      setScanning(false)
      setVerified(true)
      onVerified()
    }, 3000)
  }

  return (
    <Card className="bg-zinc-100 dark:bg-zinc-900 h-dvh max-sm:w-full border-zinc-200 dark:border-zinc-800 backdrop-blur">
      <CardHeader className="flex items-center justify-between p-4 text-lg">
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-6 h-6" />
          Identity Verification
        </CardTitle>

<div className="flex items-center gap-4 justify-center">


        {verified && (

          <Badge className="bg-emerald-600 text-white px">
            Verified
          </Badge>
        )} <ThemeToggle/></div>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* Camera Feed */}
        <div className="relative rounded-xl flex justify-center items-center overflow-hidden p-4 border-zinc-300 dark:border-zinc-700 ">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-1/2 rounded-xl  max-sm:w-full object-cover  bg-black flex justify-center items-center"
          />

          {scanning && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <ScanLine className="w-12 h-12 animate-pulse text-emerald-500" />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="text-center space-y-2">
          {scanning ? (
            <div className="flex items-center justify-center gap-2 text-emerald-500">
              <Loader2 className="animate-spin w-4 h-4" />
              Scanning Face...
            </div>
          ) : verified ? (
            <div className="flex items-center justify-center gap-2 text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              Identity Confirmed
            </div>
          ) : (
            <p className="text-zinc-500 text-sm mt">
              Position your face inside the frame
            </p>
          )}
        </div>

        {/* Action Button */}
        {!verified && (
          <div className="flex justify-center">
            <Button
              onClick={handleScan}
              disabled={!streaming || scanning}
              className={cn(
                "bg-emerald-600 hover:bg-emerald-700 text-white px"
              )}
            >
              {scanning ? "Verifying..." : "Start Scan"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}