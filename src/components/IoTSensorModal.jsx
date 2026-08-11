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
  triggerOverheatTest,
}) {
  const [connectionType, setConnectionType] = useState("ble"); // 'ble' | 'simulated' | 'serial'
  const [scanning, setScanning] = useState(false);
  const [hardwareInfo, setHardwareInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [rawPayload, setRawPayload] = useState('{"bodyTemp": 37.4, "ambientTemp": 34.5, "humidity": 70, "hr": 92}');

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
    setScanning(true);
    setErrorMessage(null);
    try {
      const info = await bleHardwareManager.connectSerial((newTelemetry) => {
        setTelemetry((prev) => ({ ...prev, ...newTelemetry }));
        setRawPayload(JSON.stringify(newTelemetry));
      });
      setHardwareInfo(info);
      setBleConnected(true);
      setConnectionType("serial");
    } catch (err) {
      setErrorMessage(err.message || "Failed to open Web Serial port.");
    } finally {
      setScanning(false);
    }
  };

  const handleSimulatedConnect = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setBleConnected(true);
      setConnectionType("simulated");
      setHardwareInfo({ deviceName: "KabHeat Wearable Band v2 (Simulated)", connected: true });
    }, 800);
  };

  const handleDisconnect = async () => {
    await bleHardwareManager.disconnect();
    setBleConnected(false);
    setHardwareInfo(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 border border-white/15 bg-[#120E1C] shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#62C4DA]/20 text-[#62C4DA]">
              <Bluetooth size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Bluetooth Hardware Manager</h3>
              <p className="text-[10px] text-[#F6FFEA]/60">BLE 5.2 GATT Telemetry Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10 text-white/70">
            <X size={18} />
          </button>
        </div>

        {/* Hardware Connection Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 my-3 p-1 bg-black/40 rounded-xl border border-white/10 text-[10px] font-bold">
          <button
            onClick={() => setConnectionType("ble")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              connectionType === "ble" ? "bg-[#62C4DA] text-white shadow" : "text-white/60"
            }`}
          >
            <Bluetooth size={12} /> Bluetooth 5.2
          </button>

          <button
            onClick={() => setConnectionType("simulated")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              connectionType === "simulated" ? "bg-[#FA855A] text-white shadow" : "text-white/60"
            }`}
          >
            <Zap size={12} /> Demo Mode
          </button>

          <button
            onClick={() => setConnectionType("serial")}
            className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all ${
              connectionType === "serial" ? "bg-emerald-500 text-white shadow" : "text-white/60"
            }`}
          >
            <Usb size={12} /> USB Serial
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
              ? hardwareInfo?.deviceName || "PicoBioSensor Active"
              : `No ${connectionType.toUpperCase()} Device Paired`}
          </h4>
          <p className="text-[10px] text-[#F6FFEA]/60 mt-0.5 max-w-[230px]">
            {bleConnected
              ? `Receiving live Pico W biosensor stream over ${connectionType.toUpperCase()}.`
              : connectionType === "ble"
              ? "Scan nearby PicoBioSensor BLE device (Pico W Nordic UART Service)."
              : connectionType === "serial"
              ? "Connect USB cable to Raspberry Pi Pico W at 115200 baud."
              : "Use simulated Pico W sensor stream for UI & ML testing."}
          </p>

          {/* Action Button */}
          <button
            onClick={
              bleConnected
                ? handleDisconnect
                : connectionType === "ble"
                ? handleConnectBLE
                : connectionType === "serial"
                ? handleConnectSerial
                : handleSimulatedConnect
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
                Scanning for PicoBioSensor...
              </>
            ) : bleConnected ? (
              "Disconnect Pico W Hardware"
            ) : (
              <>
                <Bluetooth size={14} />
                Connect PicoBioSensor (BLE)
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
              <span className="text-[#62C4DA] font-bold flex items-center gap-1">
                <Terminal size={12} /> Live Pico W Stream Payload
              </span>
              <span className="text-emerald-400 font-mono">Nordic NUS | 1 Hz</span>
            </div>
            <pre className="text-[9px] font-mono text-emerald-300 bg-black/80 p-2 rounded-xl border border-white/5 overflow-x-auto">
              {rawPayload || "GSR:512,TEMP:24.31,HR:72,SPO2:98"}
            </pre>
          </div>
        )}

        {/* Hardware Data Format Guide for Pico W MicroPython */}
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#FFDE96]">
            <Info size={14} /> PicoBioSensor Specifications
          </div>
          <p className="text-[10px] text-white/60 leading-relaxed">
            MicroPython single-file BLE UART stream format targeting DS18B20 (Skin Temp), GSR (ADC26), and MAX30102 (HR/SpO2):
          </p>
          <code className="block text-[9px] font-mono bg-black/50 p-2 rounded-xl text-amber-200">
            GSR:512,TEMP:24.31,HR:72,SPO2:98
          </code>
        </div>

        {/* Simulated Telemetry Tuning Sliders */}
        {connectionType === "simulated" && (
          <div className="space-y-3 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FFDE96] flex items-center gap-1.5">
                <Sliders size={14} /> Simulated Hardware Telemetry Tuning
              </span>
            </div>

            {/* Body Temp Slider */}
            <div className="glass-panel rounded-xl p-2.5 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#F6FFEA]/70">Simulated Body Temp:</span>
                <span className="font-bold text-[#FA855A]">{telemetry.bodyTemp}°C</span>
              </div>
              <input
                type="range"
                min="36.0"
                max="41.0"
                step="0.1"
                value={telemetry.bodyTemp}
                onChange={(e) =>
                  setTelemetry({ ...telemetry, bodyTemp: parseFloat(e.target.value) })
                }
                className="w-full accent-[#FA855A] cursor-pointer"
              />
            </div>

            {/* Ambient Temp Slider */}
            <div className="glass-panel rounded-xl p-2.5 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#F6FFEA]/70">Simulated Air Temp:</span>
                <span className="font-bold text-[#FFDE96]">{telemetry.ambientTemp}°C</span>
              </div>
              <input
                type="range"
                min="24.0"
                max="48.0"
                step="0.5"
                value={telemetry.ambientTemp}
                onChange={(e) =>
                  setTelemetry({ ...telemetry, ambientTemp: parseFloat(e.target.value) })
                }
                className="w-full accent-[#FFDE96] cursor-pointer"
              />
            </div>

            {/* Humidity Slider */}
            <div className="glass-panel rounded-xl p-2.5 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#F6FFEA]/70">Humidity:</span>
                <span className="font-bold text-[#62C4DA]">{telemetry.humidity}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="95"
                step="1"
                value={telemetry.humidity}
                onChange={(e) =>
                  setTelemetry({ ...telemetry, humidity: parseInt(e.target.value) })
                }
                className="w-full accent-[#62C4DA] cursor-pointer"
              />
            </div>

            {/* Overheat Emergency Simulator Button */}
            <button
              onClick={triggerOverheatTest}
              className="w-full py-2 px-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-red-500/30 transition-all mt-2"
            >
              <AlertTriangle size={14} />
              Simulate Heat Stroke Emergency Alert
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
