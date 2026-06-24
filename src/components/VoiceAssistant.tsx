import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, Sparkles, Send, X, CornerDownLeft, MessageSquare, History, Play, AlertCircle, Calendar } from "lucide-react";
import { Deadline, UserPreferences } from "../types";

interface VoiceAssistantProps {
  deadlines: Deadline[];
  onUpdateDeadline: (deadline: Deadline) => void;
  onOpenEmergency: (deadline: Deadline) => void;
  preferences: UserPreferences;
}

interface ChatMessage {
  id: string;
  sender: "user" | "aura";
  text: string;
  timestamp: string;
}

export default function VoiceAssistant({
  deadlines,
  onUpdateDeadline,
  onOpenEmergency,
  preferences,
}: VoiceAssistantProps) {
  // If voice assistant is turned off in settings, do not render anything
  if (!preferences.voiceAssistantEnabled) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "aura",
      text: "Hello! I am Aura, your Deadline Guardian Voice Coach. How can I protect your time today? Try asking: 'What's due today?'",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if webkitSpeechRecognition or SpeechRecognition is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setTranscript("Listening...");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleNewMessage(text, "user");
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        setTranscript("Speech error. Let's try text!");
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Scroll to bottom when message arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const toggleListen = () => {
    if (!voiceSupported) {
      alert("Speech recognition is not fully supported in this environment. Please type your query!");
      setIsOpen(true);
      return;
    }

    if (!isOpen) setIsOpen(true);

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (synthRef.current) {
        synthRef.current.cancel();
        setIsSpeaking(false);
      }
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Start recognition error:", err);
      }
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current || !preferences.soundEnabled) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const handleNewMessage = async (text: string, sender: "user" | "aura") => {
    if (!text || text.trim() === "" || text === "Listening...") return;

    const newMessage: ChatMessage = {
      id: Math.random().toString(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMessage]);

    if (sender === "user") {
      setIsLoading(true);
      await routeVoiceCommand(text);
    }
  };

  // Local rule-based command engine to trigger immediate client-side operations, falling back to server Gemini API
  const routeVoiceCommand = async (queryText: string) => {
    const q = queryText.toLowerCase().trim();
    let replyText = "";
    let actionTriggered = false;

    // Command 1: "What's due today?"
    if (q.includes("due today") || q.includes("due right now") || q.includes("for today")) {
      const todayStr = new Date().toISOString().split("T")[0];
      // Note: in demo mode, our sample dates are structured relative to June 2026. Let's look at either real today or June 23, 2026!
      const todayDeadlines = deadlines.filter((d) => d.dueDate === todayStr || d.dueDate === "2026-06-23");
      if (todayDeadlines.length === 0) {
        replyText = "Your radar is clear today! There are no deadlines due on today's calendar.";
      } else {
        replyText = `You have ${todayDeadlines.length} deadline${todayDeadlines.length > 1 ? "s" : ""} due today: ${todayDeadlines.map((d) => `"${d.title}"`).join(", ")}. Let's work on them!`;
      }
      actionTriggered = true;
    }

    // Command 2: "Plan my week"
    else if (q.includes("plan my week") || q.includes("schedule my week") || q.includes("plan week")) {
      // Auto-schedules deadlines across the week: generates subtasks for all upcoming deadlines
      const upcoming = deadlines.filter((d) => !d.completed);
      if (upcoming.length === 0) {
        replyText = "No active deadlines to plan this week. You're completely caught up!";
      } else {
        replyText = `Understood. I have initiated the Agent 2 Task Breaker. I have automatically planned subtasks and calendar events for ${upcoming.length} upcoming deadlines across this week. Let's beat procrastination!`;
        // In-app side-effect: auto-plan them
        for (const d of upcoming) {
          if (d.subtasks.length === 0) {
            // Add mock subtasks
            onUpdateDeadline({
              ...d,
              subtasks: [
                { title: "Define Requirements & Outline", dueDate: d.dueDate, completed: false, notes: "Break down parameters and review requirements.", hours: 2 },
                { title: "Draft First Version", dueDate: d.dueDate, completed: false, notes: "Begin rough write-up/setup.", hours: 4 },
                { title: "Review & Polish", dueDate: d.dueDate, completed: false, notes: "Final security review and submission details.", hours: 1.5 },
              ],
            });
          }
        }
      }
      actionTriggered = true;
    }

    // Command 3: "I'm stressed about..." or "I'm stressed"
    else if (q.includes("stressed") || q.includes("anxious") || q.includes("stress")) {
      const critical = deadlines.find((d) => !d.completed && d.status === "critical");
      if (critical) {
        replyText = `Procrastination stress is normal. I notice "${critical.title}" is highly critical. I have pre-configured a draft outlined for you. I am also triggering the Emergency Focus dashboard. Let's focus on just the first small task!`;
        onOpenEmergency(critical);
      } else {
        const anyActive = deadlines.find((d) => !d.completed);
        if (anyActive) {
          replyText = `Breathe in. Breathe out. Let's focus on "${anyActive.title}". I am opening the subtask breakdown to clear your cognitive load.`;
          onOpenEmergency(anyActive);
        } else {
          replyText = "You have no active deadlines on your plate. Relax, you are totally safe!";
        }
      }
      actionTriggered = true;
    }

    // Command 4: "What did I miss?"
    else if (q.includes("miss") || q.includes("what did i miss") || q.includes("missed") || q.includes("overlooked")) {
      const overdue = deadlines.filter((d) => {
        const days = Math.ceil((new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return days < 0 && !d.completed;
      });
      const lowProgress = deadlines.filter((d) => !d.completed && d.status === "critical" && d.progress === 0);

      if (overdue.length === 0 && lowProgress.length === 0) {
        replyText = "Incredible! You haven't missed a single commitment. All items are synchronized and on schedule.";
      } else {
        replyText = `Our sensors show some risks: ${overdue.length > 0 ? `You have ${overdue.length} overdue item(s): ${overdue.map((d) => d.title).join(", ")}.` : ""} ${lowProgress.length > 0 ? `Also, "${lowProgress[0].title}" has 0% progress despite being due soon.` : ""} Let's handle these immediately.`;
      }
      actionTriggered = true;
    }

    // Default: Ask Gemini voice query API
    if (!actionTriggered) {
      try {
        const res = await fetch("/api/voice-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: queryText,
            deadlines: deadlines.map((d) => ({
              title: d.title,
              dueDate: d.dueDate,
              status: d.status,
              progress: d.progress,
              completed: d.completed,
            })),
            today: new Date().toISOString().split("T")[0],
          }),
        });

        if (!res.ok) throw new Error("Assistant error");
        const data = await res.json();
        replyText = data.text;
      } catch (err) {
        console.error(err);
        replyText = "I encountered a security shielding error. Please make sure your GEMINI_API_KEY is configured in Settings.";
      }
    }

    setIsLoading(false);
    handleNewMessage(replyText, "aura");
    speakText(replyText);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const quickPrompts = [
    "What's due today?",
    "Plan my week",
    "I'm stressed about the report",
    "What did I miss?",
  ];

  return (
    <>
      {/* Floating Microphone Trigger Button (Bottom Right) */}
      <div className="fixed bottom-24 right-6 z-40 pointer-events-none">
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="pointer-events-auto"
        >
          {isListening && (
            <span className="absolute -inset-2.5 rounded-full bg-blue-500/25 animate-ping" />
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer transition-all duration-300 ${
              isListening
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/30"
                : isOpen
                ? "bg-slate-900 border border-slate-800 text-blue-400"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
            }`}
          >
            {isListening ? (
              <MicOff className="w-5.5 h-5.5 animate-pulse" />
            ) : isOpen ? (
              <X className="w-5.5 h-5.5" />
            ) : (
              <Mic className="w-5.5 h-5.5" />
            )}
          </button>
        </motion.div>
      </div>

      {/* Floating Voice Drawer Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", duration: 0.35 }}
            className="fixed bottom-40 right-6 w-96 max-w-full h-[460px] bg-slate-950/95 border border-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-md"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                <div>
                  <h3 className="text-xs font-display font-bold text-white tracking-wide uppercase">Aura Voice Coach</h3>
                  <p className="text-[9px] text-slate-500 font-medium">Securing Deadlines via Natural Voice</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="p-1 hover:bg-slate-800 text-red-400 rounded-md transition"
                    title="Stop speaking"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat message flow container */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
            >
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/5"
                        : "bg-slate-900 border border-slate-850 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span className="block text-[8px] text-right mt-1.5 opacity-50 font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900 border border-slate-850 rounded-2xl rounded-tl-none p-3.5 space-y-2 max-w-[85%]">
                    <div className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Microphone button inside assistant & text entry */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
              {/* Quick Prompt recommendations */}
              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {quickPrompts.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleNewMessage(p, "user")}
                    className="text-[9px] bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-800 text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg font-mono transition flex items-center space-x-1"
                  >
                    <span>{p}</span>
                    <CornerDownLeft className="w-2 h-2 opacity-50" />
                  </button>
                ))}
              </div>

              {/* Input text fallback with integrated mic toggle */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const val = target.elements.textQuery.value;
                  if (val && val.trim() !== "") {
                    handleNewMessage(val, "user");
                    target.reset();
                  }
                }}
                className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-850 focus-within:border-blue-500/40 transition"
              >
                <input
                  name="textQuery"
                  placeholder={isListening ? "Listening..." : "Type command manually..."}
                  className="flex-1 bg-transparent border-0 text-slate-200 text-xs px-3 py-2 focus:outline-none focus:ring-0 disabled:opacity-50"
                  disabled={isListening}
                />
                
                {/* Embedded microphone trigger */}
                <button
                  type="button"
                  onClick={toggleListen}
                  className={`p-1.5 rounded-lg mr-1 transition ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse"
                      : "text-slate-400 hover:text-white hover:bg-slate-850"
                  }`}
                  title={isListening ? "Stop listening" : "Talk with Aura"}
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
