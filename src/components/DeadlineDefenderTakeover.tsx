import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, AlertTriangle, Sparkles, Mail, ListTodo, Clipboard, Check, X, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { Deadline, Subtask } from "../types";

interface DeadlineDefenderTakeoverProps {
  deadline: Deadline;
  onClose: () => void;
  onUpdateDeadline: (deadline: Deadline) => void;
}

export default function DeadlineDefenderTakeover({
  deadline,
  onClose,
  onUpdateDeadline,
}: DeadlineDefenderTakeoverProps) {
  const [activeAction, setActiveAction] = useState<"none" | "draft" | "extension" | "micro">("none");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [microTasks, setMicroTasks] = useState<Subtask[]>([]);

  const handleActionClick = async (action: "draft" | "extension" | "micro") => {
    setActiveAction(action);
    setIsLoading(true);
    setResult(null);
    setMicroTasks([]);

    try {
      if (action === "draft") {
        // Generate Starter draft using our server starter generator
        const res = await fetch("/api/generate-starter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskTitle: deadline.title,
            taskDescription: deadline.description,
            type: "draft",
          }),
        });
        if (!res.ok) throw new Error("Draft failed");
        const data = await res.json();
        setResult(data.draft);
      } else if (action === "extension") {
        // Generate Extension request email
        const res = await fetch("/api/generate-starter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskTitle: deadline.title,
            taskDescription: deadline.description,
            type: "email",
          }),
        });
        if (!res.ok) throw new Error("Email failed");
        const data = await res.json();
        setResult(data.draft);
      } else if (action === "micro") {
        // Break into hyper-specific micro-tasks (15 min each to defeat friction)
        const res = await fetch("/api/smart-planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: deadline.title + " (15-min Micro-tasks to beat procrastination)",
            description: deadline.description,
            dueDate: deadline.dueDate,
          }),
        });
        if (!res.ok) throw new Error("Micro plan failed");
        const data = await res.json();
        setMicroTasks(
          data.subtasks.map((st: any) => ({
            title: st.title + " (15 min micro-step)",
            dueDate: st.dueDate,
            completed: false,
            notes: st.notes,
          }))
        );
      }
    } catch (err) {
      console.error(err);
      setResult("Encountered security error. Please verify GEMINI_API_KEY in Settings.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployMicroTasks = () => {
    onUpdateDeadline({
      ...deadline,
      subtasks: [...deadline.subtasks, ...microTasks],
      progress: 0,
    });
    alert("Micro-tasks deployed! Let's conquer this first 15-minute chunk.");
    onClose();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto flex items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600/10 via-transparent to-transparent opacity-60" />
      
      <div className="max-w-4xl w-full bg-slate-900 border border-slate-850 rounded-3xl shadow-2xl overflow-hidden relative backdrop-blur-md">
        
        {/* Top Header warning bar */}
        <div className="bg-red-950/40 p-6 border-b border-red-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-red-400">
            <Shield className="w-6 h-6 animate-pulse" />
            <div>
              <h2 className="font-display font-black text-white text-base md:text-lg uppercase tracking-wider">
                Agent 3 — Deadline Defender
              </h2>
              <p className="text-xs text-red-400 font-semibold uppercase tracking-widest">
                Urgent Procrastination Breach Takeover
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left Column: Target status */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 bg-red-600/20 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-red-500/20">
                CRITICAL AT-RISK RADAR
              </span>
              <h1 className="font-display text-2xl font-black text-white leading-tight">
                "{deadline.title}" is due in less than 24 hours!
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Our defense system detects <span className="text-red-400 font-bold">0% progress</span> on this primary commitment. Procrastination has triggered Agent 3. We are taking active mitigation steps. Choose an automated strategy:
              </p>
            </div>

            {/* Strategy Options buttons */}
            <div className="space-y-3 pt-4">
              <button
                onClick={() => handleActionClick("draft")}
                className={`w-full p-4 rounded-2xl border text-left transition duration-200 flex items-start space-x-3 cursor-pointer ${
                  activeAction === "draft"
                    ? "bg-red-500/10 border-red-500 text-white"
                    : "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-800"
                }`}
              >
                <Sparkles className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">Generate Starter Outline</p>
                  <p className="text-[10px] text-slate-500 font-medium">Auto-forges partial work, arguments, or structures to start immediately.</p>
                </div>
              </button>

              <button
                onClick={() => handleActionClick("extension")}
                className={`w-full p-4 rounded-2xl border text-left transition duration-200 flex items-start space-x-3 cursor-pointer ${
                  activeAction === "extension"
                    ? "bg-red-500/10 border-red-500 text-white"
                    : "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-800"
                }`}
              >
                <Mail className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">Draft Extension Request Email</p>
                  <p className="text-[10px] text-slate-500 font-medium">Produces a professional, high-agency extension proposal to stakeholders.</p>
                </div>
              </button>

              <button
                onClick={() => handleActionClick("micro")}
                className={`w-full p-4 rounded-2xl border text-left transition duration-200 flex items-start space-x-3 cursor-pointer ${
                  activeAction === "micro"
                    ? "bg-red-500/10 border-red-500 text-white"
                    : "bg-slate-950 border-slate-850 text-slate-300 hover:border-slate-800"
                }`}
              >
                <ListTodo className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white">Break Into 15-Min Micro-Tasks</p>
                  <p className="text-[10px] text-slate-500 font-medium">Splits cognitive blocks into low-friction steps that anyone can do in 15 minutes.</p>
                </div>
              </button>
            </div>
          </div>

          {/* Right Column: Active drafting workspace */}
          <div className="bg-slate-950/80 border border-slate-850 rounded-2xl p-6 flex flex-col justify-between min-h-[400px]">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Defender Strategy Workspace</span>
              </div>

              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
                  <p className="text-slate-400 text-xs italic">Aura is forging dynamic defenses...</p>
                </div>
              ) : activeAction === "none" ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                  <Shield className="w-12 h-12 text-slate-800" />
                  <div>
                    <p className="text-slate-500 text-xs font-bold">Select Strategy</p>
                    <p className="text-[10px] text-slate-600 mt-0.5 max-w-xs mx-auto">Click one of the three mitigation paths on the left to deploy automated AI defenses.</p>
                  </div>
                </div>
              ) : activeAction === "micro" ? (
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5 overflow-y-auto max-h-[240px] pr-1">
                    {microTasks.map((t, idx) => (
                      <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-start space-x-2.5">
                        <span className="text-[9px] font-black bg-red-500/20 text-red-400 w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{t.title}</p>
                          {t.notes && <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">{t.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleDeployMicroTasks}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/10 flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3px]" />
                    <span>Deploy 15-Min Micro-tasks</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  <div className="flex-1 bg-slate-900 border border-slate-850 rounded-xl p-4 font-mono text-[11px] leading-relaxed relative max-h-[260px] overflow-y-auto text-slate-350">
                    <button
                      onClick={() => handleCopy(result || "")}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                    </button>
                    <p className="whitespace-pre-wrap pr-4">{result || "Forging text..."}</p>
                  </div>

                  <div className="p-3 bg-red-950/20 rounded-xl border border-red-500/10 text-[10px] text-red-200 leading-normal">
                    <span className="font-bold uppercase tracking-wider block mb-0.5">Security Tip</span>
                    Copy this draft instantly, paste it into your editor or email, and take your first action. Inertia is your only enemy.
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-850 pt-4 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold">Aura Defender Status: INTRUSION BLOCK</span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white font-bold flex items-center space-x-1 hover:underline"
              >
                <span>Ignore & Close</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
