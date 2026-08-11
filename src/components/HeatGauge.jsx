import React from "react";
import { formatTemp } from "../utils/heatIndex";

export default function HeatGauge({ heatIndex, bodyTemp, ambientTemp, humidity, risk, tempUnit = "celsius" }) {
  // Calculate SVG circular stroke offset
  const minHI = 20;
  const maxHI = 55;
  const clampedHI = Math.min(Math.max(heatIndex, minHI), maxHI);
  const percentage = (clampedHI - minHI) / (maxHI - minHI);

  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference * 0.75; // 270 degree arc

  return (
    <div className="relative flex flex-col items-center justify-center my-4">
      {/* Outer Glow Ring */}
      <div
        className="absolute w-64 h-64 rounded-full transition-all duration-700 blur-2xl opacity-40 pointer-events-none"
        style={{ backgroundColor: risk.color }}
      />

      {/* SVG Arc Gauge */}
      <div className="relative w-64 h-64 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-135" viewBox="0 0 240 240">
          {/* Background Track */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25}
          />
          {/* Dynamic Progress Meter */}
          <circle
            cx="120"
            cy="120"
            r={radius}
            fill="none"
            stroke={risk.color}
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${risk.color})`,
            }}
          />
        </svg>

        {/* Inner Content Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-xs uppercase tracking-wider text-[#F6FFEA]/60 font-semibold mb-1">
            Heat Index (°HI)
          </span>

          <div className="flex items-baseline justify-center">
            <span className="text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
              {formatTemp(heatIndex, tempUnit).replace(/°[CF]/, '')}
            </span>
            <span className="text-xl font-bold text-[#FFDE96] ml-1">
              {tempUnit === "celsius" ? "°C" : "°F"}
            </span>
          </div>

          <div
            className="mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md flex items-center gap-1.5 transition-all duration-300"
            style={{
              color: risk.color,
              backgroundColor: risk.bgColor,
              borderColor: risk.borderColor,
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: risk.color }}
            />
            {risk.level}
          </div>
        </div>
      </div>

      {/* Sensor Quick Stats Grid */}
      <div className="w-full grid grid-cols-3 gap-2 mt-4 px-2">
        <div className="glass-panel rounded-xl p-2.5 text-center flex flex-col items-center">
          <span className="text-[10px] uppercase text-[#F6FFEA]/60 font-medium">Body Temp</span>
          <span className="text-base font-bold text-white mt-0.5">
            {formatTemp(bodyTemp, tempUnit)}
          </span>
          <span className={`text-[10px] font-semibold mt-0.5 ${bodyTemp > 38 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
            {bodyTemp > 38 ? 'Elevated' : 'Normal'}
          </span>
        </div>

        <div className="glass-panel rounded-xl p-2.5 text-center flex flex-col items-center">
          <span className="text-[10px] uppercase text-[#F6FFEA]/60 font-medium">Ambient</span>
          <span className="text-base font-bold text-[#FFDE96] mt-0.5">
            {formatTemp(ambientTemp, tempUnit)}
          </span>
          <span className="text-[10px] text-[#F6FFEA]/50 mt-0.5">Air Temp</span>
        </div>

        <div className="glass-panel rounded-xl p-2.5 text-center flex flex-col items-center">
          <span className="text-[10px] uppercase text-[#F6FFEA]/60 font-medium">Humidity</span>
          <span className="text-base font-bold text-[#62C4DA] mt-0.5">
            {humidity}%
          </span>
          <span className="text-[10px] text-[#62C4DA]/80 mt-0.5">Relative</span>
        </div>
      </div>
    </div>
  );
}
