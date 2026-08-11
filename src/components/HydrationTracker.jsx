import React, { useState, useEffect } from "react";
import { Droplets, Plus, Timer, Play, Pause, RotateCcw, CheckCircle2, Award, CupSoda } from "lucide-react";

export default function HydrationTracker({ hydrationData, setHydrationData }) {
  // Timer State for 15-min shaded rest countdown
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    let timer = null;
    if (timerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [timerRunning, timeLeft]);

  const addWater = (ml) => {
    setHydrationData((prev) => ({
      ...prev,
      currentMl: Math.min(prev.targetMl, prev.currentMl + ml),
      intakesCount: prev.intakesCount + 1,
    }));
  };

  const resetHydration = () => {
    setHydrationData((prev) => ({ ...prev, currentMl: 0 }));
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercent = Math.min(100, Math.round((hydrationData.currentMl / hydrationData.targetMl) * 100));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Droplets className="text-[#62C4DA]" size={20} /> Hydration & Cooling
          </h2>
        </div>

        <button
          onClick={resetHydration}
          className="text-[10px] text-[#F6FFEA]/40 hover:text-white/80 transition-colors"
        >
          Reset Today
        </button>
      </div>

      {/* Hydration Progress Circular/Bar Card */}
      <div className="glass-panel-warm rounded-3xl p-5 border border-[#62C4DA]/30 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#62C4DA] uppercase tracking-wider">
              Today's Fluid Target
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-extrabold text-white">{hydrationData.currentMl}</span>
              <span className="text-sm font-semibold text-[#62C4DA]">/ {hydrationData.targetMl} ml</span>
            </div>
          </div>

          <div className="w-16 h-16 rounded-full border-4 border-[#62C4DA]/20 border-t-[#62C4DA] border-r-[#62C4DA] flex items-center justify-center font-bold text-sm text-[#62C4DA] shadow-[0_0_15px_rgba(98,196,218,0.3)]">
            {progressPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/10 rounded-full h-3 mt-4 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-[#62C4DA] to-[#FA855A] h-full rounded-full transition-all duration-500 shadow-md"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Quick Add Water Intake Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => addWater(250)}
            className="py-2.5 px-3 rounded-2xl glass-panel hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-[#62C4DA] border border-[#62C4DA]/30"
          >
            <Plus size={14} /> 250 ml
          </button>
          <button
            onClick={() => addWater(500)}
            className="py-2.5 px-3 rounded-2xl glass-panel hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-[#62C4DA] border border-[#62C4DA]/30"
          >
            <Plus size={14} /> 500 ml
          </button>
          <button
            onClick={() => addWater(750)}
            className="py-2.5 px-3 rounded-2xl glass-panel hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 text-xs font-bold text-[#FFDE96] border border-[#FFDE96]/30"
          >
            <CupSoda size={14} /> Electrolyte
          </button>
        </div>
      </div>

      {/* Rest in Shade Countdown Timer */}
      <div className="glass-panel rounded-3xl p-5 border border-white/10 relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#FA855A]/20 text-[#FA855A]">
              <Timer size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Shaded Rest Timer</h3>
              <p className="text-[10px] text-[#F6FFEA]/60">15-min mandatory heat recovery break</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center my-2">
          <div className="text-4xl font-extrabold tracking-widest text-[#FFDE96] font-mono drop-shadow">
            {formatTimer(timeLeft)}
          </div>
          <span className="text-[10px] text-[#F6FFEA]/50 mt-1">Recommended every 45-60 min of work</span>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <button
            onClick={() => setTimerRunning(!timerRunning)}
            className={`py-2 px-6 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              timerRunning
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-gradient-sunset text-white shadow-lg"
            }`}
          >
            {timerRunning ? <Pause size={14} /> : <Play size={14} />}
            {timerRunning ? "Pause Rest" : "Start Rest Timer"}
          </button>

          <button
            onClick={() => {
              setTimerRunning(false);
              setTimeLeft(15 * 60);
            }}
            className="p-2 rounded-xl glass-panel text-white/60 hover:text-white transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}
