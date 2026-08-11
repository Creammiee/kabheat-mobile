import React, { useState } from "react";
import {
  X,
  Cpu,
  Wifi,
  RefreshCw,
  Sliders,
  AlertTriangle,
  CheckCircle,
  Zap,
  Bluetooth,
  Usb,
  Activity,
  Terminal,
  Info,
} from "lucide-react";
import { bleHardwareManager } from "../services/bleHardwareService";

export default function IoTSensorModal({
  isOpen,
  onClose,
  bleConnected,
  setBleConnected,
  telemetry,
  setTelemetry,
}) {
  const [connectionType, setConnectionType] = useState("ble"); // 'ble' | 'serial'
  const [scanning, setScanning] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [rawPayload, setRawPayload] = useState("");

  if (!isOpen) return null;

  const handleConnectBLE = async () => {
    setScanning(true);
    setErrorMessage(null);
    try {
      const info = await bleHardwareManager.connectBLE((newTelemetry) => {
        setTelemetry((prev) => ({ ...prev, ...newTelemetry }));
        setRawPayload(JSON.stringify(newTelemetry));
      });
      setHardwareInfo(info);
      setBleConnected(true);
      setConnectionType("ble");
    } catch (err) {
      if (err.name !== "NotFoundError") {
        setErrorMessage(err.message || "Failed to scan for Bluetooth devices.");
      }
    } finally {
      setScanning(false);
    }
  };

  const handleConnectSerial = async () => {
    // Removed because Capacitor doesn't support Web Serial API natively
  };

  const handleDisconnect = async () => {
    await bleHardwareManager.disconnect();
    setBleConnected(false);
    setHardwareInfo(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 border border-white/15 bg-[var(--bg-dark)] shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--sky-blue)]/20 text-[var(--sky-blue)]">
              <Bluetooth size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">IoT Sensor Pairing</h3>
              <p className="text-[10px] text-[var(--honeydew)]/60">Manage hardware connection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/70">
            <X size={18} />
          </button>
        </div>

        {/* Hardware Connection Mode Tabs */}
        <div className="grid grid-cols-1 gap-1 my-3 p-1 bg-black/40 rounded-xl border border-white/10 text-[10px] font-bold">
          <button
            onClick={() => setConnectionType("ble")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all bg-[var(--sky-blue)] text-white shadow`}
          >
            <Bluetooth size={12} /> Bluetooth 5.2
          </button>
        </div>

        {/* Pairing Status Card */}
        <div className="my-3 glass-panel rounded-2xl p-4 border border-white/10 flex flex-col items-center text-center">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all ${
              bleConnected
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
            }`}
          >
            {bleConnected ? (
              connectionType === "serial" ? (
                <Usb size={24} />
              ) : connectionType === "ble" ? (
                <Bluetooth size={24} />
              ) : (
                <CheckCircle size={24} />
              )
            ) : (
              <Wifi size={24} />
            )}
          </div>

          <h4 className="text-xs font-extrabold text-white">
            {bleConnected
              ? hardwareInfo?.deviceName || "Device Connected"
              : `No ${connectionType.toUpperCase()} Device Paired`}
          </h4>
          <p className="text-[10px] text-[var(--honeydew)]/60 mt-0.5 max-w-[230px]">
            {bleConnected
              ? `Receiving live sensor stream over Bluetooth.`
              : "Scan for nearby compatible IoT sensors via Bluetooth."}
          </p>

          {/* Action Button */}
          <button
            onClick={
              bleConnected
                ? handleDisconnect
                : connectionType === "ble"
                ? handleConnectBLE
                : handleConnectSerial
            }
            disabled={scanning}
            className={`mt-3 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              bleConnected
                ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                : "bg-gradient-sunset text-white shadow-lg hover:brightness-110"
            }`}
          >
            {scanning ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Scanning for devices...
              </>
            ) : bleConnected ? (
              "Disconnect Hardware"
            ) : (
              <>
                <Bluetooth size={14} />
                Connect Device (BLE)
              </>
            )}
          </button>

          {errorMessage && (
            <p className="text-[10px] text-red-400 mt-2 bg-red-500/10 p-2 rounded-xl border border-red-500/20">
              {errorMessage}
            </p>
          )}
        </div>

        {/* Live Hardware Packet Monitor */}
        {bleConnected && (
          <div className="bg-black/60 rounded-2xl p-3 border border-white/10 space-y-2 mb-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--sky-blue)] font-bold flex items-center gap-1">
                <Terminal size={12} /> Live Data Stream
              </span>
              <span className="text-emerald-400 font-mono">1 Hz</span>
            </div>
            <pre className="text-[9px] font-mono text-emerald-300 bg-black/80 p-2 rounded-xl border border-white/5 overflow-x-auto">
              {rawPayload || "No data"}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}

