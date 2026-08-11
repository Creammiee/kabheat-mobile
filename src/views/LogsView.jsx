import React, { useState } from "react";
import { History, Plus, Search, Filter, MapPin, Calendar, AlertTriangle, ShieldCheck, Thermometer } from "lucide-react";
import { formatTemp } from "../utils/heatIndex";

export default function LogsView({ logs, setOpenAddLogModal, tempUnit }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="text-[#FFDE96]" size={20} /> Heat Exposure Logs
          </h2>
        </div>

        <button
          onClick={() => setOpenAddLogModal(true)}
          className="py-2 px-3 rounded-2xl bg-gradient-sunset text-white text-xs font-bold shadow-md hover:brightness-110 flex items-center gap-1.5"
        >
          <Plus size={14} /> Log Entry
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-[#F6FFEA]/40" />
          <input
            type="text"
            placeholder="Search location or symptom notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#F6FFEA]/40 focus:outline-none focus:border-[#FA855A]"
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
                  ? "bg-[#FA855A] text-white shadow-md"
                  : "bg-white/5 text-[#F6FFEA]/60 border border-white/10 hover:bg-white/10"
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
          <div className="glass-panel rounded-3xl p-8 text-center text-xs text-[#F6FFEA]/50">
            No heat logs found matching your criteria.
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCritical = log.status === "critical";
            const isWarning = log.status === "warning";
            const badgeColor = isCritical ? "#C93638" : isWarning ? "#FA855A" : "#22c55e";

            return (
              <div
                key={log.id}
                className="glass-panel rounded-3xl p-4 border border-white/10 relative hover:border-white/20 transition-all space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MapPin size={14} className="text-[#FA855A]" /> {log.location}
                  </span>

                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-white tracking-wider"
                    style={{ backgroundColor: badgeColor }}
                  >
                    {log.status}
                  </span>
                </div>

                <p className="text-xs text-[#F6FFEA]/80 leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                  "{log.notes}"
                </p>

                <div className="flex items-center justify-between text-[11px] pt-1 text-[#F6FFEA]/60 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Thermometer size={12} className="text-[#FFDE96]" />
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
