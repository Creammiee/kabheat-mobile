import React from "react";
import HeatGauge from "../components/HeatGauge";
import {
  Flame,
  AlertOctagon,
  Droplets,
  Plus,
  ShieldCheck,
  Thermometer,
  Zap,
  Activity,
  Wind,
  MapPin,
  ChevronRight,
  Cpu,
  Clock,
  HeartPulse,
  Sparkles,
} from "lucide-react";
import { formatTemp } from "../utils/heatIndex";

export default function HomeView({
  heatIndex,
  telemetry,
  risk,
  mlPrediction,
  mlConfig,
  tempUnit,
  setActiveTab,
  setOpenIoTPairing,
  setOpenSOSModal,
  setOpenAddLogModal,
  hydrationData
}) {
  const activeRisk = risk;

  return (
    <div className="space-y-4">
      {/* Risk Alert Status Header Card */}
      <div
        className="rounded-3xl p-4 border transition-all duration-500 relative overflow-hidden shadow-xl"
        style={{
          backgroundColor: activeRisk.bgColor,
          borderColor: activeRisk.borderColor,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow flex items-center gap-1"
              style={{ backgroundColor: activeRisk.color }}
            >
              {activeRisk.badge || activeRisk.level}
            </span>
            <span className="text-[11px] text-white/70 font-medium flex items-center gap-1">
              <Cpu size={12} className="text-[var(--sky-blue)]" />
              Standard Heat Index Model
            </span>
          </div>

          <button
            onClick={() => setOpenSOSModal(true)}
            className="p-2 rounded-xl bg-red-600/30 border border-red-500/50 text-red-300 hover:bg-red-600/50 transition-all text-xs font-bold flex items-center gap-1"
          >
            <AlertOctagon size={14} className="text-red-400" /> SOS
          </button>
        </div>

        <h2 className="text-lg font-black text-white mt-2 tracking-tight">
          {activeRisk.title}
        </h2>
        <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
          {activeRisk.description}
        </p>

        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-[var(--soft-peach)] font-medium flex items-center gap-1">
            <ShieldCheck size={14} /> {activeRisk.advice}
          </span>
        </div>
      </div>

      {/* Main Radial Heat Gauge Display */}
      <HeatGauge
        heatIndex={heatIndex}
        bodyTemp={telemetry.bodyTemp}
        ambientTemp={telemetry.ambientTemp}
        humidity={telemetry.humidity}
        risk={activeRisk}
        tempUnit={tempUnit}
      />

      {/* Removed AI Machine Learning Strain Forecast Card */}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setOpenAddLogModal(true)}
          className="p-3 rounded-2xl glass-card-interactive glass-panel border border-white/10 flex flex-col items-center justify-center text-center gap-1"
        >
          <div className="p-2 rounded-xl bg-[var(--coral-glow)]/20 text-[var(--coral-glow)]">
            <Plus size={18} />
          </div>
          <span className="text-xs font-bold text-white mt-1">Log Heat</span>
          <span className="text-[9px] text-[var(--honeydew)]/50">Record symptom</span>
        </button>

        <button
          onClick={() => setActiveTab("hydration")}
          className="p-3 rounded-2xl glass-card-interactive glass-panel border border-white/10 flex flex-col items-center justify-center text-center gap-1"
        >
          <div className="p-2 rounded-xl bg-[var(--sky-blue)]/20 text-[var(--sky-blue)]">
            <Droplets size={18} />
          </div>
          <span className="text-xs font-bold text-white mt-1">Hydrate</span>
          <span className="text-[9px] text-[var(--sky-blue)]">{hydrationData.currentMl} / 2500 ml</span>
        </button>

        <button
          onClick={() => setOpenIoTPairing(true)}
          className="p-3 rounded-2xl glass-card-interactive glass-panel border border-white/10 flex flex-col items-center justify-center text-center gap-1"
        >
          <div className="p-2 rounded-xl bg-[var(--soft-peach)]/20 text-[var(--soft-peach)]">
            <Zap size={18} />
          </div>
          <span className="text-xs font-bold text-white mt-1">IoT Sensor</span>
          <span className="text-[9px] text-emerald-400">BLE Stream</span>
        </button>
      </div>

      {/* Current Environmental Forecast & Location */}
      <div className="glass-panel rounded-3xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-[var(--coral-glow)]" />
            <span className="text-xs font-bold text-white">Outdoor Location</span>
          </div>
          <span className="text-[10px] text-[var(--honeydew)]/50">Live Weather Radar</span>
        </div>

        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[var(--coral-glow)]/15 text-[var(--coral-glow)]">
              <Thermometer size={24} />
            </div>
            <div>
              <div className="text-base font-extrabold text-white">
                {telemetry.ambientTemp ? formatTemp(telemetry.ambientTemp, tempUnit) : "--"}
              </div>
              <p className="text-[10px] text-[var(--honeydew)]/60">Ambient Temperature</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-[var(--sky-blue)] flex items-center justify-end gap-1">
              <Wind size={12} /> -- km/h
            </div>
            <p className="text-[10px] text-[var(--soft-peach)] mt-0.5">UV Index: --</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("telemetry")}
          className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[var(--honeydew)]/80 flex items-center justify-between transition-all"
        >
          <span className="flex items-center gap-1.5">
            <Activity size={14} className="text-[var(--coral-glow)]" /> View Live Sensor Stream
          </span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

