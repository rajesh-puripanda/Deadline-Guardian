import React, { useState } from "react";
import {
  Zap,
  Flame,
  ListTodo,
  Check,
  ChevronRight,
  Clipboard,
  X,
  Sparkles,
  ArrowLeft,
  Volume2,
} from "lucide-react";
import { Deadline, Subtask } from "../types";

interface EmergencyFocusProps {
  deadline: Deadline;
  onUpdateDeadline: (deadline: Deadline) => void;
  onClose: () => void;
}

export default function EmergencyFocus({
  deadline,
  onUpdateDeadline,
  onClose,
}: EmergencyFocusProps) {
  const [activeSubtaskIdx, setActiveSubtaskIdx] = useState<number>(() => {
    // Default to the first incomplete subtask
    const idx = deadline.subtasks.findIndex((s) => !s.completed);
    return idx === -1 ? 0 : idx;
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Toggle Subtask
  const handleToggleSubtask = (idx: number) => {
    const updatedSubtasks = deadline.subtasks.map((st, i) => {
      if (i === idx) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    const completedCount = updatedSubtasks.filter((s) => s.completed).length;
    const progress = updatedSubtasks.length > 0 ? Math.round((completedCount / updatedSubtasks.length) * 100) : deadline.progress;

    onUpdateDeadline({
      ...deadline,
      subtasks: updatedSubtasks,
      progress,
      completed: progress === 100 ? true : deadline.completed,
    });
  };

  // Quick finish entire deadline
  const handleCompleteAll = () => {
    onUpdateDeadline({
      ...deadline,
      completed: true,
      progress: 100,
      subtasks: deadline.subtasks.map((s) => ({ ...s, completed: true })),
    });
    alert("Breach averted! Congratulations on securing this objective.");
    onClose();
  };

  // Smart Draft helper for current subtask
  const handleGenerateStarterForSubtask = async (subtask: Subtask) => {
    setIsGenerating(true);
    setDraftContent(null);
    try {
      const res = await fetch("/api/generate-starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: deadline.title,
          taskDescription: deadline.description,
          subtaskTitle: subtask.title,
          type: "outline", // default outlining in emergency mode to start fast
        }),
      });

      if (!res.ok) throw new Error("Starter failed");
      const data = await res.json();
      setDraftContent(data.draft);
    } catch (err) {
      console.error(err);
      alert("Failed to generate focus outline. Verify your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeSubtask = deadline.subtasks[activeSubtaskIdx];

  return (
    <div id="emergency-focus-overlay" className="fixed inset-0 bg-slate-950 text-slate-100 z-50 overflow-y-auto flex flex-col p-6 font-sans">
      
      {/* Top Controls Bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between mb-8 pb-4 border-b border-slate-900">
        <button
          onClick={onClose}
          className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Emergency View</span>
        </button>

        <div className="flex items-center space-x-2 bg-red-950/40 border border-red-500/20 px-3.5 py-1.5 rounded-full text-red-400 text-xs font-bold animate-pulse">
          <Flame className="w-3.5 h-3.5 fill-red-400" />
          <span>Emergency Defense Mode Active</span>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        
        {/* Left 2 Columns: Single-Focus Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6.5 relative overflow-hidden space-y-4">
            <span className="text-[10px] bg-red-500 text-white font-bold px-3 py-1 rounded-full uppercase tracking-widest">
              Active Focus Target
            </span>
            <h1 className="font-display text-2xl md:text-3xl font-black text-white leading-tight">
              {deadline.title}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-sans font-medium">
              {deadline.description || "No full description provided. The deadline approaches in less than 48 hours."}
            </p>

            {/* Micro progress bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>Total Defense Progress</span>
                <span className="text-red-400">{deadline.progress}%</span>
              </div>
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-300"
                  style={{ width: `${deadline.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Subtask selection and single focus step */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6.5 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-white flex items-center space-x-2">
                <ListTodo className="w-5 h-5 text-red-500" />
                <span>Single-Focus Tactical Steps</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Focus purely on one single step below. Do not think about the end goal yet.</p>
            </div>

            {deadline.subtasks.length === 0 ? (
              <div className="p-6 bg-slate-950 rounded-2xl text-center border border-slate-900">
                <p className="text-slate-500 text-xs font-semibold">No subtasks mapped for this target.</p>
                <button
                  onClick={handleCompleteAll}
                  className="mt-3.5 px-4.5 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-red-500/25"
                >
                  Mark Entire Objective Secured
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {deadline.subtasks.map((subtask, idx) => {
                  const isActive = activeSubtaskIdx === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveSubtaskIdx(idx);
                        setDraftContent(null);
                      }}
                      className={`p-4 rounded-2xl border transition-all duration-150 flex items-start space-x-3 cursor-pointer ${
                        isActive
                          ? "bg-slate-900 border-red-500/30 shadow-md ring-1 ring-red-500/10"
                          : subtask.completed
                          ? "bg-slate-950/30 border-slate-900/50 opacity-40"
                          : "bg-slate-950/60 border-slate-900 hover:border-slate-850"
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSubtask(idx);
                        }}
                        className={`p-1 mt-0.5 rounded-lg border transition ${
                          subtask.completed
                            ? "bg-red-500 border-red-500 text-white"
                            : "border-slate-700 text-transparent hover:border-red-500 hover:text-red-500"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm font-bold truncate ${subtask.completed ? "line-through text-slate-500" : "text-white"}`}>
                            {subtask.title}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{subtask.dueDate}</span>
                        </div>
                        {subtask.notes && (
                          <p className="text-xs text-slate-400 leading-relaxed mt-1 font-sans">{subtask.notes}</p>
                        )}

                        {isActive && !subtask.completed && (
                          <div className="mt-4.5 pt-4.5 border-t border-slate-850 space-y-3">
                            <div className="flex items-center space-x-1.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Focus Assistant</span>
                            </div>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Let's break the blank canvas. Click below to generate a rapid step-by-step outline draft tailored specifically for this milestone.
                            </p>
                            <button
                              onClick={() => handleGenerateStarterForSubtask(subtask)}
                              disabled={isGenerating}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center space-x-1 disabled:opacity-50"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{isGenerating ? "Forging..." : "Generate Focus Starter"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Live Drafting Arena */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6.5 space-y-4 flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-red-500 animate-pulse" />
                <span>AI Live Drafting Arena</span>
              </div>

              {isGenerating ? (
                <div className="p-12 text-center space-y-3">
                  <div className="flex justify-center items-center space-x-1.5">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-bounce" />
                  </div>
                  <p className="text-slate-400 text-xs italic">Aura is generating a rapid draft outline...</p>
                </div>
              ) : draftContent ? (
                <div className="bg-slate-950 text-slate-200 rounded-2xl p-5 border border-slate-900 font-mono text-[11px] leading-relaxed relative max-h-96 overflow-y-auto animate-fadeIn shadow-inner">
                  <button
                    onClick={() => copyToClipboard(draftContent)}
                    className="absolute top-3 right-3 p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition border border-slate-850"
                    title="Copy Content"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                  </button>
                  <p className="whitespace-pre-wrap pr-6">{draftContent}</p>
                </div>
              ) : (
                <div className="p-8 text-center space-y-3 bg-slate-950/40 border border-dashed border-slate-850 rounded-2xl py-12">
                  <Flame className="w-8 h-8 text-slate-800 mx-auto" />
                  <div>
                    <p className="text-slate-500 text-xs font-bold">Arena Clear</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">Select an incomplete task step on the left and tap "Generate Focus Starter" to kickstart the draft.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4.5 border-t border-slate-850 space-y-3.5">
              <div className="bg-red-950/20 p-4 rounded-2xl border border-red-500/15">
                <p className="text-xs text-red-200 leading-normal font-sans font-medium">
                  <span className="font-bold">Aura Tactics:</span> No need to make it perfect. Just paste the generated outline, fill in the first bullet, and save. Complete 100% of this step to secure the perimeter.
                </p>
              </div>

              <button
                onClick={handleCompleteAll}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-500/10 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 fill-white animate-pulse" />
                <span>Override & Complete All</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
