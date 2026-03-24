import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Camera,
  LogIn,
  LogOut,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useCheckIn,
  useCheckOut,
  useGetAllEmployees,
} from "../hooks/useQueries";
import { useQRScanner } from "../qr-code/useQRScanner";

interface ScanResult {
  employeeId: bigint;
  employeeName: string;
  action: "CHECK_IN" | "CHECK_OUT";
  timestamp: Date;
}

export default function QRScannerPage() {
  const { data: employees } = useGetAllEmployees();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [result, setResult] = useState<ScanResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastScannedRef = useRef<string | null>(null);

  const {
    videoRef,
    canvasRef,
    qrResults,
    isScanning,
    isActive,
    isLoading,
    canStartScanning,
    error: cameraError,
    startScanning,
    stopScanning,
    clearResults,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 150,
    maxResults: 1,
  });

  // Auto-start scanning
  useEffect(() => {
    if (canStartScanning && !result) {
      startScanning();
    }
  }, [canStartScanning, result, startScanning]);

  const processQR = useCallback(
    async (data: string, timestamp: number) => {
      if (!employees) return;
      if (lastScannedRef.current === data) return;

      lastScannedRef.current = data;
      const empId = Number.parseInt(data, 10);

      if (Number.isNaN(empId) || empId < 0 || empId >= employees.length) {
        setError(`Invalid QR code: "${data}"`);
        return;
      }

      const employee = employees[empId];
      if (!employee) {
        setError("Employee not found");
        return;
      }

      setProcessing(true);
      setError(null);
      stopScanning();

      try {
        const empIdBig = BigInt(empId);
        const lockedTime = new Date(timestamp);
        try {
          await checkIn.mutateAsync(empIdBig);
          setResult({
            employeeId: empIdBig,
            employeeName: employee.name,
            action: "CHECK_IN",
            timestamp: lockedTime,
          });
        } catch {
          await checkOut.mutateAsync(empIdBig);
          setResult({
            employeeId: empIdBig,
            employeeName: employee.name,
            action: "CHECK_OUT",
            timestamp: new Date(),
          });
        }
      } catch {
        setError("Failed to record attendance. Please try again.");
      } finally {
        setProcessing(false);
      }
    },
    [employees, stopScanning, checkIn, checkOut],
  );

  // Process scan result
  useEffect(() => {
    const latest = qrResults[0];
    if (!latest || processing || result) return;
    processQR(latest.data, latest.timestamp);
  }, [qrResults, processing, result, processQR]);

  const handleScanAnother = () => {
    setResult(null);
    setError(null);
    lastScannedRef.current = null;
    clearResults();
    startScanning();
  };

  return (
    <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-sidebar-primary flex items-center justify-center mx-auto mb-3">
            <QrCode className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold text-sidebar-foreground">
            Attendance Scanner
          </h1>
          <p className="text-sidebar-foreground/60 text-sm mt-1">
            Scan employee QR code
          </p>
        </div>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-sidebar-accent rounded-2xl p-6 border border-sidebar-border text-center"
              data-ocid="scanner.success_state"
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  result.action === "CHECK_IN"
                    ? "bg-success/20"
                    : "bg-primary/20"
                }`}
              >
                {result.action === "CHECK_IN" ? (
                  <LogIn className="w-8 h-8 text-success" />
                ) : (
                  <LogOut className="w-8 h-8 text-sidebar-primary" />
                )}
              </div>

              <Badge
                className={`text-sm px-3 py-1 mb-3 ${
                  result.action === "CHECK_IN"
                    ? "bg-success/20 text-success border-success/30"
                    : "bg-primary/20 text-sidebar-primary border-primary/30"
                }`}
              >
                {result.action === "CHECK_IN"
                  ? "✓ Checked In"
                  : "✓ Checked Out"}
              </Badge>

              <h2 className="font-display text-xl font-bold text-sidebar-foreground mb-1">
                {result.employeeName}
              </h2>
              <p className="text-sidebar-foreground/60 text-sm mb-4">
                Employee #{result.employeeId.toString().padStart(4, "0")}
              </p>

              <div className="bg-sidebar/50 rounded-lg p-3 mb-5">
                <p className="text-xs text-sidebar-foreground/50 mb-0.5">
                  Timestamp (locked)
                </p>
                <p className="text-sidebar-foreground font-mono text-sm font-semibold">
                  {result.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
                <p className="text-xs text-sidebar-foreground/50">
                  {result.timestamp.toLocaleDateString()}
                </p>
              </div>

              <Button
                onClick={handleScanAnother}
                className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-white gap-2"
                data-ocid="scanner.scan_another.button"
              >
                <RefreshCw className="w-4 h-4" /> Scan Another
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="bg-sidebar-accent rounded-2xl overflow-hidden border border-sidebar-border"
            >
              <div className="relative bg-black aspect-square">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  data-ocid="scanner.canvas_target"
                />
                <canvas ref={canvasRef} className="hidden" />

                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 relative">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-sidebar-primary rounded-tl-md" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-sidebar-primary rounded-tr-md" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-sidebar-primary rounded-bl-md" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-sidebar-primary rounded-br-md" />
                      <div className="absolute left-4 right-4 h-0.5 bg-sidebar-primary/80 animate-scan-line" />
                    </div>
                  </div>
                )}

                {(isLoading || processing) && (
                  <div
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                    data-ocid="scanner.loading_state"
                  >
                    <div className="text-center text-white">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm">
                        {processing ? "Processing..." : "Starting camera..."}
                      </p>
                    </div>
                  </div>
                )}

                {cameraError && (
                  <div
                    className="absolute inset-0 bg-black/80 flex items-center justify-center p-4"
                    data-ocid="scanner.error_state"
                  >
                    <div className="text-center text-white">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-destructive" />
                      <p className="text-sm">{cameraError.message}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4">
                {error && (
                  <div className="flex items-center gap-2 text-destructive text-sm mb-3 p-2 bg-destructive/10 rounded-lg">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {!isActive && !isLoading ? (
                  <Button
                    onClick={() => startScanning()}
                    disabled={!canStartScanning}
                    className="w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-white gap-2"
                    data-ocid="scanner.start.button"
                  >
                    <Camera className="w-4 h-4" /> Start Camera
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-sidebar-foreground/60 text-xs">
                      {isScanning ? "Scanning for QR code..." : "Camera active"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
