import React from "react";
import {
  Flame,
  Clock,
  Sparkles,
  Inbox,
  AlertOctagon,
  CheckCircle,
  Calendar,
  Zap,
  ArrowRight,
  Shield,
  HelpCircle,
  Radio,
  Check,
  X,
  Play
} from "lucide-react";
import { Deadline, DiscoveredDeadline } from "../types";

interface DashboardProps {
  deadlines: Deadline[];
  onScanInbox: () => void;
  isScanning: boolean;
  onUpdateDeadline: (deadline: Deadline) => void;
  onViewDeadlines: () => void;
  onOpenEmergency: (deadline: Deadline) => void;
  discoveredDeadlines: DiscoveredDeadline[];
  onApproveDiscovery: (disc: DiscoveredDeadline) => void;
  onPlanDiscovery: (disc: DiscoveredDeadline) => void;
  onRejectDiscovery: (id: string) => void;
  onPlanDeadlineById: (id: string) => void;
}

export default function Dashboard({
  deadlines,
  onScanInbox,
  isScanning,
  onUpdateDeadline,
  onViewDeadlines,
  onOpenEmergency,
  discoveredDeadlines,
  onApproveDiscovery,
  onPlanDiscovery,
  onRejectDiscovery,
  onPlanDeadlineById,
}: DashboardProps) {
  // Compute metrics
  const activeDeadlines = deadlines.filter((d) => !d.completed);
  const totalCount = activeDeadlines.length;
  
  const criticalCount = activeDeadlines.filter((d) => d.status === "critical").length;
  const atRiskCount = activeDeadlines.filter((d) => d.status === "at-risk").length;
  const safeCount = activeDeadlines.filter((d) => d.status === "safe").length;
  const completedCount = deadlines.filter((d) => d.completed).length;

  // Compute Productivity Score (60% based on main completed deadlines, 40% on subtasks completed)
  const subtaskTotal = deadlines.reduce((acc, d) => acc + d.subtasks.length, 0);
  const subtaskCompleted = deadlines.reduce((acc, d) => acc + d.subtasks.filter(s => s.completed).length, 0);

  let productivityScore = 100;
  if (deadlines.length > 0) {
    const mainScore = (completedCount / deadlines.length) * 60;
    const subScore = subtaskTotal > 0 ? (subtaskCompleted / subtaskTotal) * 40 : 40;
    productivityScore = Math.round(mainScore + subScore);
  }

  let productivityLabel = "Shield Secured";
  let productivityColor = "from-indigo-600 to-blue-700 border-indigo-500/20";
  if (productivityScore < 55) {
    productivityLabel = "Procrastination Vulnerability";
    productivityColor = "from-red-600 to-rose-700 border-red-500/20";
  } else if (productivityScore < 80) {
    productivityLabel = "Standard Alert Mode";
    productivityColor = "from-amber-600 to-amber-700 border-amber-500/20";
  }

  // Find most urgent deadline under 48 hours and progress < 30
  const urgentProcrastinatingDeadline = activeDeadlines
    .filter((d) => {
      const daysLeft = Math.ceil(
        (new Date(d.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysLeft <= 2 && d.progress < 30;
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];

  const getDaysRemainingInfo = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const today = new Date();
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { days: diffDays, label: `Overdue by ${Math.abs(diffDays)}d`, color: "text-red-500 bg-red-50" };
    } else if (diffDays === 0) {
      return { days: diffDays, label: "Due Today", color: "text-red-600 bg-red-100 font-bold animate-pulse" };
    } else if (diffDays === 1) {
      return { days: diffDays, label: "Due Tomorrow", color: "text-red-500 bg-red-50 font-semibold" };
    } else {
      return { days: diffDays, label: `${diffDays} days left`, color: diffDays <= 2 ? "text-red-600 bg-red-50" : diffDays <= 7 ? "text-amber-600 bg-amber-50" : "text-emerald-600 bg-emerald-50" };
    }
  };

  return (
    <div id="dashboard-view-container" className="space-y-8 animate-fadeIn">
      {/* Top Header Panel */}
      <div id="dashboard-header-panel" className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 id="dashboard-main-greeting" className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Defense Operations
          </h2>
          <p id="dashboard-sub-greeting" className="text-slate-500 text-sm mt-0.5 font-medium">
            No deadlines breached on your watch today. Set up subtasks and stand ready.
          </p>
        </div>

        <button
          id="scan-inbox-trigger"
          onClick={onScanInbox}
          disabled={isScanning}
          className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            isScanning
              ? "bg-blue-50 text-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95"
          }`}
        >
          <Inbox className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Scanning Gmail & Calendar..." : "Scan My Inbox"}</span>
        </button>
      </div>

      {/* Procrastination Alert Banner */}
      {urgentProcrastinatingDeadline && (
        <div
          id="procrastination-alert-banner"
          className="relative bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-3xl p-6 shadow-xl shadow-red-500/20 overflow-hidden border border-red-400/20"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-40 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/15 rounded-2xl flex-shrink-0 text-white shadow-inner">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold tracking-wider uppercase mb-1.5">
                  Procrastination Alert
                </span>
                <h3 className="font-display text-lg font-bold leading-tight">
                  Breach imminent: "{urgentProcrastinatingDeadline.title}" is due in 48 hours!
                </h3>
                <p className="text-sm text-red-50/90 mt-1 max-w-2xl font-medium leading-relaxed">
                  Your current progress is only {urgentProcrastinatingDeadline.progress}%. Our system detects no recent milestone updates. Tap Emergency Mode now to trigger extreme focus assist.
                </p>
              </div>
            </div>

            <button
              id="emergency-mode-cta"
              onClick={() => onOpenEmergency(urgentProcrastinatingDeadline)}
              className="flex items-center space-x-2 px-5 py-3 bg-white hover:bg-slate-50 text-red-600 rounded-xl font-bold text-sm shadow-md transition-all duration-150 active:scale-95 flex-shrink-0 self-start md:self-auto"
            >
              <Zap className="w-4 h-4 text-red-500 fill-red-500 animate-bounce" />
              <span>Initiate Emergency Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Bento-Grid Metrics Section */}
      <div id="dashboard-bento-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Productivity Score (Wide/Highlighted Card) */}
        <div id="metric-card-productivity" className={`bg-gradient-to-br ${productivityColor} text-white p-5 rounded-2xl border shadow-md flex flex-col justify-between col-span-2 md:col-span-1 lg:col-span-1`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/75 text-[10px] font-bold uppercase tracking-wider">Productivity Score</p>
              <h4 className="text-3xl font-display font-black text-white mt-1">{productivityScore}/100</h4>
            </div>
            <div className="p-2 bg-white/10 rounded-lg text-white">
              <Sparkles className="w-4.5 h-4.5 fill-white/25" />
            </div>
          </div>
          <p className="text-[10px] text-white/80 font-semibold mt-3 flex items-center space-x-1 uppercase tracking-wide">
            <Shield className="w-3.5 h-3.5 mr-1" />
            <span>{productivityLabel}</span>
          </p>
        </div>

        {/* Metric Card: Critical */}
        <div id="metric-card-critical" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Critical (&lt;3 days)</p>
            <h4 className="text-3xl font-display font-black text-red-600 mt-1">{criticalCount}</h4>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-500">
            <Flame className="w-5 h-5 fill-red-500" />
          </div>
        </div>

        {/* Metric Card: At Risk */}
        <div id="metric-card-at-risk" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">At Risk (3-7 days)</p>
            <h4 className="text-3xl font-display font-black text-amber-500 mt-1">{atRiskCount}</h4>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card: Safe */}
        <div id="metric-card-safe" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">On Track (&gt;7 days)</p>
            <h4 className="text-3xl font-display font-black text-emerald-500 mt-1">{safeCount}</h4>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-500">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric Card: Completed */}
        <div id="metric-card-completed" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between col-span-2 md:col-span-1 lg:col-span-1">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Completed</p>
            <h4 className="text-3xl font-display font-black text-blue-600 mt-1">{completedCount}</h4>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Timeline & Agent 1 Newly Found Feed */}
      <div id="dashboard-split-layout" className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Newly Found feed & Timeline list of deadlines */}
        <div id="timeline-column" className="xl:col-span-2 space-y-8">
          
          {/* Agent 1 Newly Discovered Feed (Background scanner matches) */}
          {discoveredDeadlines.length > 0 && (
            <div id="newly-discovered-feed-widget" className="space-y-4 animate-slideUp bg-indigo-50/45 border border-indigo-100 p-6 rounded-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 bg-indigo-500/10 text-indigo-600 rounded-lg">
                    <Radio className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-extrabold text-indigo-900 tracking-tight">
                      Newly Found Feed — Agent 1 Detections
                    </h3>
                    <p className="text-[10px] text-indigo-500 font-semibold tracking-wide uppercase">Deadline Hunter background scans</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {discoveredDeadlines.map((disc) => (
                  <div
                    key={disc.id}
                    className="bg-white border border-indigo-100/50 rounded-2xl p-4.5 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-mono font-black rounded-md border border-indigo-100 uppercase tracking-wider">
                          Gmail scan
                        </span>
                        <span className="text-[10px] font-bold text-red-500 font-mono bg-red-50 px-2 py-0.5 rounded-md">
                          Due {disc.dueDate}
                        </span>
                        {disc.stakeholders && disc.stakeholders.length > 0 && (
                          <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Stakeholder: {disc.stakeholders[0]}
                          </span>
                        )}
                      </div>
                      <h4 className="font-display font-extrabold text-sm text-indigo-950 leading-tight">
                        {disc.title}
                      </h4>
                      <p className="text-xs text-slate-500 leading-normal max-w-xl">
                        {disc.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                      <button
                        onClick={() => onRejectDiscovery(disc.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-150 rounded-xl transition"
                        title="Dismiss detection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onPlanDiscovery(disc)}
                        className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                        title="Analyze & plan"
                      >
                        <Play className="w-3.5 h-3.5 fill-indigo-700" />
                        <span>Plan This</span>
                      </button>
                      <button
                        onClick={() => onApproveDiscovery(disc)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Core Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-slate-500" />
                <span>Upcoming Targets</span>
              </h3>
              <button
                onClick={onViewDeadlines}
                className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center space-x-1 hover:underline transition-all"
              >
                <span>View all ({deadlines.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div id="timeline-list-container" className="space-y-4">
              {activeDeadlines.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-3">
                  <Shield className="w-8 h-8 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-slate-600 text-sm font-semibold">Workspace Clear</p>
                    <p className="text-slate-400 text-xs mt-0.5">No active deadlines found. Try scanning your email or add one manually!</p>
                  </div>
                </div>
              ) : (
                activeDeadlines
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .slice(0, 4)
                  .map((deadline) => {
                    const daysInfo = getDaysRemainingInfo(deadline.dueDate);
                    return (
                      <div
                        key={deadline.id}
                        className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-5 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${daysInfo.color}`}>
                              {daysInfo.label}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-500`}>
                              {deadline.source}
                            </span>
                            {deadline.confidence === "low" && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-100 text-red-500">
                                Low Confidence
                              </span>
                            )}
                          </div>
                          <h4 className="font-display font-bold text-slate-900 text-base truncate">
                            {deadline.title}
                          </h4>
                          <p className="text-slate-500 text-xs truncate max-w-xl">
                            {deadline.description || "No further details available."}
                          </p>
                        </div>

                        {/* Right Section: Progress & Quick actions */}
                        <div className="flex items-center space-x-6">
                          {/* Progress radial/bar */}
                          <div className="w-24">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                              <span>Progress</span>
                              <span>{deadline.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  deadline.status === "critical"
                                    ? "bg-red-500"
                                    : deadline.status === "at-risk"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                  }`}
                                style={{ width: `${deadline.progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Plan This and Emergency Focus buttons */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => onPlanDeadlineById(deadline.id)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition"
                              title="Plan with Task Breaker"
                            >
                              <Play className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => onOpenEmergency(deadline)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                              title="Extreme Focus Mode"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Micro widgets */}
        <div id="voice-assistant-column" className="space-y-6">
          {/* Agent Operations Center summary card */}
          <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-900 shadow-md">
            <div className="flex items-center space-x-2 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-4">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Multi-Agent Operations</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 border-b border-slate-900 pb-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-slate-200">Hunter: Passive</h5>
                  <p className="text-[10px] text-slate-400">Scans Gmail headers and filters keywords.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 border-b border-slate-900 pb-3">
                <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-slate-200">Breaker: On-Demand</h5>
                  <p className="text-[10px] text-slate-400">Generates 15-hour milestone paths dynamically.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <h5 className="text-xs font-bold text-slate-200">Defender: Shields Up</h5>
                  <p className="text-[10px] text-slate-400">Monitors at-risk deadlines for inertia risks.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick instructions / pro tips */}
          <div className="bg-blue-900 text-white rounded-3xl p-6 relative overflow-hidden border border-blue-800 shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-800 rounded-full blur-2xl opacity-50 pointer-events-none" />
            <div className="relative space-y-4">
              <div className="flex items-center space-x-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>Defense Tactics</span>
              </div>
              <p className="font-display font-bold text-base leading-snug">
                Procrastination feeds on large, undefined tasks.
              </p>
              <p className="text-xs text-blue-150 leading-relaxed font-medium">
                Our smart AI planner breaks any high-risk target down into 3-5 subtasks with sequential due dates. Use the My Deadlines tab or click 'Plan This' on any item to prepare.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
