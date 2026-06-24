import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Flame, Eye, EyeOff, Radio, CheckCircle, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { AgentLog } from "../types";

interface AgentActivityPanelProps {
  logs: AgentLog[];
  hunterStatus: "idle" | "working" | "done" | "alert";
  breakerStatus: "idle" | "working" | "done" | "alert";
  defenderStatus: "idle" | "working" | "done" | "alert";
}

export default function AgentActivityPanel({
  logs,
  hunterStatus,
  breakerStatus,
  defenderStatus,
}: AgentActivityPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const getStatusIcon = (status: "idle" | "working" | "done" | "alert") => {
    switch (status) {
      case "working":
        return (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        );
      case "done":
        return <CheckCircle className="w-4.5 h-4.5 text-emerald-500" />;
      case "alert":
        return (
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        );
      case "idle":
      default:
        return <div className="w-3 h-3 rounded-full bg-slate-600" />;
    }
  };

  const getStatusText = (status: "idle" | "working" | "done" | "alert") => {
    switch (status) {
      case "working":
        return "ACTIVE";
      case "done":
        return "SECURED";
      case "alert":
        return "CRITICAL";
      case "idle":
      default:
        return "STANDBY";
    }
  };

  const getAgentColor = (agent: "hunter" | "breaker" | "defender") => {
    switch (agent) {
      case "hunter":
        return "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
      case "breaker":
        return "text-sky-400 bg-sky-500/10 border-sky-500/20";
      case "defender":
        return "text-red-400 bg-red-500/10 border-red-500/20";
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-6 pb-4 pointer-events-none">
      <div className="max-w-7xl mx-auto pointer-events-auto">
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="bg-slate-950 border border-slate-900 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header Bar */}
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between px-6 py-3.5 bg-slate-900/60 hover:bg-slate-900/80 cursor-pointer transition select-none"
          >
            <div className="flex items-center space-x-3">
              <Radio className={`w-4 h-4 text-blue-500 ${hunterStatus === "working" || breakerStatus === "working" ? "animate-pulse" : ""}`} />
              <span className="font-display font-bold text-xs text-slate-300 uppercase tracking-widest">
                AI Agent Command Hub
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full text-[10px] font-mono">
                3 Agents Synchronized
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-5 text-xs text-slate-400">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-300">Hunter:</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${hunterStatus === "working" ? "bg-indigo-500/20 text-indigo-400 animate-pulse" : hunterStatus === "alert" ? "bg-red-500/20 text-red-400" : "bg-slate-850 text-slate-400"}`}>
                    {getStatusText(hunterStatus)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-300">Breaker:</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${breakerStatus === "working" ? "bg-sky-500/20 text-sky-400 animate-pulse" : breakerStatus === "alert" ? "bg-red-500/20 text-red-400" : "bg-slate-850 text-slate-400"}`}>
                    {getStatusText(breakerStatus)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-300">Defender:</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${defenderStatus === "working" ? "bg-emerald-500/20 text-emerald-400 animate-pulse" : defenderStatus === "alert" ? "bg-red-500/20 text-red-400 animate-pulse" : "bg-slate-850 text-slate-400"}`}>
                    {getStatusText(defenderStatus)}
                  </span>
                </div>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>
          </div>

          {/* Collapsible Content */}
          <AnimatePresence initial={false}>
            {isOpen && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-slate-900"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-900 p-5 bg-slate-950/80 backdrop-blur-md">
                  {/* Column 1: Agent statuses */}
                  <div className="space-y-4 pb-4 lg:pb-0 lg:pr-5">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agents Status</h4>
                    <div className="space-y-3.5">
                      {/* Agent 1 */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/30 rounded-xl border border-slate-900/50">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Radio className={`w-4 h-4 ${hunterStatus === "working" ? "animate-pulse" : ""}`} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">Agent 1 — Deadline Hunter</p>
                            <p className="text-[10px] text-slate-500 font-medium">Scans Gmail/Calendar inbox background</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          {getStatusIcon(hunterStatus)}
                          <span className="text-[9px] font-mono font-bold text-slate-400">{getStatusText(hunterStatus)}</span>
                        </div>
                      </div>

                      {/* Agent 2 */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/30 rounded-xl border border-slate-900/50">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">Agent 2 — Task Breaker</p>
                            <p className="text-[10px] text-slate-500 font-medium">Autoplans deadlines into micro-tasks</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          {getStatusIcon(breakerStatus)}
                          <span className="text-[9px] font-mono font-bold text-slate-400">{getStatusText(breakerStatus)}</span>
                        </div>
                      </div>

                      {/* Agent 3 */}
                      <div className="flex items-center justify-between p-2.5 bg-slate-900/30 rounded-xl border border-slate-900/50">
                        <div className="flex items-center space-x-2.5">
                          <div className="p-2 bg-red-500/10 rounded-lg text-red-400">
                            <Shield className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-200">Agent 3 — Deadline Defender</p>
                            <p className="text-[10px] text-slate-500 font-medium">Mitigates procrastination breaches</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                          {getStatusIcon(defenderStatus)}
                          <span className="text-[9px] font-mono font-bold text-slate-400">{getStatusText(defenderStatus)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Columns 2-3: Live activity logs feed */}
                  <div className="lg:col-span-2 pt-4 lg:pt-0 lg:pl-5 space-y-3 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Communication Logs</h4>
                      <span className="text-[9px] text-emerald-400 font-mono flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-1" />
                        LIVE STREAMING
                      </span>
                    </div>

                    <div className="flex-1 min-h-[140px] max-h-[140px] overflow-y-auto space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-900/80 font-mono text-[11px] text-slate-300">
                      {logs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-600">
                          Waiting for telemetry signals...
                        </div>
                      ) : (
                        logs.map((log) => (
                          <div key={log.id} className="flex items-start space-x-2 animate-fadeIn border-b border-slate-900/30 pb-1.5">
                            <span className="text-[10px] text-slate-600 whitespace-nowrap">[{log.timestamp}]</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase border ${getAgentColor(log.agent)}`}>
                              {log.agent}
                            </span>
                            <p className="flex-1 leading-normal">{log.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
