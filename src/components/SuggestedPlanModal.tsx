import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Calendar, Clock, Check, X, AlertCircle, Play } from "lucide-react";
import { SuggestedPlan, Subtask } from "../types";

interface SuggestedPlanModalProps {
  plan: SuggestedPlan;
  onAccept: (subtasks: Subtask[], syncToCalendar: boolean) => void;
  onReject: () => void;
}

export default function SuggestedPlanModal({
  plan,
  onAccept,
  onReject,
}: SuggestedPlanModalProps) {
  const [editedSubtasks, setEditedSubtasks] = useState<Subtask[]>(() =>
    plan.subtasks.map((st) => ({
      ...st,
      hours: st.hours || 2, // default 2 hours estimate
    }))
  );
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleFieldChange = (index: number, field: keyof Subtask, value: any) => {
    setEditedSubtasks((prev) =>
      prev.map((st, i) => (i === index ? { ...st, [field]: value } : st))
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 30 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-base">Agent 2 — Suggested Action Plan</h3>
              <p className="text-xs text-sky-400 font-semibold uppercase tracking-wider">Task Breaker Engine</p>
            </div>
          </div>
          <button
            onClick={onReject}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-850 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[480px]">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planning Objective</h4>
            <p className="text-sm font-bold text-slate-100 mt-1">"{plan.deadlineTitle}"</p>
          </div>

          {/* Suggested starting milestone */}
          <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-2xl flex items-start space-x-3">
            <Play className="w-4 h-4 text-sky-400 fill-sky-400 mt-0.5 flex-shrink-0 animate-pulse" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider">Aura Recommendation</span>
              <p className="text-xs text-slate-200">
                Begin immediately with the primary milestone: <span className="font-bold text-white">"{plan.startSuggestion}"</span>. This minimizes starting friction.
              </p>
            </div>
          </div>

          {/* Subtasks breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subtask Breakdown & Estimates</h4>
            <div className="space-y-2.5">
              {editedSubtasks.map((st, idx) => {
                const isEditing = editingIndex === idx;
                return (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-950/60 border border-slate-850 hover:border-slate-800 rounded-xl flex flex-col space-y-2 transition"
                  >
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => handleFieldChange(idx, "title", e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Due Date</label>
                            <input
                              type="date"
                              value={st.dueDate}
                              onChange={(e) => handleFieldChange(idx, "dueDate", e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-500 uppercase">Est. Hours</label>
                            <input
                              type="number"
                              value={st.hours || 1}
                              onChange={(e) => handleFieldChange(idx, "hours", parseInt(e.target.value) || 1)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingIndex(null)}
                          className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px] font-bold transition"
                        >
                          Done Editing
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              STEP {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-200">{st.title}</span>
                          </div>
                          {st.notes && <p className="text-[11px] text-slate-400 font-sans italic">"{st.notes}"</p>}
                        </div>

                        <div className="flex flex-col items-end flex-shrink-0 text-[10px] font-mono text-slate-400 space-y-1.5">
                          <span className="flex items-center space-x-1 font-semibold text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>{st.dueDate}</span>
                          </span>
                          <span className="flex items-center space-x-1 font-semibold text-sky-400">
                            <Clock className="w-3.5 h-3.5 text-sky-500" />
                            <span>{st.hours} hrs</span>
                          </span>
                          <button
                            onClick={() => setEditingIndex(idx)}
                            className="text-[9px] font-bold text-slate-500 hover:text-white hover:underline pt-1 transition"
                          >
                            Edit parameters
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sync to Calendar choice */}
          <div className="flex items-center justify-between p-4 bg-slate-950/40 border border-slate-850/80 rounded-2xl">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-200">Google Calendar Synchronization</p>
              <p className="text-[10px] text-slate-500">Automatically sync these subtask milestones into your Google Calendar calendar.</p>
            </div>
            <button
              onClick={() => setSyncToCalendar(!syncToCalendar)}
              className={`w-9 h-5.5 flex items-center rounded-full p-0.5 transition-all duration-200 cursor-pointer ${
                syncToCalendar ? "bg-sky-600 justify-end" : "bg-slate-800 justify-start"
              }`}
            >
              <span className="w-4 h-4 bg-white rounded-full shadow-md" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-end space-x-3">
          <button
            onClick={onReject}
            className="px-4.5 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-850 transition"
          >
            Reject Plan
          </button>
          <button
            onClick={() => onAccept(editedSubtasks, syncToCalendar)}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/10 flex items-center space-x-1.5 transition active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3.5px]" />
            <span>Deploy Action Plan</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
