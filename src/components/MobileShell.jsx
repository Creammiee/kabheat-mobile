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
  const [timeStr, setTimeStr] = useState("");
  const [frameMode, setFrameMode] = useState(false); // Toggle mobile simulator frame view on desktop

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "home", label: "Overview", icon: Flame },
    { id: "telemetry", label: "Live IoT", icon: Activity },
    { id: "logs", label: "Logs", icon: History },
    { id: "hydration", label: "Hydrate", icon: Droplets },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="w-full h-[100dvh] relative flex flex-col overflow-hidden bg-[var(--bg-dark)] text-[var(--honeydew)]">
      {/* Mobile Top Status Bar */}
        <header className="sticky top-0 z-40 bg-[#0C0A14]/90 backdrop-blur-md px-5 pt-3 pb-2 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-white tracking-tight">{timeStr || "12:00"}</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[var(--coral-glow)]/20 text-[var(--coral-glow)] uppercase border border-[var(--coral-glow)]/30">
              v2.4 IoT
            </span>
          </div>

          {/* Dynamic App Brand & Device Status Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenIoTPairing(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all ${
                bleConnected
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse"
              }`}
            >
              {bleConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {bleConnected ? "IoT Connected" : "Pair IoT Band"}
            </button>
          </div>
        </header>

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
        <main className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 pt-3">
          {children}
        </main>

        {/* Floating Glass Bottom Navigation Bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-40 bg-[#0C0A14]/90 backdrop-blur-xl border-t border-white/10 px-2 py-2 flex items-center justify-around">
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

