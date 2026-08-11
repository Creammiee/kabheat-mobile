import React, { useState } from "react";
import {
  User,
  Bell,
  ShieldAlert,
  Cpu,
  Phone,
  Sliders,
  CheckCircle2,
  ChevronRight,
  Palette,
  Type,
  Sparkles,
  Layers,
  Globe,
  RefreshCw,
} from "lucide-react";
import {
  COLOR_THEME_PRESETS,
  FONT_OPTIONS,
  GLASS_BLUR_OPTIONS,
} from "../utils/themeEngine";

export default function ProfileView({
  tempUnit,
  setTempUnit,
  alertThreshold,
  setAlertThreshold,
  emergencyContacts,
  setEmergencyContacts,
  themeConfig,
  setThemeConfig,
  openWeatherKey,
  setOpenWeatherKey,
}) {
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", relation: "", phone: "" });

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      setEmergencyContacts((prev) => [...prev, newContact]);
      setNewContact({ name: "", relation: "", phone: "" });
      setShowAddContact(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* User Header Profile Card */}
      <div className="glass-panel-warm rounded-3xl p-5 border border-white/10 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-sunset p-0.5 shadow-lg shrink-0">
          <div className="w-full h-full rounded-full bg-[#120E1C] flex items-center justify-center font-bold text-xl text-white">
            KH
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-white">KabHeat User Profile</h2>
          <p className="text-xs text-[#F6FFEA]/60">Field Worker Protection ID: #KH-994</p>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Active Safety Protection
          </span>
        </div>
      </div>

      {/* UI THEME, COLORS & FONTS CUSTOMIZATION PANEL */}
      <div className="glass-panel rounded-3xl p-4 border border-[#62C4DA]/30 space-y-4 bg-gradient-to-b from-white/5 to-transparent">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="text-xs font-bold text-[#62C4DA] uppercase tracking-wider flex items-center gap-1.5">
            <Palette size={16} /> UI Theme & Font Customization
          </h3>
          <span className="text-[10px] text-white/50">Live Styling Engine</span>
        </div>

        {/* Color Palette Presets */}
        <div>
          <label className="text-xs font-bold text-white block mb-2">Color Theme Presets</label>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_THEME_PRESETS.map((preset) => {
              const isSelected = themeConfig?.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() =>
                    setThemeConfig((prev) => ({
                      ...prev,
                      presetId: preset.id,
                      useCustomColors: false,
                    }))
                  }
                  className={`p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? "border-[#62C4DA] bg-[#62C4DA]/15 shadow-md"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-white">{preset.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }} />
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.accent }} />
                      <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.danger }} />
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-[#62C4DA]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Color Pickers */}
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Custom Brand Colors</span>
            <button
              onClick={() =>
                setThemeConfig((prev) => ({
                  ...prev,
                  useCustomColors: !prev.useCustomColors,
                }))
              }
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                themeConfig?.useCustomColors
                  ? "bg-[#FA855A] text-white border-[#FA855A]"
                  : "bg-white/5 text-white/60 border-white/10"
              }`}
            >
              {themeConfig?.useCustomColors ? "Custom Active" : "Enable Custom Colors"}
            </button>
          </div>

          {themeConfig?.useCustomColors && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-white/70 block mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeConfig.customPrimary || "#FA855A"}
                    onChange={(e) =>
                      setThemeConfig((prev) => ({
                        ...prev,
                        customPrimary: e.target.value,
                      }))
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-white">{themeConfig.customPrimary}</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-white/70 block mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeConfig.customAccent || "#62C4DA"}
                    onChange={(e) =>
                      setThemeConfig((prev) => ({
                        ...prev,
                        customAccent: e.target.value,
                      }))
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-white">{themeConfig.customAccent}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Font Family Selector */}
        <div>
          <label className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
            <Type size={14} className="text-[#FFDE96]" /> Typography & Font Family
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map((font) => {
              const isSelected = themeConfig?.fontId === font.id;
              return (
                <button
                  key={font.id}
                  onClick={() =>
                    setThemeConfig((prev) => ({
                      ...prev,
                      fontId: font.id,
                    }))
                  }
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-[#FFDE96] bg-[#FFDE96]/15 shadow-md"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <div className="text-xs font-bold text-white">{font.id}</div>
                  <div className="text-[9px] text-white/60 truncate mt-0.5">Sample Text Aa123</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Glassmorphism Blur Intensity */}
        <div>
          <label className="text-xs font-bold text-white flex items-center gap-1.5 mb-2">
            <Layers size={14} className="text-emerald-400" /> Card Glassmorphism Backdrop
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GLASS_BLUR_OPTIONS.map((glass) => {
              const isSelected = themeConfig?.glassBlur === glass.id;
              return (
                <button
                  key={glass.id}
                  onClick={() =>
                    setThemeConfig((prev) => ({
                      ...prev,
                      glassBlur: glass.id,
                    }))
                  }
                  className={`p-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {glass.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Removed AI MACHINE LEARNING MODEL CONFIGURATION PANEL */}

      {/* Temperature Unit Preference */}
      <div className="glass-panel rounded-3xl p-4 border border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-[#FFDE96] uppercase tracking-wider flex items-center gap-1.5">
          <Sliders size={14} /> Display Preferences
        </h3>

        <div className="flex items-center justify-between bg-white/5 p-3 rounded-2xl">
          <div>
            <div className="text-xs font-bold text-white">Temperature Unit</div>
            <p className="text-[10px] text-[#F6FFEA]/50">Choose Celsius (°C) or Fahrenheit (°F)</p>
          </div>

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setTempUnit("celsius")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tempUnit === "celsius" ? "bg-[#FA855A] text-white" : "text-[#F6FFEA]/50"
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setTempUnit("fahrenheit")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                tempUnit === "fahrenheit" ? "bg-[#FA855A] text-white" : "text-[#F6FFEA]/50"
              }`}
            >
              °F
            </button>
          </div>
        </div>

        {/* Heat Stroke Alert Threshold Slider */}
        <div className="bg-white/5 p-3 rounded-2xl space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-white">Critical Alert Threshold:</span>
            <span className="font-extrabold text-[#FA855A]">{alertThreshold}°C</span>
          </div>
          <input
            type="range"
            min="38"
            max="52"
            step="1"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
            className="w-full accent-[#FA855A] cursor-pointer"
          />
          <p className="text-[10px] text-[#F6FFEA]/50">
            Triggers high-decibel audio warning & emergency SMS when Heat Index reaches this level.
          </p>
        </div>
      </div>

      {/* External Integrations */}
      <div className="glass-panel rounded-3xl p-4 border border-white/10 space-y-3">
        <h3 className="text-xs font-bold text-[#62C4DA] uppercase tracking-wider flex items-center gap-1.5">
          <Globe size={14} /> External Integrations
        </h3>
        
        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 space-y-2">
          <div className="text-xs font-bold text-white flex justify-between">
            <span>OpenWeatherMap API Key</span>
            {openWeatherKey && <CheckCircle2 size={14} className="text-emerald-400" />}
          </div>
          <p className="text-[10px] text-[#F6FFEA]/60">
            Provide an API key to fetch high-precision real-time environmental data. If left blank, the app uses a free, limited public fallback.
          </p>
          <input
            type="text"
            placeholder="e.g. 1a2b3c4d5e6f7g8h9i0j..."
            value={openWeatherKey}
            onChange={(e) => setOpenWeatherKey(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#62C4DA]"
          />
        </div>
      </div>

      {/* Emergency Contacts List */}
      <div className="glass-panel rounded-3xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#FA855A] uppercase tracking-wider flex items-center gap-1.5">
            <Phone size={14} /> Emergency SOS Contacts
          </h3>
          <span className="text-[10px] text-emerald-400 font-semibold">{emergencyContacts.length} Active Contacts</span>
        </div>

        <div className="space-y-2">
          {emergencyContacts.map((contact, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
              <div>
                <div className="text-xs font-bold text-white">{contact.name}</div>
                <p className="text-[10px] text-[#F6FFEA]/50">{contact.relation} | {contact.phone}</p>
              </div>
              <span className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={16} />
              </span>
            </div>
          ))}
        </div>

        {showAddContact ? (
          <div className="bg-black/40 p-3 rounded-2xl border border-white/10 mt-3 space-y-2">
            <input
              type="text"
              placeholder="Name (e.g. Jane Doe)"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FA855A]"
            />
            <input
              type="text"
              placeholder="Relation (e.g. Manager)"
              value={newContact.relation}
              onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FA855A]"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#FA855A]"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddContact}
                className="flex-1 py-1.5 bg-[#FA855A] text-white text-[11px] font-bold rounded-lg transition-all"
              >
                Save Contact
              </button>
              <button
                onClick={() => setShowAddContact(false)}
                className="flex-1 py-1.5 bg-white/10 text-white/70 text-[11px] font-bold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddContact(true)}
            className="w-full py-2 mt-2 rounded-xl bg-white/5 border border-white/10 border-dashed text-[#FA855A] text-xs font-bold hover:bg-white/10 transition-all"
          >
            + Add New Contact
          </button>
        )}
      </div>

      {/* Hardware Diagnostics */}
      <div className="glass-panel rounded-3xl p-4 border border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Cpu className="text-[#62C4DA]" size={18} />
          <div>
            <div className="font-bold text-white">KabHeat Firmware Diagnostics</div>
            <div className="text-[10px] text-[#F6FFEA]/50">Firmware Build 2.4.0 (Latest)</div>
          </div>
        </div>
        <ChevronRight size={16} className="text-[#F6FFEA]/40" />
      </div>
    </div>
  );
}
