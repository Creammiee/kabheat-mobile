import React, { useState } from "react";
import { X, MapPin, Plus, Thermometer } from "lucide-react";

export default function AddLogModal({ isOpen, onClose, onAddLog, currentHeatIndex, currentTemp }) {
  const [location, setLocation] = useState("Outdoor Site - Sector 3");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("normal");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) return;

    onAddLog({
      id: "log-" + Date.now(),
      location: location || "Outdoor Field",
      temperature: currentTemp || 35,
      humidity: 65,
      heatIndex: currentHeatIndex || 39.5,
      bodyTemp: 37.6,
      status: status,
      notes: notes,
      timestamp: new Date().toISOString(),
    });

    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-5 border border-white/15 bg-[var(--bg-dark)] shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Plus size={16} className="text-[var(--coral-glow)]" /> Record Heat Exposure Log
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-white/60 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mt-3">
          <div>
            <label className="text-[11px] font-semibold text-[var(--honeydew)]/70 block mb-1">
              Work Location
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-3 text-[var(--coral-glow)]" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--coral-glow)]"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--honeydew)]/70 block mb-1">
              Observed Symptom / Work Notes
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Mild sweating, felt slight dizziness after 45 mins in direct sun..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[var(--honeydew)]/40 focus:outline-none focus:border-[var(--coral-glow)]"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[var(--honeydew)]/70 block mb-1">
              Felt Thermal Stress Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "normal", label: "Normal", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
                { id: "warning", label: "Caution", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
                { id: "critical", label: "Critical", color: "bg-red-500/20 text-red-300 border-red-500/40" },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${st.color} ${
                    status === st.id ? "ring-2 ring-white shadow-md scale-105" : "opacity-60"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-sunset text-white font-bold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 mt-2"
          >
            Save Heat Log
          </button>
        </form>
      </div>
    </div>
  );
}

