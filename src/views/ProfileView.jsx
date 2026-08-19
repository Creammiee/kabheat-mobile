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
  Layers,
  Globe,
  LogOut,
  Mail,
  Fingerprint,
  Plus,
  Camera,
  Wifi,
  WifiOff,
  Bluetooth
} from "lucide-react";
import {
  COLOR_THEME_PRESETS,
  FONT_OPTIONS,
  GLASS_BLUR_OPTIONS,
} from "../utils/themeEngine";

import AuthModal from "../components/AuthModal";

export default function ProfileView({
  tempUnit,
  setTempUnit,
  alertThreshold,
  setAlertThreshold,
  emergencyContacts,
  setEmergencyContacts,
  themeConfig,
  setThemeConfig,
  user,
  authLoading,
  setOpenIoTPairing,
  bleConnected
}) {
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", relation: "", phone: "" });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAddContact = () => {
    if (newContact.name && newContact.phone) {
      setEmergencyContacts((prev) => [...prev, newContact]);
      setNewContact({ name: "", relation: "", phone: "" });
      setShowAddContact(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert image to base64 to save to Firebase Auth profile
    const reader = new FileReader();
    reader.onload = async (event) => {
      setUploadingAvatar(true);
      try {
        const base64String = event.target.result;
        const { updateUserProfile } = await import("../services/firebaseService");
        await updateUserProfile({ photoURL: base64String });
        // Force a re-render or wait for Auth state to propagate. 
        // Note: Firebase Auth listener might not instantly fire for profile updates,
        // but user.photoURL will be updated in the object.
      } catch (err) {
        console.error("Failed to upload avatar", err);
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (authLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/10 border-t-[var(--sky-blue)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">

      {user ? (
        <>
          {/* Real User Profile Card */}
          <div className="relative overflow-hidden rounded-3xl p-5 border border-[var(--coral-glow)]/20 shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left transition-all">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--coral-glow)]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-sunset p-[2px] shadow-lg shrink-0 relative group">
                <div className="w-full h-full rounded-full bg-[var(--bg-dark)] flex items-center justify-center font-extrabold text-2xl text-[var(--honeydew)] uppercase overflow-hidden relative">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.email ? user.email.substring(0, 2) : "KH"
                  )}
                  {/* Hover/Tap Overlay for Upload */}
                  <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploadingAvatar ? (
                      <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <Camera size={20} className="text-white" />
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-1.5 border-2 border-[var(--bg-dark)] shadow-md">
                <ShieldAlert size={12} className="text-white" />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center sm:items-start z-10">
              <h2 className="text-xl font-black text-[var(--honeydew)] tracking-tight">User Profile</h2>
              <div className="flex flex-col gap-1 mt-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--honeydew)]/70">
                  <Fingerprint size={14} className="text-[var(--sky-blue)]" /> UID: {user.uid.substring(0, 10)}...
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--honeydew)]/70">
                  <Mail size={14} className="text-[var(--soft-peach)]" /> {user.email}
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                  Authenticated
                </span>
              </div>
            </div>
          </div>

          {/* Hardware & Sensors (IoT Pairing) */}
          <div className="glass-panel rounded-3xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-black text-[var(--sky-blue)] tracking-tight flex items-center gap-2">
                <Bluetooth size={18} /> Hardware & Sensors
              </h3>
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border ${
                bleConnected 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                  : "bg-[var(--sky-blue)]/10 text-[var(--sky-blue)] border-[var(--sky-blue)]/20"
              }`}>
                {bleConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
            
            <p className="text-xs text-[var(--honeydew)]/60 mb-4 relative z-10">
              Manage your connection to the KabHeat IoT biomonitoring band.
            </p>

            <button
              onClick={() => setOpenIoTPairing(true)}
              className={`w-full py-4 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg relative z-10 ${
                bleConnected
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-gradient-sunset text-white border border-transparent hover:brightness-110"
              }`}
            >
              {bleConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
              {bleConnected ? "Manage Active IoT Band" : "Pair New IoT Band"}
            </button>
          </div>

          {/* Emergency SOS Contacts (Restored & Upgraded) */}
          <div className="glass-panel rounded-3xl p-5 border border-red-500/20 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="text-sm font-black text-red-400 tracking-tight flex items-center gap-2">
                <Phone size={18} /> Emergency SOS Contacts
              </h3>
              <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-[10px] font-extrabold text-red-400 border border-red-500/20">
                {emergencyContacts.length} Active
              </span>
            </div>

            <div className="space-y-3 relative z-10">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center justify-between bg-black/30 p-4 rounded-2xl border border-white/5 shadow-inner group transition-all hover:bg-black/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                      <User size={18} className="text-red-400" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--honeydew)]">{contact.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-bold text-[var(--honeydew)]/50 tracking-wide">{contact.relation}</span>
                        <span className="text-[10px] text-[var(--honeydew)]/30">•</span>
                        <span className="text-[11px] font-mono text-[var(--honeydew)]/60">{contact.phone}</span>
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 size={18} className="text-emerald-500 opacity-80" />
                </div>
              ))}

              {showAddContact ? (
                <div className="bg-black/40 p-4 rounded-2xl border border-[var(--coral-glow)]/30 shadow-inner space-y-3 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="text-xs font-bold text-[var(--coral-glow)] uppercase tracking-wider mb-2">New SOS Contact</h4>
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Jane Doe)"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--honeydew)] placeholder-[var(--honeydew)]/30 focus:outline-none focus:border-[var(--coral-glow)] focus:ring-1 focus:ring-[var(--coral-glow)]/50 transition-all shadow-inner"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Relation (Manager)"
                      value={newContact.relation}
                      onChange={(e) => setNewContact({ ...newContact, relation: e.target.value })}
                      className="w-1/2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--honeydew)] placeholder-[var(--honeydew)]/30 focus:outline-none focus:border-[var(--coral-glow)] focus:ring-1 focus:ring-[var(--coral-glow)]/50 transition-all shadow-inner"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      className="w-1/2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-[var(--honeydew)] placeholder-[var(--honeydew)]/30 focus:outline-none focus:border-[var(--coral-glow)] focus:ring-1 focus:ring-[var(--coral-glow)]/50 transition-all shadow-inner"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAddContact}
                      className="flex-1 py-3 bg-[var(--coral-glow)] hover:bg-[var(--coral-glow)]/90 text-white text-xs font-black rounded-xl transition-all shadow-[0_0_15px_rgba(250,133,90,0.3)]"
                    >
                      Save Contact
                    </button>
                    <button
                      onClick={() => setShowAddContact(false)}
                      className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--honeydew)]/70 text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddContact(true)}
                  className="w-full py-4 mt-2 rounded-2xl bg-white/5 border border-white/10 border-dashed hover:border-[var(--coral-glow)]/50 hover:bg-white/10 hover:text-[var(--coral-glow)] text-[var(--honeydew)]/60 text-xs font-bold transition-all flex items-center justify-center gap-2 group"
                >
                  <Plus size={16} className="text-[var(--honeydew)]/40 group-hover:text-[var(--coral-glow)] transition-colors" /> 
                  Add Emergency Contact
                </button>
              )}
            </div>
          </div>

          <button 
            onClick={async () => {
              const { logoutUser } = await import("../services/firebaseService");
              await logoutUser();
            }}
            className="w-full py-4 mt-2 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-black hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={18} /> Secure Sign Out
          </button>
        </>
      ) : (
        <div className="relative overflow-hidden rounded-3xl p-5 border border-white/10 bg-black/20 shadow-lg flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left transition-all">
          <div className="w-16 h-16 rounded-full bg-white/5 p-4 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
            <User size={28} className="text-[var(--honeydew)]/40" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-white">Login / Register</h2>
            <p className="text-xs text-[var(--honeydew)]/50 mt-1 font-medium">Create an account to track heat logs across devices, set up emergency contacts, and personalize your profile.</p>
          </div>
          <button 
            onClick={() => setShowAuthModal(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[var(--sky-blue)] text-[var(--bg-dark)] text-sm font-black hover:bg-[var(--sky-blue)]/90 transition-all shadow-[0_0_15px_rgba(98,196,218,0.3)]"
          >
            Authenticate
          </button>
        </div>
      )}

      {/* UI THEME, COLORS & FONTS CUSTOMIZATION PANEL */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-[var(--sky-blue)] tracking-tight flex items-center gap-2">
            <Palette size={18} /> UI Engine & Theme
          </h3>
        </div>

        {/* Color Palette Presets */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[var(--honeydew)]/80 uppercase tracking-wide">Curated Aesthetics</label>
          <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${themeConfig?.useCustomColors ? 'opacity-40 grayscale pointer-events-none scale-[0.98]' : 'opacity-100'}`}>
            {COLOR_THEME_PRESETS.map((preset) => {
              const isSelected = themeConfig?.presetId === preset.id && !themeConfig?.useCustomColors;
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
                  className={`p-3.5 rounded-2xl border text-left flex flex-col gap-3 transition-all duration-300 ${
                    isSelected
                      ? "border-[var(--sky-blue)] bg-[var(--sky-blue)]/10 shadow-[0_0_15px_rgba(98,196,218,0.15)] scale-[1.02]"
                      : "border-white/5 bg-black/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="text-xs font-extrabold text-[var(--honeydew)]">{preset.name}</div>
                    {isSelected && <CheckCircle2 size={16} className="text-[var(--sky-blue)]" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full shadow-inner border border-white/10" style={{ backgroundColor: preset.primary }} />
                    <span className="w-4 h-4 rounded-full shadow-inner border border-white/10" style={{ backgroundColor: preset.accent }} />
                    <span className="w-4 h-4 rounded-full shadow-inner border border-white/10" style={{ backgroundColor: preset.danger }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Colors Picker */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--honeydew)]/80 uppercase tracking-wide">Custom Aesthetics</label>
            <label className="flex items-center gap-2 cursor-pointer bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
              <span className="text-[10px] font-bold text-[var(--honeydew)] uppercase tracking-wider">Enable</span>
              <input 
                type="checkbox" 
                checked={themeConfig?.useCustomColors || false}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, useCustomColors: e.target.checked }))}
                className="w-3.5 h-3.5 rounded border-white/20 bg-black/40 text-[var(--sky-blue)] focus:ring-[var(--sky-blue)]/50 cursor-pointer"
              />
            </label>
          </div>
          
          <div className={`grid grid-cols-2 gap-3 transition-all duration-300 ${themeConfig?.useCustomColors ? 'opacity-100 scale-100' : 'opacity-40 scale-[0.98] pointer-events-none'}`}>
            <div className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-[var(--honeydew)]">Primary</span>
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20 shadow-md">
                <input type="color" value={themeConfig?.customPrimary || "#FA855A"} onChange={(e) => setThemeConfig(prev => ({ ...prev, customPrimary: e.target.value, useCustomColors: true }))} className="w-16 h-16 -mt-4 -ml-4 cursor-pointer" />
              </div>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-[var(--honeydew)]">Accent</span>
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20 shadow-md">
                <input type="color" value={themeConfig?.customAccent || "#62C4DA"} onChange={(e) => setThemeConfig(prev => ({ ...prev, customAccent: e.target.value, useCustomColors: true }))} className="w-16 h-16 -mt-4 -ml-4 cursor-pointer" />
              </div>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-[var(--honeydew)]">Warning</span>
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20 shadow-md">
                <input type="color" value={themeConfig?.customWarning || "#FFDE96"} onChange={(e) => setThemeConfig(prev => ({ ...prev, customWarning: e.target.value, useCustomColors: true }))} className="w-16 h-16 -mt-4 -ml-4 cursor-pointer" />
              </div>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-[var(--honeydew)]">Danger</span>
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20 shadow-md">
                <input type="color" value={themeConfig?.customDanger || "#C93638"} onChange={(e) => setThemeConfig(prev => ({ ...prev, customDanger: e.target.value, useCustomColors: true }))} className="w-16 h-16 -mt-4 -ml-4 cursor-pointer" />
              </div>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-[var(--honeydew)]">Background</span>
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20 shadow-md">
                <input type="color" value={themeConfig?.customBgDark || "#0C0A14"} onChange={(e) => setThemeConfig(prev => ({ ...prev, customBgDark: e.target.value, useCustomColors: true }))} className="w-16 h-16 -mt-4 -ml-4 cursor-pointer" />
              </div>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-[var(--honeydew)]">Text</span>
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20 shadow-md">
                <input type="color" value={themeConfig?.customTextMain || "#F6FFEA"} onChange={(e) => setThemeConfig(prev => ({ ...prev, customTextMain: e.target.value, useCustomColors: true }))} className="w-16 h-16 -mt-4 -ml-4 cursor-pointer" />
              </div>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-[var(--honeydew)]">Card Bg</span>
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20 shadow-md">
                <input type="color" value={themeConfig?.customCardBg || "#2A2A35"} onChange={(e) => setThemeConfig(prev => ({ ...prev, customCardBg: e.target.value, useCustomColors: true }))} className="w-16 h-16 -mt-4 -ml-4 cursor-pointer" />
              </div>
            </div>
            <div className="p-3 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between shadow-inner">
              <span className="text-xs font-bold text-[var(--honeydew)]">Card Border</span>
              <div className="w-8 h-8 rounded overflow-hidden border border-white/20 shadow-md">
                <input type="color" value={themeConfig?.customCardBorder || "#3F3F4A"} onChange={(e) => setThemeConfig(prev => ({ ...prev, customCardBorder: e.target.value, useCustomColors: true }))} className="w-16 h-16 -mt-4 -ml-4 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>

        {/* Font Family Selector */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-[var(--honeydew)]/80 uppercase tracking-wide flex items-center gap-2">
            <Type size={14} className="text-[var(--soft-peach)]" /> Typography
          </label>
          <div className="grid grid-cols-2 gap-3">
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
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-300 ${
                    isSelected
                      ? "border-[var(--soft-peach)] bg-[var(--soft-peach)]/10 shadow-[0_0_15px_rgba(255,222,150,0.15)] scale-[1.02]"
                      : "border-white/5 bg-black/20 hover:bg-white/5"
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <div className="text-sm font-black text-[var(--honeydew)]">{font.id}</div>
                  <div className="text-[11px] text-[var(--honeydew)]/50 truncate mt-1 font-medium">KabHeat Aa123</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Glassmorphism Blur Intensity */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-bold text-[var(--honeydew)]/80 uppercase tracking-wide flex items-center gap-2">
            <Layers size={14} className="text-emerald-400" /> Material Frosting
          </label>
          <div className="grid grid-cols-2 gap-3">
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
                  className={`p-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    isSelected
                      ? "border-emerald-400 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.02]"
                      : "border-white/5 bg-black/20 text-[var(--honeydew)]/60 hover:bg-white/5"
                  }`}
                >
                  {glass.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

    </div>
  );
}
