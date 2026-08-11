import React, { useEffect, useState } from "react";
import { X, Wifi, RefreshCw, Bluetooth, Terminal } from "lucide-react";
import { bleHardwareManager } from "../services/bleHardwareService";

function packetStatus(diagnostics) {
  return diagnostics.lastPacketAt
    ? `Last packet ${new Date(diagnostics.lastPacketAt).toLocaleTimeString()}`
    : "Waiting for data";
}

export default function IoTSensorModal({
  isOpen,
  onClose,
  bleConnected,
  setBleConnected,
  setTelemetry,
}) {
  const [scanning, setScanning] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [diagnostics, setDiagnostics] = useState(() => bleHardwareManager.getDiagnostics());

  useEffect(() => bleHardwareManager.subscribe((nextDiagnostics) => {
    setDiagnostics(nextDiagnostics);
    setBleConnected(nextDiagnostics.connected);
    if (!nextDiagnostics.connected) setHardwareInfo(null);
  }), [setBleConnected]);

  if (!isOpen) return null;

  const handleConnectBLE = async () => {
    setScanning(true);
    setErrorMessage(null);
    try {
      const info = await bleHardwareManager.connectBLE((newTelemetry) => {
        setTelemetry((previous) => ({ ...previous, ...newTelemetry }));
      });
      setHardwareInfo(info);
    } catch (error) {
      if (error.name !== "NotFoundError") {
        setErrorMessage(error.message || "Failed to connect to the Bluetooth device.");
      }
    } finally {
      setScanning(false);
    }
  };

  const handleDisconnect = async () => {
    await bleHardwareManager.disconnect();
    setHardwareInfo(null);
  };

  const connectedName = hardwareInfo?.deviceName || diagnostics.deviceName || "Device Connected";
  const connectionBusy = scanning || ["scanning", "connecting", "nus-ready", "subscribing", "reconnecting"].includes(diagnostics.status);
  const connectionLabel = {
    scanning: "Scanning for Kabheat…",
    connecting: "Connecting to Kabheat…",
    "nus-ready": "Nordic UART Service ready…",
    subscribing: "Starting live telemetry…",
    reconnecting: diagnostics.lastTransportError || "Reconnecting to Kabheat…",
  }[diagnostics.status];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 border border-white/15 bg-[var(--bg-dark)] shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[var(--sky-blue)]/20 text-[var(--sky-blue)]"><Bluetooth size={18} /></div>
            <div>
              <h3 className="text-sm font-bold text-white">IoT Sensor Pairing</h3>
              <p className="text-[10px] text-[var(--honeydew)]/60">Manage hardware connection</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/70"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-1 gap-1 my-3 p-1 bg-black/40 rounded-xl border border-white/10 text-[10px] font-bold">
          <div className="py-1.5 rounded-lg flex items-center justify-center gap-1 bg-[var(--sky-blue)] text-white shadow"><Bluetooth size={12} /> Bluetooth LE</div>
        </div>

        <div className="my-3 glass-panel rounded-2xl p-4 border border-white/10 flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all ${bleConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"}`}>
            {bleConnected ? <Bluetooth size={24} /> : <Wifi size={24} />}
          </div>
          <h4 className="text-xs font-extrabold text-white">{bleConnected ? connectedName : "No BLE Device Paired"}</h4>
          <p className="text-[10px] text-[var(--honeydew)]/60 mt-0.5 max-w-[230px]">
            {bleConnected ? "Connected to the Pico W Nordic UART Service." : "Scan for a nearby Kabheat sensor via Bluetooth."}
          </p>
          <button
            onClick={bleConnected ? handleDisconnect : handleConnectBLE}
            disabled={connectionBusy}
            className={`mt-3 w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${bleConnected ? "bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30" : "bg-gradient-sunset text-white shadow-lg hover:brightness-110"} disabled:opacity-70`}
          >
            {connectionBusy ? <><RefreshCw size={14} className="animate-spin" /> {connectionLabel || "Preparing Bluetooth…"}</> : bleConnected ? "Disconnect Hardware" : <><Bluetooth size={14} /> Connect Kabheat</>}
          </button>
          {(errorMessage || diagnostics.lastTransportError) && (
            <p className="text-[10px] text-red-400 mt-2 bg-red-500/10 p-2 rounded-xl border border-red-500/20">{errorMessage || diagnostics.lastTransportError}</p>
          )}
        </div>

        {bleConnected && (
          <div className="bg-black/60 rounded-2xl p-3 border border-white/10 space-y-2 mb-3">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--sky-blue)] font-bold flex items-center gap-1"><Terminal size={12} /> Live Data Stream</span>
              <span className={diagnostics.lastPacketAt ? "text-emerald-400 font-mono" : "text-amber-300 font-mono"}>{packetStatus(diagnostics)}</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-[var(--honeydew)]/70">
              <span>State: Connected</span><span>Device: {connectedName}</span>
              <span>Notifications: {diagnostics.notificationCount}</span><span>Packets parsed: {diagnostics.packetCount}</span>
              <span>Complete packets: {diagnostics.completePacketCount}</span><span>Malformed: {diagnostics.malformedPacketCount}</span>
              <span className="col-span-2">Last packet: {diagnostics.lastPacketAt ? new Date(diagnostics.lastPacketAt).toLocaleTimeString() : "None"}</span>
            </div>
            <p className="text-[9px] text-[var(--honeydew)]/60">Raw Pico packet</p>
            <pre className="text-[9px] font-mono text-emerald-300 bg-black/80 p-2 rounded-xl border border-white/5 overflow-x-auto">{diagnostics.lastRawPacket || "No complete packet received"}</pre>
            {diagnostics.lastParsedTelemetry && <pre className="text-[9px] font-mono text-[var(--sky-blue)] bg-black/80 p-2 rounded-xl border border-white/5 overflow-x-auto">{JSON.stringify(diagnostics.lastParsedTelemetry)}</pre>}
            {diagnostics.lastParseError && <p className="text-[9px] text-amber-300">Last parse error: {diagnostics.lastParseError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
