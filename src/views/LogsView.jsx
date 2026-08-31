import React, { useState } from "react";
import { History, Plus, Search, Filter, MapPin, Calendar, AlertTriangle, ShieldCheck, Thermometer } from "lucide-react";
import { formatTemp } from "../utils/heatIndex";

export default function LogsView({ logs, setOpenAddLogModal, tempUnit, isLogging, setIsLogging, sessionLogs, setSessionLogs, bleConnected }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const exportCSV = () => {
    if (sessionLogs.length === 0) return;
    const headers = ["Timestamp", "BodyTemp1_C", "BodyTemp2_C", "HR1_BPM", "HR2_BPM", "SpO2_1", "SpO2_2", "GSR_Raw", "Activity", "Latitude", "Longitude"];
    const rows = sessionLogs.map(log => [
      log.timestamp,
      log.bodyTemp ?? "",
      log.bodyTemp2 ?? "",
      log.heartRate ?? "",
      log.heartRate2 ?? "",
      log.spO2 ?? "",
      log.spO22 ?? "",
      log.gsr ?? "",
      log.activityLevel ?? "",
      log.latitude ?? "",
      log.longitude ?? ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kabheat_log_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSessionLogs([]);
  };

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="text-[var(--soft-peach)]" size={20} /> Heat Exposure Logs
          </h2>
        </div>

        <button
          onClick={() => setOpenAddLogModal(true)}
          className="py-2 px-3 rounded-2xl bg-gradient-sunset text-white text-xs font-bold shadow-md hover:brightness-110 flex items-center gap-1.5"
        >
          <Plus size={14} /> Log Entry
        </button>
      </div>

      {/* Continuous Logging Panel */}
      <div className="glass-panel rounded-3xl p-4 border border-[var(--sky-blue)]/20 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--sky-blue)]">Continuous Sensor Logging</h3>
          {isLogging && (
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--honeydew)]/60">
          Record all raw hardware sensor data (Dual HR, Temp, SpO2, GSR) to an Excel-compatible CSV file.
        </p>
        
        <div className="flex gap-2">
          {!isLogging ? (
            <button
              onClick={() => setIsLogging(true)}
              disabled={!bleConnected}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                bleConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" : "bg-white/5 text-white/30 border border-white/10"
              }`}
            >
              Start Recording
            </button>
          ) : (
            <button
              onClick={() => {
                setIsLogging(false);
                exportCSV();
              }}
              className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 text-xs font-black transition-all"
            >
              Stop & Save CSV ({sessionLogs.length} rows)
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-[var(--honeydew)]/40" />
          <input
            type="text"
            placeholder="Search location or symptom notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[var(--honeydew)]/40 focus:outline-none focus:border-[var(--coral-glow)]"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {["all", "critical", "warning", "normal"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-all ${
                filterStatus === st
                  ? "bg-[var(--coral-glow)] text-white shadow-md"
                  : "bg-white/5 text-[var(--honeydew)]/60 border border-white/10 hover:bg-white/10"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-center text-xs text-[var(--honeydew)]/50">
            No heat logs found matching your criteria.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCritical = log.status === "critical";
            const isWarning = log.status === "warning";
            const badgeColor = isCritical ? "var(--tomato-jam)" : isWarning ? "var(--coral-glow)" : "#22c55e";

            return (
              <div
                key={log.id}
                className="glass-panel rounded-3xl p-4 border border-white/10 relative hover:border-white/20 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin size={14} className="text-[var(--coral-glow)]" /> {log.location}
                  </span>

                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white tracking-wider"
                    style={{ backgroundColor: badgeColor }}
                  >
                    {log.status}
                  </span>
                </div>

                <p className="text-xs text-[var(--honeydew)]/80 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                  "{log.notes}"
                </p>

                <div className="flex items-center justify-between text-[11px] pt-1 text-[var(--honeydew)]/60 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Thermometer size={12} className="text-[var(--soft-peach)]" />
                    Index: <strong className="text-white">{formatTemp(log.heatIndex, tempUnit)}</strong>
                  </span>

                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

