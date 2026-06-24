import React, { useState } from "react";
import {
  Plus,
  Flame,
  Clock,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Clipboard,
  Check,
  FileText,
  Mail,
  ListTodo,
  RefreshCw,
  X,
} from "lucide-react";
import { Deadline, Subtask } from "../types";

interface DeadlinesListProps {
  deadlines: Deadline[];
  onAddDeadline: (deadline: Omit<Deadline, "id" | "userId" | "createdAt">) => void;
  onUpdateDeadline: (deadline: Deadline) => void;
  onDeleteDeadline: (id: string) => void;
  onOpenEmergency: (deadline: Deadline) => void;
}

export default function DeadlinesList({
  deadlines,
  onAddDeadline,
  onUpdateDeadline,
  onDeleteDeadline,
  onOpenEmergency,
}: DeadlinesListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "critical" | "at-risk" | "safe" | "completed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Subtask planning loading states
  const [planningId, setPlanningId] = useState<string | null>(null);

  // Draft generator states
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftType, setDraftType] = useState<"outline" | "email" | "draft">("outline");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Handle Add Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    // Calculate initial status
    const dueTime = new Date(dueDate).getTime();
    const nowTime = new Date().getTime();
    const daysLeft = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));
    
    let status: "safe" | "at-risk" | "critical" = "safe";
    if (daysLeft < 3) status = "critical";
    else if (daysLeft <= 7) status = "at-risk";

    onAddDeadline({
      title,
      description,
      dueDate,
      status,
      completed: false,
      subtasks: [],
      progress: 0,
      source: "manual",
    });

    setTitle("");
    setDescription("");
    setDueDate("");
    setShowAddForm(false);
  };

  // Toggle Subtask Completion
  const handleToggleSubtask = (deadline: Deadline, subtaskIndex: number) => {
    const updatedSubtasks = deadline.subtasks.map((st, idx) => {
      if (idx === subtaskIndex) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    // Recompute overall progress
    const completedCount = updatedSubtasks.filter((s) => s.completed).length;
    const progress = updatedSubtasks.length > 0 ? Math.round((completedCount / updatedSubtasks.length) * 100) : deadline.progress;

    onUpdateDeadline({
      ...deadline,
      subtasks: updatedSubtasks,
      progress,
      // If completed all, mark completed? Or leave to manual toggle
      completed: progress === 100 ? true : deadline.completed,
    });
  };

  // Toggle Entire Deadline Completion
  const handleToggleDeadline = (deadline: Deadline) => {
    const nextCompleted = !deadline.completed;
    onUpdateDeadline({
      ...deadline,
      completed: nextCompleted,
      progress: nextCompleted ? 100 : (deadline.subtasks.length > 0 ? Math.round((deadline.subtasks.filter(s => s.completed).length / deadline.subtasks.length) * 100) : 0),
    });
  };

  // Handle Smart Planner (AI auto-subtask breakdown)
  const handleSmartPlanner = async (deadline: Deadline) => {
    setPlanningId(deadline.id);
    try {
      const res = await fetch("/api/smart-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deadline.title,
          description: deadline.description,
          dueDate: deadline.dueDate,
          today: new Date().toISOString().split("T")[0],
        }),
      });

      if (!res.ok) throw new Error("Planner failed");
      const data = await res.json();

      onUpdateDeadline({
        ...deadline,
        subtasks: data.subtasks.map((st: any) => ({
          title: st.title,
          dueDate: st.dueDate,
          completed: false,
          notes: st.notes,
        })),
        progress: 0, // reset progress as new subtasks are loaded
      });
    } catch (err) {
      console.error(err);
      alert("Failed to generate subtasks. Please verify your GEMINI_API_KEY.");
    } finally {
      setPlanningId(null);
    }
  };

  // Handle Draft Generation
  const handleGenerateDraft = async (deadline: Deadline, subtaskTitle?: string) => {
    setDraftId(deadline.id);
    setIsGeneratingDraft(true);
    setGeneratedDraft(null);
    try {
      const res = await fetch("/api/generate-starter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: deadline.title,
          taskDescription: deadline.description,
          subtaskTitle: subtaskTitle || "",
          type: draftType,
        }),
      });

      if (!res.ok) throw new Error("Draft API failed");
      const data = await res.json();
      setGeneratedDraft(data.draft);
    } catch (err) {
      console.error(err);
      alert("Failed to generate draft. Please verify your GEMINI_API_KEY.");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Delete (with mandatory verification)
  const handleDeleteClick = (id: string, title: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the deadline: "${title}"?\nThis action cannot be undone.`
    );
    if (confirmed) {
      onDeleteDeadline(id);
    }
  };

  // Filter deadlines
  const filteredDeadlines = deadlines.filter((d) => {
    if (filter === "completed") return d.completed;
    if (d.completed) return false; // Hide completed in other lists
    if (filter === "all") return true;
    return d.status === filter;
  });

  // Calculate days remaining
  const getDaysLeft = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const today = new Date();
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div id="deadlines-list-tab" className="space-y-6">
      {/* Header and Add button */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Guardian Shield</h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">Add, manage, and break down your defensive targets.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1.5 px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/10 active:scale-95 transition-all"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? "Close Form" : "Add Deadline"}</span>
        </button>
      </div>

      {/* Add Form (Expandable) */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 animate-fadeIn">
          <h3 className="font-display font-bold text-slate-950 text-base">New Defense Objective</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Objective Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Q3 Finance Review"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-blue-500 transition focus:outline-none focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Due Date *</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-blue-500 transition focus:outline-none focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Description / Details</label>
            <textarea
              placeholder="Provide a quick summary or objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-blue-500 transition focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition"
          >
            Deploy Objective
          </button>
        </form>
      )}

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: "all", label: "All Active", color: "border-slate-200 hover:bg-slate-50" },
          { id: "critical", label: "Critical (<3d)", color: "text-red-600 border-red-200 bg-red-50/20 hover:bg-red-50/50" },
          { id: "at-risk", label: "At Risk (3-7d)", color: "text-amber-600 border-amber-200 bg-amber-50/20 hover:bg-amber-50/50" },
          { id: "safe", label: "On Track (>7d)", color: "text-emerald-600 border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/50" },
          { id: "completed", label: "Completed", color: "text-blue-600 border-blue-200 bg-blue-50/20 hover:bg-blue-50/50" },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              filter === opt.id
                ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                : opt.color
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Deadlines timeline list */}
      <div className="space-y-4">
        {filteredDeadlines.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center space-y-3">
            <ListTodo className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-slate-600 text-sm font-semibold">No Objectives Found</p>
              <p className="text-slate-400 text-xs mt-0.5">Adjust your filters or deploy a new deadline objective!</p>
            </div>
          </div>
        ) : (
          filteredDeadlines
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map((deadline) => {
              const isExpanded = expandedId === deadline.id;
              const daysLeft = getDaysLeft(deadline.dueDate);
              
              let badgeStyle = "text-emerald-600 bg-emerald-50 border-emerald-100";
              if (deadline.status === "critical") badgeStyle = "text-red-600 bg-red-50 border-red-100";
              else if (deadline.status === "at-risk") badgeStyle = "text-amber-600 bg-amber-50 border-amber-100";

              return (
                <div
                  key={deadline.id}
                  className={`bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? "border-slate-200 shadow-md ring-1 ring-slate-100"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {/* Summary Card Header */}
                  <div
                    onClick={() => {
                      setExpandedId(isExpanded ? null : deadline.id);
                      setGeneratedDraft(null); // clear drafts
                    }}
                    className="p-5 flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      {/* Completion check */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDeadline(deadline);
                        }}
                        className={`p-1 rounded-lg border transition ${
                          deadline.completed
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-300 text-transparent hover:border-blue-500 hover:text-blue-500"
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3px]" />
                      </button>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <h3 className={`font-display font-bold text-base truncate ${deadline.completed ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {deadline.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border ${badgeStyle}`}>
                            {daysLeft < 0 ? "Overdue" : daysLeft === 0 ? "Due Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} days`}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                            {deadline.source}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate max-w-xl">
                          {deadline.description || "No description provided."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 flex-shrink-0">
                      {/* Progress Bar */}
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400">{deadline.progress}% Progress</span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${deadline.completed ? "bg-blue-500" : (deadline.status === "critical" ? "bg-red-500" : "bg-emerald-500")}`}
                            style={{ width: `${deadline.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Expand Toggle */}
                      <div className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail section */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/40 p-6 space-y-6">
                      
                      {/* Main description details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Objective Details</h4>
                          <p className="text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-100 shadow-sm font-sans">
                            {deadline.description || "No full description loaded for this target objective."}
                          </p>
                          {deadline.originalSnippet && (
                            <div className="bg-slate-100/50 p-3.5 rounded-xl border border-slate-200/50 text-[11px] text-slate-500 leading-snug">
                              <span className="font-bold text-slate-600 block mb-1 uppercase tracking-wider text-[9px]">Original Email Snippet Context</span>
                              "{deadline.originalSnippet}"
                            </div>
                          )}
                        </div>

                        {/* Quick meta stats */}
                        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm space-y-3 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Parameters</h4>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Due Date:</span>
                              <span className="font-semibold text-slate-900">{deadline.dueDate}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Confidence Level:</span>
                              <span className="font-bold text-blue-600 uppercase tracking-wider text-[10px]">{deadline.confidence || "HIGH"}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Tactical Source:</span>
                              <span className="font-semibold text-slate-800 capitalize">{deadline.source}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2 pt-2 border-t border-slate-100">
                            {/* Emergency Mode trigger */}
                            {daysLeft <= 2 && !deadline.completed && (
                              <button
                                onClick={() => onOpenEmergency(deadline)}
                                className="flex-1 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-xs font-bold shadow-md hover:from-red-600 hover:to-rose-700 transition flex items-center justify-center space-x-1"
                              >
                                <Zap className="w-3.5 h-3.5 fill-white animate-bounce" />
                                <span>Emergency Mode</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClick(deadline.id, deadline.title)}
                              className="px-2.5 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition border border-slate-100 hover:border-red-100"
                              title="Abort target"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Subtasks breakdown */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                            <ListTodo className="w-4 h-4 text-slate-400" />
                            <span>Action Plan ({deadline.subtasks.length} milestones)</span>
                          </h4>

                          <button
                            onClick={() => handleSmartPlanner(deadline)}
                            disabled={planningId === deadline.id}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                            <span>{planningId === deadline.id ? "Planning..." : deadline.subtasks.length > 0 ? "Re-Plan with AI" : "Auto-Generate Subtasks"}</span>
                          </button>
                        </div>

                        {deadline.subtasks.length === 0 ? (
                          <div className="bg-white border border-dashed border-slate-200 rounded-xl p-5 text-center">
                            <p className="text-slate-500 text-xs font-medium">No subtasks defined. Tap the button above to auto-schedule a step-by-step roadmap!</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {deadline.subtasks.map((subtask, idx) => (
                              <div
                                key={idx}
                                className={`p-3.5 rounded-xl border flex items-start space-x-3 transition ${
                                  subtask.completed
                                    ? "bg-slate-50 border-slate-100 opacity-60"
                                    : "bg-white border-slate-100 shadow-sm hover:border-slate-200"
                                }`}
                              >
                                <button
                                  onClick={() => handleToggleSubtask(deadline, idx)}
                                  className={`p-0.5 mt-0.5 rounded-md border transition ${
                                    subtask.completed
                                      ? "bg-blue-600 border-blue-600 text-white"
                                      : "border-slate-300 text-transparent hover:border-blue-500 hover:text-blue-500"
                                  }`}
                                >
                                  <Check className="w-3 h-3 stroke-[3px]" />
                                </button>
                                <div className="min-w-0 flex-1">
                                  <div className="flex justify-between items-start gap-2">
                                    <p className={`text-xs font-bold truncate ${subtask.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                                      {subtask.title}
                                    </p>
                                    <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">{subtask.dueDate}</span>
                                  </div>
                                  {subtask.notes && (
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-1 font-sans">{subtask.notes}</p>
                                  )}
                                  {/* Generate Starter for this subtask */}
                                  {!subtask.completed && (
                                    <button
                                      onClick={() => handleGenerateDraft(deadline, subtask.title)}
                                      className="mt-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>Generate Starter</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI Starter Draft Generator */}
                      <div className="border-t border-slate-100 pt-5 space-y-3">
                        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <Sparkles className="w-4 h-4 text-blue-500" />
                          <span>AI Defense Starter</span>
                        </div>

                        <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex space-x-2">
                              {([
                                { id: "outline", label: "Project Outline", icon: FileText },
                                { id: "email", label: "Response Email", icon: Mail },
                                { id: "draft", label: "Executive Draft", icon: ListTodo },
                              ] as const).map((opt) => {
                                const Icon = opt.icon;
                                return (
                                  <button
                                    key={opt.id}
                                    onClick={() => setDraftType(opt.id)}
                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                      draftType === opt.id
                                        ? "bg-slate-900 border-slate-900 text-white"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                    }`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{opt.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            <button
                              onClick={() => handleGenerateDraft(deadline)}
                              disabled={isGeneratingDraft}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center justify-center space-x-1 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingDraft ? "animate-spin" : ""}`} />
                              <span>{isGeneratingDraft ? "Forging Starter..." : "Generate AI Starter"}</span>
                            </button>
                          </div>

                          {generatedDraft && (
                            <div className="bg-slate-950 text-slate-200 rounded-xl p-4.5 font-mono text-xs leading-relaxed relative animate-fadeIn max-h-72 overflow-y-auto">
                              <button
                                onClick={() => copyToClipboard(generatedDraft)}
                                className="absolute top-3 right-3 p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition border border-slate-800"
                                title="Copy content"
                              >
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Clipboard className="w-3.5 h-3.5" />}
                              </button>
                              <p className="whitespace-pre-wrap pr-6">{generatedDraft}</p>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
