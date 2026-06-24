export interface Subtask {
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
  hours?: number; // estimated hours
}

export interface DiscoveredDeadline {
  id: string;
  title: string;
  dueDate: string;
  description: string;
  source: "gmail" | "calendar";
  confidence: "high" | "medium" | "low";
  stakeholders?: string[];
  context?: string;
}

export interface SuggestedPlan {
  deadlineId: string;
  deadlineTitle: string;
  subtasks: Subtask[];
  startSuggestion: string;
}

export interface AgentLog {
  id: string;
  agent: "hunter" | "breaker" | "defender";
  text: string;
  status: "idle" | "working" | "done" | "alert";
  timestamp: string;
}

export interface Deadline {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  status: "safe" | "at-risk" | "critical";
  completed: boolean;
  subtasks: Subtask[];
  progress: number; // 0 - 100
  source: "manual" | "gmail" | "calendar";
  originalSnippet?: string;
  confidence?: "high" | "medium" | "low";
  createdAt: string;
  emergencyMode?: boolean;
}

export interface UserPreferences {
  emailAlerts: boolean;
  procrastinationReminder: boolean;
  soundEnabled: boolean;
  workHoursStart: string;
  workHoursEnd: string;
  calendarSync: boolean;
  scanFrequency: "hour" | "six-hours" | "daily";
  voiceAssistantEnabled: boolean;
  theme: "light" | "dark";
  notifications: "email" | "in-app" | "both";
}
