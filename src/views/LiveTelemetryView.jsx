import React from "react";
import { Activity, Heart, Thermometer, Wind, Zap, RefreshCw, Cpu, Dumbbell, Sparkles } from "lucide-react";
import { formatTemp } from "../utils/heatIndex";

export default function LiveTelemetryView({
  telemetry,
  setTelemetry,
  tempUnit,
  bleConnected,
  setOpenIoTPairing,
  mlPrediction,
  mlConfig,
}) {
  const heartRate = telemetry.heartRate || Math.round(72 + (telemetry.bodyTemp - 37.0) * 25);
  const thermalStrainIndex = (
    ((telemetry.bodyTemp - 36.5) / 4) * 5 +
    ((telemetry.ambientTemp - 25) / 20) * 5
  ).toFixed(1);

  const activityLevels = [
    { id: "sedentary", label: "Resting", icon: "🧘" },
    { id: "light", label: "Light", icon: "🚶" },
    { id: "moderate", label: "Moderate", icon: "🏃" },
    { id: "heavy", label: "Heavy Labor", icon: "🏋️" },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="text-[#FA855A]" size={20} /> Live IoT Telemetry & ML Stream
          </h2>
          <p className="text-xs text-[#F6FFEA]/60">Streaming 10Hz wearable sensor & biometric vector</p>
        </div>

        <button
          onClick={() => setOpenIoTPairing(true)}
          className="p-2 rounded-xl glass-panel text-xs font-semibold text-[#FFDE96] flex items-center gap-1.5"
        >
          <RefreshCw size={14} className={bleConnected ? "animate-spin" : ""} />
          {bleConnected ? "Live BLE" : "Pair IoT"}
        </button>
      </div>

      {/* Exertion / Activity Level Selector (Modifies ML Feature Vector) */}
      <div className="glass-panel rounded-3xl p-4 border border-[#FA855A]/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#FA855A] flex items-center gap-1">
            <Dumbbell size={14} /> Physical Workload Exertion
          </span>
          <span className="text-[10px] text-white/50">Feeds ML Strain Vector</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {activityLevels.map((act) => {
            const isSelected = (telemetry.activityLevel || "moderate") === act.id;
            return (
              <button
                key={act.id}
                onClick={() =>
                  setTelemetry &&
                  setTelemetry((prev) => ({
                    ...prev,
                    activityLevel: act.id,
                  }))
                }
                className={`py-2 px-1 rounded-xl text-center border transition-all ${
                  isSelected
                    ? "border-[#FA855A] bg-[#FA855A]/25 text-white font-extrabold shadow-md"
                    : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                <div className="text-base">{act.icon}</div>
                <div className="text-[10px] mt-0.5">{act.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pico W Hardware Vital Stat Grid (DS18B20 + GSR + MAX30102) */}
      <div className="grid grid-cols-2 gap-3">
        {/* DS18B20 Skin Temperature */}
        <div className="glass-panel rounded-3xl p-4 border border-[#FA855A]/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#FA855A] uppercase tracking-wider">DS18B20 Temp</span>
            <div className="p-1.5 rounded-xl bg-[#FA855A]/20 text-[#FA855A]">
              <Thermometer size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white">
              {formatTemp(telemetry.bodyTemp, tempUnit).replace(/°[CF]/, "")}
            </span>
            <span className="text-xs text-[#FA855A] font-bold">
              {tempUnit === "celsius" ? "°C" : "°F"}
            </span>
          </div>
          <p className="text-[10px] text-[#F6FFEA]/50 mt-1">
            {telemetry.bodyTemp >= 38.5 ? "Hyperthermia Alert" : "Normal Skin Temp"}
          </p>
        </div>

        {/* MAX30102 Heart Rate */}
        <div className="glass-panel rounded-3xl p-4 border border-red-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">MAX30102 HR</span>
            <div className="p-1.5 rounded-xl bg-red-500/20 text-red-400 animate-pulse">
              <Heart size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white">{telemetry.heartRate || 72}</span>
            <span className="text-xs text-red-400 font-bold">BPM</span>
          </div>
          <p className="text-[10px] text-[#F6FFEA]/50 mt-1">
            {(telemetry.heartRate || 72) > 110 ? "High Cardiac Strain" : "Normal Pulse"}
          </p>
        </div>

        {/* MAX30102 SpO2 */}
        <div className="glass-panel rounded-3xl p-4 border border-[#62C4DA]/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#62C4DA] uppercase tracking-wider">SpO2 Oxygen</span>
            <div className="p-1.5 rounded-xl bg-[#62C4DA]/20 text-[#62C4DA]">
              <Zap size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white">{telemetry.spO2 || 98}</span>
            <span className="text-xs text-[#62C4DA] font-bold">%</span>
          </div>
          <p className="text-[10px] text-[#F6FFEA]/50 mt-1">
            {(telemetry.spO2 || 98) < 95 ? "Hypoxia Risk Warning" : "Optimal Oxygenation"}
          </p>
        </div>

        {/* GSR Sweat Conductance */}
        <div className="glass-panel rounded-3xl p-4 border border-[#FFDE96]/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#FFDE96] uppercase tracking-wider">GSR Sweat</span>
            <div className="p-1.5 rounded-xl bg-[#FFDE96]/20 text-[#FFDE96]">
              <Wind size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white">{telemetry.gsr || 512}</span>
            <span className="text-xs text-[#FFDE96] font-bold">ADC</span>
          </div>
          <p className="text-[10px] text-[#F6FFEA]/50 mt-1">
            {(telemetry.gsr || 512) > 700 ? "Heavy Sweating / Loss" : "Normal Conductance"}
          </p>
        </div>
      </div>

      {/* Real-time ML Model Feature Vector Output */}
      {mlPrediction && (
        <div className="glass-panel rounded-3xl p-4 border border-[#62C4DA]/30 space-y-2 bg-black/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#62C4DA] flex items-center gap-1.5">
              <Cpu size={14} /> ML Model Real-Time Feature Matrix
            </span>
            <span className="text-[9px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/20">
              {mlPrediction.confidenceScore}% Acc.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] text-white/80 pt-1">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-white/50 block">Ambient Load:</span>
              <strong className="text-white text-xs">{mlPrediction.featuresUsed.ambientTemp} ({mlPrediction.featuresUsed.humidity})</strong>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <span className="text-white/50 block">Body Core & HR:</span>
              <strong className="text-white text-xs">{mlPrediction.featuresUsed.bodyTemp} | {mlPrediction.featuresUsed.heartRate}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Live Signal Waveform Stream Card */}
      <div className="glass-panel rounded-3xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs font-bold text-white">ECG & Thermal Signal Waveform</span>
          </div>
          <span className="text-[10px] text-[#F6FFEA]/50 font-mono">100Hz BLE Graph</span>
        </div>

        {/* Animated Waveform Visualizer SVG */}
        <div className="w-full h-24 bg-black/40 rounded-2xl border border-white/5 p-2 relative overflow-hidden flex items-center">
          <svg className="w-full h-full" viewBox="0 0 300 60" preserveAspectRatio="none">
            <path
              d="M0,30 Q30,10 60,30 T120,30 T150,5 T160,55 T170,30 T230,30 T300,30"
              fill="none"
              stroke="#FA855A"
              strokeWidth="2.5"
              className="animate-pulse"
            />
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0C0A14] pointer-events-none" />
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#F6FFEA]/60">
          <span>
            KabHeat Band ID: <strong className="text-white">KB-8821-V2</strong>
          </span>
          <span>
            Battery: <strong className="text-emerald-400">94%</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
