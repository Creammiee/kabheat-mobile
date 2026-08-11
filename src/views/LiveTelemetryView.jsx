import React from "react";
import { Activity, Heart, Thermometer, Wind, Zap, RefreshCw, Cpu, Dumbbell, Sparkles, MapPin } from "lucide-react";
import { formatTemp } from "../utils/heatIndex";

export default function LiveTelemetryView({
  telemetry,
  setTelemetry,
  tempUnit,
  bleConnected,
  setOpenIoTPairing,
}) {

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
            <Activity className="text-[var(--coral-glow)]" size={20} /> Live IoT Telemetry
          </h2>
        </div>

      </div>

      {/* Exertion / Activity Level Selector (Modifies ML Feature Vector) */}
      <div className="glass-panel rounded-3xl p-4 border border-[var(--coral-glow)]/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--coral-glow)] flex items-center gap-1">
            <Dumbbell size={14} /> Physical Workload Exertion
          </span>
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
                    ? "border-[var(--coral-glow)] bg-[var(--coral-glow)]/25 text-white font-extrabold shadow-md"
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

      {/* Hardware Vital Stat Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Skin Temperature */}
        <div className="glass-panel rounded-3xl p-4 border border-[var(--coral-glow)]/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--coral-glow)] uppercase tracking-wider">Skin Temp</span>
            <div className="p-1.5 rounded-xl bg-[var(--coral-glow)]/20 text-[var(--coral-glow)]">
              <Thermometer size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white">
              {formatTemp(telemetry.bodyTemp, tempUnit).replace(/°[CF]/, "")}
            </span>
            <span className="text-xs text-[var(--coral-glow)] font-bold">
              {tempUnit === "celsius" ? "°C" : "°F"}
            </span>
          </div>
          <p className="text-[10px] text-[var(--honeydew)]/50 mt-1">
            {telemetry.bodyTemp >= 38.5 ? "Hyperthermia Alert" : "Normal Skin Temp"}
          </p>
        </div>

        {/* Heart Rate */}
        <div className="glass-panel rounded-3xl p-4 border border-red-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Heart Rate</span>
            <div className="p-1.5 rounded-xl bg-red-500/20 text-red-400 animate-pulse">
              <Heart size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white">{telemetry.heartRate ?? "--"}</span>
            <span className="text-xs text-red-400 font-bold">BPM</span>
          </div>
          <p className="text-[10px] text-[var(--honeydew)]/50 mt-1">
            {telemetry.heartRate ? (telemetry.heartRate > 110 ? "High Cardiac Strain" : "Normal Pulse") : "No Data"}
          </p>
        </div>

        {/* SpO2 */}
        <div className="glass-panel rounded-3xl p-4 border border-[var(--sky-blue)]/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--sky-blue)] uppercase tracking-wider">SpO2 Oxygen</span>
            <div className="p-1.5 rounded-xl bg-[var(--sky-blue)]/20 text-[var(--sky-blue)]">
              <Zap size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white">{telemetry.spO2 ?? "--"}</span>
            <span className="text-xs text-[var(--sky-blue)] font-bold">%</span>
          </div>
          <p className="text-[10px] text-[var(--honeydew)]/50 mt-1">
            {telemetry.spO2 ? (telemetry.spO2 < 95 ? "Hypoxia Risk Warning" : "Optimal Oxygenation") : "No Data"}
          </p>
        </div>

        {/* GSR Sweat Conductance */}
        <div className="glass-panel rounded-3xl p-4 border border-[var(--soft-peach)]/30 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[var(--soft-peach)] uppercase tracking-wider">GSR Sweat</span>
            <div className="p-1.5 rounded-xl bg-[var(--soft-peach)]/20 text-[var(--soft-peach)]">
              <Wind size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-3xl font-extrabold text-white">{telemetry.gsr ?? "--"}</span>
            <span className="text-xs text-[var(--soft-peach)] font-bold">ADC</span>
          </div>
          <p className="text-[10px] text-[var(--honeydew)]/50 mt-1">
            {telemetry.gsr ? (telemetry.gsr > 700 ? "Heavy Sweating / Loss" : "Normal Conductance") : "No Data"}
          </p>
        </div>

        {/* Device GPS Location */}
        <div className="glass-panel rounded-3xl p-4 border border-indigo-500/30 relative overflow-hidden col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Mobile GPS Location</span>
            <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <MapPin size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-extrabold text-white font-mono tracking-tighter">
              {telemetry.latitude ? `${telemetry.latitude.toFixed(4)}°, ${telemetry.longitude.toFixed(4)}°` : "Searching..."}
            </span>
          </div>
          <p className="text-[10px] text-[var(--honeydew)]/50 mt-1 flex items-center gap-2">
            <span>Source: <strong className="text-indigo-400">{telemetry.satellites ?? "None"}</strong></span>
            <span>•</span>
            <span>Accuracy: <strong className="text-indigo-400">{telemetry.accuracy ? telemetry.accuracy.toFixed(1) + "m" : "--"}</strong></span>
          </p>
        </div>
      </div>

    </div>
  );
}

