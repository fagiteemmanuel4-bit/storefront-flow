import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";
import { errorMessage } from "@/lib/format";

type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
};

type BarcodeDetectorCtor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getDetectorCtor(): BarcodeDetectorCtor | null {
  if (typeof window === "undefined") return null;
  const ctor = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }).BarcodeDetector;
  return typeof ctor === "function" ? ctor : null;
}

export function isBarcodeScanSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    getDetectorCtor() !== null
  );
}

/**
 * Real camera barcode scanner: requests camera permission and decodes frames
 * with the browser BarcodeDetector API. If the browser lacks the API we say so
 * plainly instead of pretending to scan.
 */
export function BarcodeScannerDialog({
  open,
  onOpenChange,
  onDetected,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (value: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<string>("Starting camera…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let frame = 0;

    const ctor = getDetectorCtor();

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setFailed(true);
          setStatus("This browser can't access the camera.");
        }
        return;
      }
      if (!ctor) {
        if (!cancelled) {
          setFailed(true);
          setStatus(
            "This browser can't decode barcodes natively. Type the barcode in manually, or try Chrome on Android.",
          );
        }
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus("Point the camera at a barcode");

        const detector = new ctor({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"],
        });

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            const value = results[0]?.rawValue?.trim();
            if (value && !cancelled) {
              onDetected(value);
              onOpenChange(false);
              return;
            }
          } catch {
            /* transient decode failures are normal between frames */
          }
          frame = requestAnimationFrame(() => void tick());
        };
        frame = requestAnimationFrame(() => void tick());
      } catch (error) {
        if (!cancelled) {
          setFailed(true);
          setStatus(errorMessage(error, "Camera permission was denied."));
        }
      }
    }

    void start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [open, onDetected, onOpenChange]);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="max-w-md">
        <BottomSheetHeader>
          <BottomSheetTitle className="flex items-center gap-2">
            <Camera className="size-4" aria-hidden /> Scan a barcode
          </BottomSheetTitle>
        </BottomSheetHeader>
        <div className="overflow-hidden rounded-xl border border-border bg-foreground/90">
          {failed ? (
            <div className="flex min-h-40 items-center justify-center p-6 text-center text-sm text-background">
              {status}
            </div>
          ) : (
            <video
              ref={videoRef}
              className="aspect-[4/3] w-full object-cover"
              muted
              playsInline
              aria-label="Camera preview for barcode scanning"
            />
          )}
        </div>
        {!failed && <p className="text-center text-sm text-muted-foreground">{status}</p>}
        <Button variant="outline" className="touch-target" onClick={() => onOpenChange(false)}>
          <X className="size-4" aria-hidden /> Close scanner
        </Button>
      </BottomSheetContent>
    </BottomSheet>
  );
}
