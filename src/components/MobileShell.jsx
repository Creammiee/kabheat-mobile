import React, { useState, useEffect } from "react";
import {
  Flame,
  Activity,
  Droplets,
  History,
  User,
  Wifi,
  WifiOff,
  Battery,
  AlertTriangle,
  Smartphone
} from "lucide-react";

export default function MobileShell({
  activeTab,
  setActiveTab,
  children,
  bleConnected,
  setOpenIoTPairing,
  setOpenSOSModal,
  criticalAlert,
  riskLevel
}) {

  const navItems = [
    { id: "home", label: "Overview", icon: Flame },
    { id: "telemetry", label: "Live IoT", icon: Activity },
    { id: "logs", label: "Logs", icon: History },
    { id: "hydration", label: "Hydrate", icon: Droplets },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="safe-area-shell w-full max-w-md mx-auto h-[100dvh] relative flex flex-col overflow-hidden bg-[var(--bg-dark)] text-[var(--honeydew)] shadow-2xl sm:border-x sm:border-white/10">

        {/* Emergency SOS Banner (If Critical Risk or Triggered) */}
        {criticalAlert && (
          <div className="bg-[var(--tomato-jam)] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="animate-bounce" />
              <span>CRITICAL HEAT STROKE WARNING DETECTED!</span>
            </div>
            <button
              onClick={() => setOpenSOSModal(true)}
              className="bg-white text-[var(--tomato-jam)] px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wide hover:bg-neutral-100"
            >
              TRIGGER SOS
            </button>
          </div>
        )}

        {/* Main View Content Area */}
        <main className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-3">
          {children}
        </main>

        {/* Floating Glass Bottom Navigation Bar */}
        <nav className="safe-area-bottom shrink-0 z-40 bg-[var(--bg-dark)]/90 backdrop-blur-xl border-t border-[var(--honeydew)]/10 px-2 pt-2 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "text-[var(--coral-glow)] font-bold scale-105"
                    : "text-[var(--honeydew)]/50 hover:text-[var(--honeydew)]/80"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-[var(--coral-glow)]/15 border border-[var(--coral-glow)]/30 shadow-[0_0_12px_rgba(250,133,90,0.3)]" : ""
                }`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
    </div>
  );
}

