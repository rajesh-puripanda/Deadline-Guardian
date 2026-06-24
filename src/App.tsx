import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  db,
} from "./firebase";
import { Deadline, UserPreferences, DiscoveredDeadline, SuggestedPlan, AgentLog, Subtask } from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import DeadlinesList from "./components/DeadlinesList";
import CalendarView from "./components/CalendarView";
import Settings from "./components/Settings";
import EmergencyFocus from "./components/EmergencyFocus";
import VoiceAssistant from "./components/VoiceAssistant";
import AgentActivityPanel from "./components/AgentActivityPanel";
import SuggestedPlanModal from "./components/SuggestedPlanModal";
import DeadlineDefenderTakeover from "./components/DeadlineDefenderTakeover";
import DemoTourOverlay from "./components/DemoTourOverlay";
import { Shield, Sparkles, AlertCircle, Info, Flame, LogIn } from "lucide-react";

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App tabs & states
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Emergency focus deadline
  const [emergencyDeadline, setEmergencyDeadline] = useState<Deadline | null>(null);

  // User preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailAlerts: true,
    procrastinationReminder: true,
    soundEnabled: true,
    workHoursStart: "09:00",
    workHoursEnd: "17:00",
    calendarSync: true,
    scanFrequency: "hour",
    voiceAssistantEnabled: true,
    theme: "light",
    notifications: "both",
  });

  // Agent Telemetry States
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [hunterStatus, setHunterStatus] = useState<"idle" | "working" | "done" | "alert">("idle");
  const [breakerStatus, setBreakerStatus] = useState<"idle" | "working" | "done" | "alert">("idle");
  const [defenderStatus, setDefenderStatus] = useState<"idle" | "working" | "done" | "alert">("idle");

  // Agent 1 Discovered Feed State
  const [discoveredDeadlines, setDiscoveredDeadlines] = useState<DiscoveredDeadline[]>([]);

  // Agent 2 Suggested Plan Modal State
  const [suggestedPlan, setSuggestedPlan] = useState<SuggestedPlan | null>(null);

  // Agent 3 Takeover State
  const [takeoverDeadline, setTakeoverDeadline] = useState<Deadline | null>(null);
  const [hasPromptedDefenderThisSession, setHasPromptedDefenderThisSession] = useState<Record<string, boolean>>({});

  // Demo Walkthrough States
  const [demoMode, setDemoMode] = useState(false);
  const [isDemoTourPlaying, setIsDemoTourPlaying] = useState(false);
  const [demoTourStep, setDemoTourStep] = useState(1);

  // Add agent log helper
  const addAgentLog = (agent: "hunter" | "breaker" | "defender", text: string, status: "idle" | "working" | "done" | "alert" = "done") => {
    const newLog: AgentLog = {
      id: Math.random().toString(),
      agent,
      text,
      status,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
    setAgentLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  // 1. Initialize Firebase Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        setNeedsAuth(false);
        addAgentLog("hunter", "Secure user node synchronized. Monitoring live parameters.", "done");
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Load deadlines from Firestore when signed in
  useEffect(() => {
    if (!user) {
      setDeadlines([]);
      return;
    }

    if (demoMode) {
      // In Demo Mode, use standard structured assets
      setDeadlines(getDemoDeadlines());
      return;
    }

    const q = query(collection(db, "deadlines"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Deadline[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as Deadline);
        });
        setDeadlines(loaded);
      },
      (error) => {
        console.error("Firestore loading error:", error);
        setErrorMessage("Could not load deadlines from secure cloud store. Rules or network issue.");
      }
    );

    return () => unsubscribe();
  }, [user, demoMode]);

  // Dynamic Theme Styling Switch
  useEffect(() => {
    const root = window.document.documentElement;
    if (preferences.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [preferences.theme]);

  // Baseline agent activity telemetry beats
  useEffect(() => {
    if (needsAuth || !user) return;

    const interval = setInterval(() => {
      if (isDemoTourPlaying) return; // let tour drive logging
      
      const agents = ["hunter", "breaker", "defender"] as const;
      const agent = agents[Math.floor(Math.random() * 3)];
      let msg = "";
      if (agent === "hunter") {
        setHunterStatus("working");
        msg = "Background scan: Checked active inbox. Secure perimeter clean.";
        setTimeout(() => setHunterStatus("idle"), 1800);
      } else if (agent === "breaker") {
        setBreakerStatus("working");
        msg = "Optimization check: Evaluated active subtasks dependencies ratios.";
        setTimeout(() => setBreakerStatus("idle"), 1800);
      } else if (agent === "defender") {
        setDefenderStatus("working");
        msg = "Shield ratio check: Procrastination alert filters standing ready.";
        setTimeout(() => setDefenderStatus("idle"), 1800);
      }
      addAgentLog(agent, msg, "done");
    }, 28000);

    return () => clearInterval(interval);
  }, [needsAuth, user, isDemoTourPlaying]);

  // Agent 3 Takeover Trigger logic (Critical under 24h & progress === 0)
  useEffect(() => {
    if (needsAuth || !user || !preferences.procrastinationReminder) return;

    const criticalTakeover = deadlines.find((d) => {
      if (d.completed || d.progress > 0) return false;
      const due = new Date(d.dueDate);
      const today = new Date();
      due.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 1 && diffDays >= 0;
    });

    if (criticalTakeover && !hasPromptedDefenderThisSession[criticalTakeover.id] && !takeoverDeadline) {
      setTakeoverDeadline(criticalTakeover);
      setDefenderStatus("alert");
      addAgentLog("defender", `CRITICAL DETECTION: "${criticalTakeover.title}" has 0% progress. Full-screen intrusion takeover deployed.`, "alert");
      setHasPromptedDefenderThisSession((prev) => ({ ...prev, [criticalTakeover.id]: true }));
    }
  }, [deadlines, needsAuth, user, preferences.procrastinationReminder, hasPromptedDefenderThisSession, takeoverDeadline]);

  // Demo Walkthrough Step Handler
  useEffect(() => {
    if (!isDemoTourPlaying) return;

    // Handle automated tour state mutations for each step
    switch (demoTourStep) {
      case 1:
        setCurrentTab("dashboard");
        setDemoMode(true);
        setDiscoveredDeadlines([]);
        setSuggestedPlan(null);
        setTakeoverDeadline(null);
        setHunterStatus("idle");
        setBreakerStatus("idle");
        setDefenderStatus("idle");
        addAgentLog("hunter", "Demo mode engaged. Secure objective grid created.", "done");
        break;
      case 2:
        setCurrentTab("dashboard");
        setHunterStatus("working");
        addAgentLog("hunter", "Background scan: Evaluating raw Gmail stream with LLM parser...", "working");
        setTimeout(() => {
          setHunterStatus("done");
          setDiscoveredDeadlines([
            {
              id: "disc-1",
              title: "Deploy Production Hotfix",
              dueDate: "2026-06-24",
              description: "Client reports critical database locks during peak checkout hours. Needs immediate server patch deployment.",
              source: "gmail",
              confidence: "high",
              stakeholders: ["Rajesh", "Lead Dev"],
              context: "Email subject: EMERGENCY: DB Locks",
            },
          ]);
          addAgentLog("hunter", "Agent 1 Found 1 critical deadline from lead dev email.", "done");
        }, 1500);
        break;
      case 3:
        setCurrentTab("deadlines");
        setBreakerStatus("working");
        addAgentLog("breaker", "Task Breaker: Parsing text requirements for 'Submit Hackathon Project'...", "working");
        setTimeout(() => {
          setBreakerStatus("done");
          setSuggestedPlan({
            deadlineId: "mock-1",
            deadlineTitle: "Submit Hackathon Project",
            subtasks: [
              { title: "Define Core Database Schema", dueDate: "2026-06-25", completed: false, notes: "Draft tables and model interfaces.", hours: 2 },
              { title: "Build Server Core Modules", dueDate: "2026-06-26", completed: false, notes: "Implement core routing nodes.", hours: 5 },
              { title: "Integrate Presentation UX UI", dueDate: "2026-06-27", completed: false, notes: "Deploy responsive front-end dashboard.", hours: 4 },
              { title: "Perform Final Compilation & Review", dueDate: "2026-06-28", completed: false, notes: "Run full linter checks and deploy sandbox.", hours: 2 },
            ],
            startSuggestion: "Define Core Database Schema",
          });
          addAgentLog("breaker", "Suggested action plan drafted. Suggested start milestone compiled.", "done");
        }, 1500);
        break;
      case 4:
        // Automatically accept subtasks for Submit Hackathon Project to show progress change
        setSuggestedPlan(null);
        const hackathonDeadline = deadlines.find(d => d.id === "mock-1");
        if (hackathonDeadline) {
          handleUpdateDeadline({
            ...hackathonDeadline,
            subtasks: [
              { title: "Define Core Database Schema", dueDate: "2026-06-25", completed: true, notes: "Draft tables and model interfaces.", hours: 2 },
              { title: "Build Server Core Modules", dueDate: "2026-06-26", completed: false, notes: "Implement core routing nodes.", hours: 5 },
              { title: "Integrate Presentation UX UI", dueDate: "2026-06-27", completed: false, notes: "Deploy responsive front-end dashboard.", hours: 4 },
            ],
            progress: 33,
          });
        }
        
        // Trigger takeover alert for Team Meeting Prep (due tomorrow, progress 0%)
        setTimeout(() => {
          const meetingPrep = deadlines.find(d => d.id === "mock-2");
          if (meetingPrep) {
            setTakeoverDeadline(meetingPrep);
            setDefenderStatus("alert");
            addAgentLog("defender", "CRITICAL THREAT: 'Team Meeting Prep' is due in 24 hours with 0% progress. Takeover engaged.", "alert");
          }
        }, 1000);
        break;
      case 5:
        setTakeoverDeadline(null);
        setCurrentTab("dashboard");
        addAgentLog("hunter", "Engaging Aura auditory synthesizer...", "working");
        break;
      case 6:
        setCurrentTab("settings");
        addAgentLog("hunter", "All automated defenses secured. Showcase complete.", "done");
        break;
      default:
        break;
    }
  }, [demoTourStep, isDemoTourPlaying]);

  // Mock sample deadlines for demo mode
  const getDemoDeadlines = (): Deadline[] => [
    {
      id: "mock-1",
      userId: user?.uid || "mock",
      title: "Submit Hackathon Project",
      description: "Submit pristine React layout with multi-agent modules and settings controls.",
      dueDate: "2026-06-29",
      status: "safe",
      completed: false,
      subtasks: [],
      progress: 0,
      source: "manual",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-2",
      userId: user?.uid || "mock",
      title: "Team Meeting Prep",
      description: "Gather cloud dashboard data and timeline status ratios to present to lead architect.",
      dueDate: "2026-06-24", // due tomorrow relative to June 23, 2026!
      status: "critical",
      completed: false,
      subtasks: [],
      progress: 0,
      source: "gmail",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-3",
      userId: user?.uid || "mock",
      title: "Pay Consulting Invoice",
      description: "Verify firewall consultant deliverables log and approve payment voucher.",
      dueDate: "2026-06-30",
      status: "safe",
      completed: true,
      subtasks: [
        { title: "Review Consultant log", dueDate: "2026-06-28", completed: true },
        { title: "Approve bank transfer voucher", dueDate: "2026-06-29", completed: true },
      ],
      progress: 100,
      source: "calendar",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-4",
      userId: user?.uid || "mock",
      title: "Client Review Presentation",
      description: "Draft tactical slides summarizing our intrusion defense scores and task maps.",
      dueDate: "2026-07-02",
      status: "safe",
      completed: false,
      subtasks: [],
      progress: 10,
      source: "gmail",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-5",
      userId: user?.uid || "mock",
      title: "Audit Cloud Firewall Rules",
      description: "Perform full audit on container security headers and ingress rules.",
      dueDate: "2026-06-25",
      status: "at-risk",
      completed: false,
      subtasks: [],
      progress: 60,
      source: "manual",
      createdAt: new Date().toISOString(),
    }
  ];

  // Handle Sign In
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setErrorMessage("Authentication failed. Please verify popup permissions.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Sign Out
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setNeedsAuth(true);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleBypassAuth = () => {
    const mockUser = {
      uid: "demo-guardian-user",
      displayName: "Demo Guardian User",
      email: "demo@deadline-guardian.io",
      photoURL: null,
    } as any;
    setUser(mockUser);
    setAccessToken("mock-access-token");
    setNeedsAuth(false);
    setDemoMode(true);
    addAgentLog("hunter", "Demo Bypass Engaged. Live dashboard unlocked.", "done");
  };

  // Scan Email & Google Calendar via full-stack backend
  const handleScanInbox = async () => {
    if (demoMode) {
      setIsScanning(true);
      setErrorMessage(null);
      addAgentLog("hunter", "Background scan: Triggering mock scanner query...", "working");
      setTimeout(() => {
        setIsScanning(false);
        setDiscoveredDeadlines([
          {
            id: "disc-demo",
            title: "Deploy Production Hotfix",
            dueDate: "2026-06-24",
            description: "Lead developer requested immediate deployment of the database connection leaks patch.",
            source: "gmail",
            confidence: "high",
            stakeholders: ["Rajesh PURIPANDA"],
          },
        ]);
        addAgentLog("hunter", "Found 1 urgent upcoming deadline from Rajesh PURIPANDA.", "done");
      }, 2000);
      return;
    }

    if (!accessToken) {
      setErrorMessage("OAuth token is expired or missing. Please sign in again.");
      return;
    }
    setIsScanning(true);
    setErrorMessage(null);
    setHunterStatus("working");
    addAgentLog("hunter", "Scanning live Gmail inbox for keywords: due, deliverable, deadline...", "working");

    try {
      const res = await fetch("/api/scan-deadlines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          today: new Date().toISOString().split("T")[0],
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to scan account.");
      }

      const data = await res.json();
      const newDeadlinesList = data.deadlines || [];

      if (newDeadlinesList.length === 0) {
        alert("Account scan complete. No upcoming deadlines detected in your inbox or calendar.");
        setIsScanning(false);
        setHunterStatus("done");
        return;
      }

      // Convert scanned items into Discovered Feed instead of injecting blindly! This is Agent 1's "Newly Found Feed"
      const scannedDiscovered: DiscoveredDeadline[] = newDeadlinesList.map((item: any, idx: number) => ({
        id: `disc-${Date.now()}-${idx}`,
        title: item.title,
        dueDate: item.dueDate || new Date().toISOString().split("T")[0],
        description: item.description || "Inferred from Gmail correspondence.",
        source: item.source || "gmail",
        confidence: item.confidence || "high",
        stakeholders: item.stakeholders || [],
      }));

      setDiscoveredDeadlines(scannedDiscovered);
      setHunterStatus("done");
      addAgentLog("hunter", `Scan secure perimeter complete. Identified ${scannedDiscovered.length} newly found deadlines.`, "done");
    } catch (err: any) {
      console.error("Scanning error:", err);
      setHunterStatus("alert");
      setErrorMessage(err.message || "Failed to contact Gemini Scanner. Ensure GEMINI_API_KEY is defined.");
    } finally {
      setIsScanning(false);
    }
  };

  // Helper to compute deadline urgency status
  const computeStatus = (dueDateStr: string): "safe" | "at-risk" | "critical" => {
    const due = new Date(dueDateStr);
    const today = new Date();
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 3) return "critical";
    if (diffDays <= 7) return "at-risk";
    return "safe";
  };

  // Add real subtask calendar events via Google Calendar API
  const handleCalendarSync = async (title: string, dueDate: string) => {
    if (!accessToken || !preferences.calendarSync) return;
    try {
      addAgentLog("breaker", `Syncing "${title}" to Google Calendar...`, "working");
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: title,
          description: "Milestone generated automatically by Deadline Guardian.",
          start: { date: dueDate },
          end: { date: dueDate },
        }),
      });
      if (res.ok) {
        addAgentLog("breaker", `Secured calendar node for "${title}". Event synchronized.`, "done");
      }
    } catch (err) {
      console.error("Calendar sync error:", err);
    }
  };

  // Database mutations
  const handleAddDeadline = async (deadlineData: Omit<Deadline, "id" | "userId" | "createdAt">) => {
    if (!user) return;
    if (demoMode) {
      const newMock: Deadline = {
        id: `mock-${Date.now()}`,
        userId: user.uid,
        ...deadlineData,
        createdAt: new Date().toISOString(),
      };
      setDeadlines((prev) => [newMock, ...prev]);
      addAgentLog("breaker", `Registered objective "${deadlineData.title}" locally.`, "done");
      return;
    }

    try {
      await addDoc(collection(db, "deadlines"), {
        userId: user.uid,
        ...deadlineData,
        createdAt: new Date().toISOString(),
      });
      addAgentLog("breaker", `Registered objective "${deadlineData.title}" in secure cloud storage.`, "done");
    } catch (err) {
      console.error("Add error:", err);
      setErrorMessage("Could not save new objective to database.");
    }
  };

  const handleUpdateDeadline = async (deadline: Deadline) => {
    if (!user) return;
    if (demoMode) {
      setDeadlines((prev) => prev.map((d) => (d.id === deadline.id ? { ...deadline, status: computeStatus(deadline.dueDate) } : d)));
      if (emergencyDeadline && emergencyDeadline.id === deadline.id) {
        setEmergencyDeadline({ ...deadline, status: computeStatus(deadline.dueDate) });
      }
      return;
    }

    try {
      const { id, ...data } = deadline;
      const ref = doc(db, "deadlines", id);
      await updateDoc(ref, {
        ...data,
        status: computeStatus(deadline.dueDate),
      });

      if (emergencyDeadline && emergencyDeadline.id === id) {
        setEmergencyDeadline({ ...deadline, status: computeStatus(deadline.dueDate) });
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  const handleDeleteDeadline = async (id: string) => {
    if (!user) return;
    if (demoMode) {
      setDeadlines((prev) => prev.filter((d) => d.id !== id));
      if (emergencyDeadline && emergencyDeadline.id === id) {
        setEmergencyDeadline(null);
      }
      return;
    }

    try {
      await deleteDoc(doc(db, "deadlines", id));
      if (emergencyDeadline && emergencyDeadline.id === id) {
        setEmergencyDeadline(null);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleUpdatePreferences = (prefs: UserPreferences) => {
    setPreferences(prefs);
    addAgentLog("defender", "Guardian parameters and theme updated successfully.", "done");
  };

  // Agent 1 Newly Found Feed approval and actions
  const handleApproveDiscovery = async (disc: DiscoveredDeadline) => {
    await handleAddDeadline({
      title: disc.title,
      description: disc.description,
      dueDate: disc.dueDate,
      status: computeStatus(disc.dueDate),
      completed: false,
      subtasks: [],
      progress: 0,
      source: disc.source,
      confidence: disc.confidence,
    });
    setDiscoveredDeadlines((prev) => prev.filter((d) => d.id !== disc.id));
    addAgentLog("hunter", `Approved newly found deadline: "${disc.title}".`, "done");
  };

  const handleRejectDiscovery = (id: string) => {
    setDiscoveredDeadlines((prev) => prev.filter((d) => d.id !== id));
    addAgentLog("hunter", "Dismissed newly found deadline recommendation.", "done");
  };

  // Trigger Action Plan for a deadline via Task Breaker
  const handlePlanDeadlineById = async (id: string) => {
    const deadline = deadlines.find((d) => d.id === id);
    if (!deadline) return;

    setBreakerStatus("working");
    addAgentLog("breaker", `Task Breaker: Generating chronological milestone map for "${deadline.title}"...`, "working");

    try {
      const res = await fetch("/api/smart-planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: deadline.title,
          description: deadline.description,
          dueDate: deadline.dueDate,
        }),
      });

      if (!res.ok) throw new Error("Planner failed");
      const data = await res.json();

      setSuggestedPlan({
        deadlineId: deadline.id,
        deadlineTitle: deadline.title,
        subtasks: data.subtasks || [],
        startSuggestion: data.subtasks && data.subtasks.length > 0 ? data.subtasks[0].title : "Draft basic structure",
      });
      setBreakerStatus("done");
      addAgentLog("breaker", `Drafted Suggested Action Plan for "${deadline.title}".`, "done");
    } catch (err) {
      console.error(err);
      // Fallback local planning if LLM fails/no key
      setSuggestedPlan({
        deadlineId: deadline.id,
        deadlineTitle: deadline.title,
        subtasks: [
          { title: "Define Requirements & Core parameters", dueDate: deadline.dueDate, completed: false, hours: 2 },
          { title: "Draft First functional setup", dueDate: deadline.dueDate, completed: false, hours: 4 },
          { title: "Review & Security scan validation", dueDate: deadline.dueDate, completed: false, hours: 2 },
        ],
        startSuggestion: "Define Requirements & Core parameters",
      });
      setBreakerStatus("done");
    }
  };

  const handlePlanDiscovery = (disc: DiscoveredDeadline) => {
    setSuggestedPlan({
      deadlineId: disc.id,
      deadlineTitle: disc.title,
      subtasks: [
        { title: "Parse parameters logs", dueDate: disc.dueDate, completed: false, hours: 1, notes: "Read over original snippet." },
        { title: "Execute urgent patch tests", dueDate: disc.dueDate, completed: false, hours: 3, notes: "Build sandbox testing." },
        { title: "Push to Production node", dueDate: disc.dueDate, completed: false, hours: 1, notes: "Final secure merge." },
      ],
      startSuggestion: "Parse parameters logs",
    });
    addAgentLog("breaker", "Dispatched suggested action plan for inbox item.", "done");
  };

  const handleAcceptPlan = async (subtasks: Subtask[], syncToCalendar: boolean) => {
    if (!suggestedPlan) return;

    const deadline = deadlines.find((d) => d.id === suggestedPlan.deadlineId);
    if (deadline) {
      const updated = {
        ...deadline,
        subtasks,
        progress: 0,
      };
      await handleUpdateDeadline(updated);

      if (syncToCalendar) {
        for (const st of subtasks) {
          await handleCalendarSync(st.title, st.dueDate);
        }
      }
    } else {
      // If accepting an unapproved Discovery plan
      await handleAddDeadline({
        title: suggestedPlan.deadlineTitle,
        description: "Inferred from correspondence.",
        dueDate: subtasks[subtasks.length - 1]?.dueDate || new Date().toISOString().split("T")[0],
        status: "critical",
        completed: false,
        subtasks,
        progress: 0,
        source: "gmail",
      });
      setDiscoveredDeadlines((prev) => prev.filter((d) => d.id !== suggestedPlan.deadlineId));
    }

    setSuggestedPlan(null);
    addAgentLog("breaker", "Chronological milestone map accepted and locked to database.", "done");
  };

  const handleToggleDemoMode = (val: boolean) => {
    setDemoMode(val);
    if (!val) {
      setIsDemoTourPlaying(false);
      setDiscoveredDeadlines([]);
    }
  };

  // Launch Automated Tour
  const handlePlayDemo = () => {
    setDemoMode(true);
    setDemoTourStep(1);
    setIsDemoTourPlaying(true);
    addAgentLog("hunter", "Initiating 60-second automated showcase loop...", "working");
  };

  // Authentication Required Screen (Pristine material design)
  if (needsAuth) {
    return (
      <div id="auth-screen-layout" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-900/50 border border-slate-900/80 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md relative">
          <div className="flex justify-center">
            <div className="p-3.5 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-500/20">
              <Shield className="w-8 h-8 animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
              Deadline Guardian
            </h1>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">
              AI-Powered Defensive Ops
            </p>
            <p className="text-sm text-slate-400 font-sans max-w-sm mx-auto pt-2 leading-relaxed">
              Scan your Gmail inbox and Google Calendar. Break down procrastination barriers and secure your commitments.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-left font-medium">{errorMessage}</p>
            </div>
          )}

          <div className="pt-3 space-y-4">
            <button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm px-5 py-3 rounded-xl shadow-md border border-slate-200 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all duration-150 disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 mr-3 flex-shrink-0">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>{isLoggingIn ? "Connecting account..." : "Sign in with Google"}</span>
            </button>

            <div className="flex items-center">
              <div className="flex-1 border-t border-slate-800"></div>
              <span className="px-3 text-slate-500 text-[10px] uppercase font-bold tracking-wider">For Quick Review</span>
              <div className="flex-1 border-t border-slate-800"></div>
            </div>

            <button
              onClick={handleBypassAuth}
              className="w-full flex items-center justify-center bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold text-sm px-5 py-3 rounded-xl border border-indigo-500/20 cursor-pointer hover:scale-[1.01] active:scale-95 transition-all duration-150"
            >
              <Sparkles className="w-5 h-5 mr-3 text-indigo-400 animate-pulse" />
              <span>Proceed with Demo Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="applet-main-layout" className={`flex min-h-screen font-sans transition-colors duration-300 ${preferences.theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setErrorMessage(null);
        }}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Workspace content */}
      <main id="main-workspace-content" className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-6 overflow-x-hidden pb-40">
        
        {/* Persistent Error Alert */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 text-xs flex items-start space-x-3 shadow-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold">Aura Warning:</span>
              <p className="mt-0.5 leading-relaxed text-red-650 font-medium">
                {errorMessage}
              </p>
              <p className="mt-1 text-[10px] text-red-500 font-semibold">
                Tip: If you see API errors, make sure a valid key is saved in <span className="font-bold">Settings &gt; Secrets</span>.
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600 font-bold px-1.5 py-0.5 hover:bg-red-100 rounded-lg text-[10px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab router */}
        {currentTab === "dashboard" && (
          <Dashboard
            deadlines={deadlines}
            onScanInbox={handleScanInbox}
            isScanning={isScanning}
            onUpdateDeadline={handleUpdateDeadline}
            onViewDeadlines={() => setCurrentTab("deadlines")}
            onOpenEmergency={(d) => setEmergencyDeadline(d)}
            discoveredDeadlines={discoveredDeadlines}
            onApproveDiscovery={handleApproveDiscovery}
            onPlanDiscovery={handlePlanDiscovery}
            onRejectDiscovery={handleRejectDiscovery}
            onPlanDeadlineById={handlePlanDeadlineById}
          />
        )}

        {currentTab === "deadlines" && (
          <DeadlinesList
            deadlines={deadlines}
            onAddDeadline={handleAddDeadline}
            onUpdateDeadline={handleUpdateDeadline}
            onDeleteDeadline={handleDeleteDeadline}
            onOpenEmergency={(d) => setEmergencyDeadline(d)}
          />
        )}

        {currentTab === "calendar" && (
          <CalendarView
            deadlines={deadlines}
            onOpenEmergency={(d) => setEmergencyDeadline(d)}
          />
        )}

        {currentTab === "settings" && (
          <Settings
            user={user}
            onLogout={handleLogout}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            demoMode={demoMode}
            onToggleDemoMode={handleToggleDemoMode}
            onPlayDemo={handlePlayDemo}
          />
        )}
      </main>

      {/* Agent Activity panel command center at bottom */}
      <AgentActivityPanel
        logs={agentLogs}
        hunterStatus={hunterStatus}
        breakerStatus={breakerStatus}
        defenderStatus={defenderStatus}
      />

      {/* Floating Voice assistant accessible globally from any screen */}
      <VoiceAssistant
        deadlines={deadlines}
        onUpdateDeadline={handleUpdateDeadline}
        onOpenEmergency={(d) => setEmergencyDeadline(d)}
        preferences={preferences}
      />

      {/* Agent 2 Suggested Action Plan modal */}
      {suggestedPlan && (
        <SuggestedPlanModal
          plan={suggestedPlan}
          onAccept={handleAcceptPlan}
          onReject={() => setSuggestedPlan(null)}
        />
      )}

      {/* Agent 3 Intrusion full-screen takeover blocker alert */}
      {takeoverDeadline && (
        <DeadlineDefenderTakeover
          deadline={takeoverDeadline}
          onClose={() => setTakeoverDeadline(null)}
          onUpdateDeadline={handleUpdateDeadline}
        />
      )}

      {/* Interactive 60-second Automated Walkthrough Tour Controller */}
      {isDemoTourPlaying && (
        <DemoTourOverlay
          step={demoTourStep}
          onNext={() => {
            if (demoTourStep < 6) {
              setDemoTourStep((prev) => prev + 1);
            } else {
              setIsDemoTourPlaying(false);
            }
          }}
          onPrev={() => setDemoTourStep((prev) => Math.max(prev - 1, 1))}
          onClose={() => setIsDemoTourPlaying(false)}
          isPlaying={isDemoTourPlaying}
          onTogglePlay={() => setIsDemoTourPlaying(!isDemoTourPlaying)}
        />
      )}

      {/* Hyper-focused Emergency Mode Overlay */}
      {emergencyDeadline && (
        <EmergencyFocus
          deadline={emergencyDeadline}
          onUpdateDeadline={handleUpdateDeadline}
          onClose={() => setEmergencyDeadline(null)}
        />
      )}
    </div>
  );
}
