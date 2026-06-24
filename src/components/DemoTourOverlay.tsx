import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, Flame, Radio, Play, Pause, X, ChevronRight, HelpCircle, AlertTriangle } from "lucide-react";

interface DemoTourOverlayProps {
  step: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export default function DemoTourOverlay({
  step,
  onNext,
  onPrev,
  onClose,
  isPlaying,
  onTogglePlay,
}: DemoTourOverlayProps) {
  const [progress, setProgress] = useState(0);

  // Auto-advance step every 10 seconds if isPlaying is true
  useEffect(() => {
    if (!isPlaying) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const interval = 100; // update progress every 100ms
    const totalDuration = 10000; // 10 seconds per step
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress(Math.min((elapsed / totalDuration) * 100, 100));

      if (elapsed >= totalDuration) {
        clearInterval(timer);
        onNext();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [step, isPlaying]);

  const stepsInfo = [
    {
      title: "1. Populating Demo Objectives",
      badge: "DEMO ENGINE INITIALIZED",
      desc: "Welcome to the Deadline Guardian Showcase! First, our secure system activates Demo Mode and pre-populates 5 realistic deadline targets (Hackathon Submission, Prep Team Meeting, etc.) with pre-configured milestone maps.",
      agentText: "System: Pre-populating 5 premium targets in secure cloud cache.",
    },
    {
      title: "2. Agent 1 — Deadline Hunter scanning",
      badge: "AGENT 1 ONLINE",
      desc: "Deadline Hunter scans Gmail inbox periodically. Look at the 'Newly Found' feed on the dashboard! A new high-priority message was detected: 'Deploy Production Hotfix - June 24'! You can plan this task instantly.",
      agentText: "Deadline Hunter: Found client email with due date: June 24.",
    },
    {
      title: "3. Agent 2 — Task Breaker Planning",
      badge: "AGENT 2 ACTIVE",
      desc: "Task Breaker splits any complex deadline into 3-5 subtasks with estimated hours and a suggested starting point, then syncs them into Google Calendar. Click 'Accept' to commit them to your secure Firestore map.",
      agentText: "Task Breaker: Generating 4 logical subtasks for 'Submit Hackathon Project'.",
    },
    {
      title: "4. Agent 3 — Deadline Defender Takeover",
      badge: "AGENT 3 TRIGGERED",
      desc: "When deadlines approach under 24 hours with 0% progress, Deadline Defender triggers an intrusion takeover! It blocks distraction and auto-forges outline drafts, extension emails, or 15-minute micro-tasks.",
      agentText: "Deadline Defender: Threat level critical on 'Team Meeting Prep' (progress 0%).",
    },
    {
      title: "5. Aura Assistant Voice Queries",
      badge: "AURA VOICE ENGAGED",
      desc: "Tap the floating microphone button in the bottom-right corner! Aura understands commands like 'What's due today?' or 'Plan my week'. Try clicking standard suggestions to hear Aura's responses synthesized.",
      agentText: "Aura: Synthesizing auditory briefing. Reading today's agenda.",
    },
    {
      title: "6. Settings & Operations Control",
      badge: "COMMAND CENTER SECURED",
      desc: "Configure your parameters: toggle Google Calendar sync, adjust email scanning intervals (hourly/daily), toggle voice coaching, or flip themes. Your productivity score improves as you complete objectives!",
      agentText: "System: All systems safe. Aura Standby.",
    },
  ];

  const currentInfo = stepsInfo[step - 1] || stepsInfo[0];

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 pointer-events-none">
      <div className="pointer-events-auto">
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="bg-slate-950 border border-blue-500/30 text-white rounded-2xl shadow-2xl p-5 relative overflow-hidden"
        >
          {/* Neon side accent */}
          <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600" />
          
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider animate-pulse">
                  {currentInfo.badge}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">
                  Step {step} of 6
                </span>
              </div>
              <h3 className="font-display font-extrabold text-sm text-white">
                {currentInfo.title}
              </h3>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onTogglePlay}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 transition"
                title={isPlaying ? "Pause Tour" : "Play Tour"}
              >
                {isPlaying ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              </button>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-900 transition"
                title="Stop Showcase"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium mt-2.5">
            {currentInfo.desc}
          </p>

          <div className="mt-4 p-2.5 bg-slate-900/60 rounded-xl border border-slate-900 flex items-center space-x-2 text-[10px] text-blue-300 font-mono">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse flex-shrink-0" />
            <span className="truncate">{currentInfo.agentText}</span>
          </div>

          {/* Controls footer */}
          <div className="mt-4 pt-4 border-t border-slate-900 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500">
              <span>Automatic Walkthrough Timer:</span>
              <span className="text-blue-400 font-mono">{isPlaying ? "Active" : "Paused"}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onPrev}
                disabled={step === 1}
                className="px-2.5 py-1 text-[10px] font-bold bg-slate-900 text-slate-400 hover:text-white rounded border border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                Back
              </button>
              <button
                onClick={onNext}
                disabled={step === 6}
                className="px-2.5 py-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white rounded border border-blue-500 transition flex items-center space-x-1"
              >
                <span>{step === 6 ? "Finish" : "Next Step"}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Mini progress bar on active step */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
