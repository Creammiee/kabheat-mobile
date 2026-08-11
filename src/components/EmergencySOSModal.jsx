import React, { useState, useEffect } from "react";
import { AlertOctagon, PhoneCall, Send, X, MapPin, ShieldAlert, CheckCircle } from "lucide-react";

export default function EmergencySOSModal({ isOpen, onClose, currentPos, telemetry }) {
  const [countdown, setCountdown] = useState(5);
  const [sosSent, setSosSent] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    let timer = null;
    if (isOpen && !sosSent && !cancelled && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && countdown === 0 && !cancelled) {
      setSosSent(true);
    }

    return () => clearInterval(timer);
  }, [isOpen, countdown, sosSent, cancelled]);

  if (!isOpen) return null;

  const handleCancel = () => {
    setCancelled(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-[#180A0C] border border-red-500/50 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(201,54,56,0.5)] relative overflow-hidden">
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white/70 hover:bg-white/20"
        >
          <X size={18} />
        </button>

        {!sosSent ? (
          <>
            <div className="w-20 h-20 rounded-full bg-red-600/30 border-4 border-red-500 flex items-center justify-center mx-auto mb-4 animate-ping">
              <AlertOctagon size={40} className="text-red-500" />
            </div>

            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              Emergency SOS Dispatch
            </h2>
            <p className="text-xs text-red-200 mt-1">
              Broadcasting heat stroke alarm to emergency contacts & safety supervisor in:
            </p>

            {/* Countdown Badge */}
            <div className="my-5 text-6xl font-black text-red-500 font-mono animate-pulse">
              00:0{countdown}
            </div>

            {/* Simulated SOS Data Payload */}
            <div className="glass-panel rounded-2xl p-3 border border-red-500/30 text-left text-xs space-y-1 bg-black/40 mb-5">
              <div className="flex items-center gap-1.5 text-red-400 font-bold">
                <MapPin size={14} /> Live GPS Coordinates:
              </div>
              <p className="text-white/80 font-mono text-[11px]">
                {currentPos ? `${currentPos.lat.toFixed(5)}, ${currentPos.lng.toFixed(5)}` : "14.5995° N, 120.9842° E (Manila)"}
              </p>
              <div className="flex items-center gap-1.5 text-amber-300 font-bold mt-2">
                <ShieldAlert size={14} /> Vital Signs:
              </div>
              <p className="text-white/80 text-[11px]">
                Body Temp: <span className="font-bold text-red-400">{telemetry.bodyTemp}°C</span> | Ambient: {telemetry.ambientTemp}°C
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSosSent(true)}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Send size={16} /> Broadcast SOS Now
              </button>

              <button
                onClick={handleCancel}
                className="w-full py-2.5 rounded-2xl bg-white/10 text-white/70 hover:text-white text-xs font-bold transition-all"
              >
                Cancel Alarm
              </button>
            </div>
          </>
        ) : (
          <div className="py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={36} />
            </div>

            <h3 className="text-lg font-extrabold text-white">
              SOS Broadcast Transmitted!
            </h3>
            <p className="text-xs text-emerald-300/80 mt-1 max-w-[240px] mx-auto">
              SMS alert and GPS telemetry sent to 2 Emergency Contacts & Medical Team.
            </p>

            <div className="mt-6 space-y-2">
              <a
                href="tel:911"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all block"
              >
                <PhoneCall size={16} /> Call Emergency (911)
              </a>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-2xl bg-white/10 text-white/70 text-xs font-bold hover:bg-white/20"
              >
                Dismiss Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
