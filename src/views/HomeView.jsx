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
  const activeRisk = mlConfig?.engineMode === "noaa" ? risk : mlPrediction;

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
              {mlPrediction?.isAI && mlConfig?.engineMode !== "noaa" && <Sparkles size={10} />}
              {activeRisk.badge || activeRisk.riskLevel}
            </span>
            <span className="text-[11px] text-white/70 font-medium flex items-center gap-1">
              <Cpu size={12} className="text-[#62C4DA]" />
              {mlConfig?.engineMode === "noaa" ? "NOAA Heuristic Engine" : "Kabheat AI Strain Model"}
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
          <span className="text-[#FFDE96] font-medium flex items-center gap-1">
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

      {/* AI Machine Learning Strain Forecast Card */}
      {mlPrediction && (
        <div className="glass-panel rounded-3xl p-4 border border-[#62C4DA]/30 relative overflow-hidden bg-gradient-to-br from-[#121B2B] via-[#0F172A] to-[#1E293B]">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#62C4DA]/20 text-[#62C4DA]">
                <Cpu size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                  AI Model Strain Forecast
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    {mlPrediction.confidenceScore}% Confidence
                  </span>
                </h3>
                <p className="text-[10px] text-[#F6FFEA]/50">
                  {mlPrediction.engineUsed}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab("profile")}
              className="text-[10px] text-[#62C4DA] hover:underline font-semibold flex items-center gap-0.5"
            >
              ML Config <ChevronRight size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FA855A]/20 text-[#FA855A]">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] text-white/60 block">Est. Time to Fatigue</span>
                <span className="text-sm font-black text-white">
                  ~{mlPrediction.predictedFatigueMins} mins
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <HeartPulse size={18} />
              </div>
              <div>
                <span className="text-[10px] text-white/60 block">Biometric HR Load</span>
                <span className="text-sm font-black text-white">
                  {telemetry.heartRate || 92} BPM
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-white/70 text-[10px]">
              Exertion: <strong className="text-white uppercase">{telemetry.activityLevel || "Moderate"}</strong>
            </span>
            {mlPrediction.recommendedRestIntervalMins > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-[#FA855A]/20 text-[#FA855A] text-[10px] font-bold border border-[#FA855A]/30">
                Rest Needed: {mlPrediction.recommendedRestIntervalMins}m / hr
              </span>
            ) : (
              <span className="text-emerald-400 text-[10px] font-medium">Optimal Thermal Reserve</span>
            )}
          </div>
        </div>
      )}

      {/* Quick Action Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setOpenAddLogModal(true)}
          className="p-3 rounded-2xl glass-card-interactive glass-panel border border-white/10 flex flex-col items-center justify-center text-center gap-1"
        >
          <div className="p-2 rounded-xl bg-[#FA855A]/20 text-[#FA855A]">
            <Plus size={18} />
          </div>
          <span className="text-xs font-bold text-white mt-1">Log Heat</span>
          <span className="text-[9px] text-[#F6FFEA]/50">Record symptom</span>
        </button>

        <button
          onClick={() => setActiveTab("hydration")}
          className="p-3 rounded-2xl glass-card-interactive glass-panel border border-white/10 flex flex-col items-center justify-center text-center gap-1"
        >
          <div className="p-2 rounded-xl bg-[#62C4DA]/20 text-[#62C4DA]">
            <Droplets size={18} />
          </div>
          <span className="text-xs font-bold text-white mt-1">Hydrate</span>
          <span className="text-[9px] text-[#62C4DA]">{hydrationData.currentMl} / 2500 ml</span>
        </button>

        <button
          onClick={() => setOpenIoTPairing(true)}
          className="p-3 rounded-2xl glass-card-interactive glass-panel border border-white/10 flex flex-col items-center justify-center text-center gap-1"
        >
          <div className="p-2 rounded-xl bg-[#FFDE96]/20 text-[#FFDE96]">
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
            <MapPin size={16} className="text-[#FA855A]" />
            <span className="text-xs font-bold text-white">Outdoor Location</span>
          </div>
          <span className="text-[10px] text-[#F6FFEA]/50">Live Weather Radar</span>
        </div>

        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#FA855A]/15 text-[#FA855A]">
              <Thermometer size={24} />
            </div>
            <div>
              <div className="text-base font-extrabold text-white">
                {formatTemp(telemetry.ambientTemp, tempUnit)}
              </div>
              <p className="text-[10px] text-[#F6FFEA]/60">Direct Sun Work Risk</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs font-bold text-[#62C4DA] flex items-center justify-end gap-1">
              <Wind size={12} /> 14 km/h SW
            </div>
            <p className="text-[10px] text-[#FFDE96] mt-0.5">UV Index: 9 (Very High)</p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab("telemetry")}
          className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#F6FFEA]/80 flex items-center justify-between transition-all"
        >
          <span className="flex items-center gap-1.5">
            <Activity size={14} className="text-[#FA855A]" /> View Live Sensor & ML Vector Stream
          </span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
