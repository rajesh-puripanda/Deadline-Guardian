import React, { useState } from "react";
import { User } from "firebase/auth";
import { Shield, Mail, CheckCircle2, Volume2, Flame, LogOut, Info, Calendar, Radio, Mic, Moon, Sun, Play, HelpCircle, Laptop, Sparkles } from "lucide-react";
import { UserPreferences } from "../types";

interface SettingsProps {
  user: User | null;
  onLogout: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: UserPreferences) => void;
  demoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
  onPlayDemo: () => void;
}

export default function Settings({
  user,
  onLogout,
  preferences,
  onUpdatePreferences,
  demoMode,
  onToggleDemoMode,
  onPlayDemo,
}: SettingsProps) {
  const [emailAlerts, setEmailAlerts] = useState(preferences.emailAlerts);
  const [reminders, setReminders] = useState(preferences.procrastinationReminder);
  const [sound, setSound] = useState(preferences.soundEnabled);
  const [calendarSync, setCalendarSync] = useState(preferences.calendarSync);
  const [scanFrequency, setScanFrequency] = useState(preferences.scanFrequency);
  const [voiceEnabled, setVoiceEnabled] = useState(preferences.voiceAssistantEnabled);
  const [theme, setTheme] = useState(preferences.theme);
  const [notifications, setNotifications] = useState(preferences.notifications);

  const handleSave = (key: keyof UserPreferences, val: any) => {
    const updated = {
      ...preferences,
      [key]: val,
    };
    if (key === "emailAlerts") setEmailAlerts(val);
    if (key === "procrastinationReminder") setReminders(val);
    if (key === "soundEnabled") setSound(val);
    if (key === "calendarSync") setCalendarSync(val);
    if (key === "scanFrequency") setScanFrequency(val);
    if (key === "voiceAssistantEnabled") setVoiceEnabled(val);
    if (key === "theme") setTheme(val);
    if (key === "notifications") setNotifications(val);
    onUpdatePreferences(updated);
  };

  return (
    <div id="settings-view-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      {/* Configuration Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Guard Preferences Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="font-display text-lg font-bold text-slate-950">Guardian Parameters</h3>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Fine-tune your automated procrastination alerts, schedules, and theme settings.</p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Email reports */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-sm font-bold text-slate-850">Automated Briefings</p>
                <p className="text-slate-500 text-xs font-medium">Receive a daily tactical report summarizing due dates, milestones, and overdue risks.</p>
              </div>
              <button
                onClick={() => handleSave("emailAlerts", !emailAlerts)}
                className={`w-11 h-6 flex items-center rounded-full p-1.5 transition-all duration-200 cursor-pointer ${
                  emailAlerts ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Procrastination alert */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-sm font-bold text-slate-850">Intelligent Procrastination Alerts</p>
                <p className="text-slate-500 text-xs font-medium">Triggers major notifications with Emergency Mode triggers if deadlines fall under 48h and progress remains below 30%.</p>
              </div>
              <button
                onClick={() => handleSave("procrastinationReminder", !reminders)}
                className={`w-11 h-6 flex items-center rounded-full p-1.5 transition-all duration-200 cursor-pointer ${
                  reminders ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Interface audio cues */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-sm font-bold text-slate-850">Aura Vocalization</p>
                <p className="text-slate-500 text-xs font-medium">Enable natural text-to-speech feedback automatically during voice briefs.</p>
              </div>
              <button
                onClick={() => handleSave("soundEnabled", !sound)}
                className={`w-11 h-6 flex items-center rounded-full p-1.5 transition-all duration-200 cursor-pointer ${
                  sound ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Calendar Sync Preference */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-sm font-bold text-slate-850 flex items-center space-x-1">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Google Calendar Synchronization</span>
                </p>
                <p className="text-slate-500 text-xs font-medium">Automatically push subtasks and start recommendations directly to your connected Google Calendar.</p>
              </div>
              <button
                onClick={() => handleSave("calendarSync", !calendarSync)}
                className={`w-11 h-6 flex items-center rounded-full p-1.5 transition-all duration-200 cursor-pointer ${
                  calendarSync ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Voice Assistant Preference */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-sm font-bold text-slate-850 flex items-center space-x-1">
                  <Mic className="w-4 h-4 text-slate-500" />
                  <span>Voice Coaching Assistant (Aura)</span>
                </p>
                <p className="text-slate-500 text-xs font-medium">Render the floating mic widget in the bottom-right corner to allow hands-free verbal controls.</p>
              </div>
              <button
                onClick={() => handleSave("voiceAssistantEnabled", !voiceEnabled)}
                className={`w-11 h-6 flex items-center rounded-full p-1.5 transition-all duration-200 cursor-pointer ${
                  voiceEnabled ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"
                }`}
              >
                <span className="w-3.5 h-3.5 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Theme Toggle Preference */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-sm font-bold text-slate-850 flex items-center space-x-1">
                  {theme === "dark" ? <Moon className="w-4 h-4 text-slate-500" /> : <Sun className="w-4 h-4 text-slate-500" />}
                  <span>Visual Theme Mode</span>
                </p>
                <p className="text-slate-500 text-xs font-medium">Choose between the clean light display or the immersive secure dark canvas.</p>
              </div>
              <div className="flex bg-slate-150 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => handleSave("theme", "light")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                    theme === "light" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => handleSave("theme", "dark")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                    theme === "dark" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Scan Frequency Dropdown */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-sm font-bold text-slate-850">Gmail Inbox Scanning Frequency</p>
                <p className="text-slate-500 text-xs font-medium">Adjust how frequently background servers scan for deadline-related client keywords.</p>
              </div>
              <select
                value={scanFrequency}
                onChange={(e) => handleSave("scanFrequency", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="hour">Every Hour</option>
                <option value="six-hours">Every 6 Hours</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            {/* Notification Channel Preference */}
            <div className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="space-y-0.5 max-w-md pr-4">
                <p className="text-sm font-bold text-slate-850">Notification Preferences</p>
                <p className="text-slate-500 text-xs font-medium">Choose your primary alerts mechanism for high-risk critical timelines.</p>
              </div>
              <select
                value={notifications}
                onChange={(e) => handleSave("notifications", e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="in-app">In-App Only</option>
                <option value="email">Email Alerts Only</option>
                <option value="both">Both Channels Enabled</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* Profile & Showcase Integrations Column */}
      <div className="space-y-6">
        {/* Demo Mode / Play Demo Controller (Extremely Important!) */}
        <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white border border-indigo-900 rounded-3xl p-6 shadow-lg space-y-4.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-display font-extrabold text-sm text-white">Showcase Controls</h4>
              <p className="text-indigo-300 text-[10px] font-bold tracking-wider uppercase">Frictionless Judging Demo</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-normal font-medium">
            Ready to review? Demo Mode pre-populates 5 sample deadlines, mock calendars, and enables a fully automated 60-second walkthrough.
          </p>

          <div className="space-y-3 pt-1">
            {/* Demo Mode Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-2xl border border-indigo-950">
              <div>
                <p className="text-xs font-bold text-slate-200">Enable Demo State</p>
                <p className="text-[10px] text-slate-500">Injects 5 high-fidelity mock assets.</p>
              </div>
              <button
                onClick={() => onToggleDemoMode(!demoMode)}
                className={`w-10 h-5.5 flex items-center rounded-full p-0.5 transition-all duration-200 cursor-pointer ${
                  demoMode ? "bg-indigo-500 justify-end" : "bg-slate-800 justify-start"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-md" />
              </button>
            </div>

            {/* Play Showcase CTA */}
            <button
              onClick={onPlayDemo}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch 60s Auto Walkthrough</span>
            </button>
          </div>
        </div>

        {/* Profile Card */}
        {user && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4 text-center">
            <div className="relative inline-block">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-20 h-20 rounded-full mx-auto border-2 border-blue-500 object-cover p-1 shadow-md"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 rounded-full mx-auto bg-blue-500/20 text-blue-600 flex items-center justify-center font-bold text-2xl border-2 border-blue-500 p-1">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
              )}
              <span className="absolute bottom-0 right-1 w-5.5 h-5.5 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center" />
            </div>

            <div>
              <h3 className="font-display text-base font-bold text-slate-900 leading-snug">{user.displayName || "Guardian Officer"}</h3>
              <p className="text-xs text-slate-400 font-semibold">{user.email}</p>
            </div>

            <div className="border-t border-slate-50 pt-3">
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-xl text-xs font-bold border border-slate-100 hover:border-red-100 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect Google Account</span>
              </button>
            </div>
          </div>
        )}

        {/* Integration Status Tracker */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="font-display text-sm font-bold text-slate-900">Workspace Integrations</h4>
          
          <div className="space-y-3.5">
            {[
              { label: "Google Workspace Auth", desc: "User Sign-In", status: true },
              { label: "Gmail Read-Only API", desc: "Deadline Email Scanning", status: true },
              { label: "Google Calendar API", desc: "Event Scanning", status: true },
              { label: "Cloud Firestore DB", desc: "Durable Cloud Persistence", status: true },
              { label: "Gemini 3.5 Flash LLM", desc: "Autonomous Planner", status: true },
            ].map((int, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 leading-none">{int.label}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{int.desc}</p>
                </div>
                <div className="flex items-center space-x-1.5 flex-shrink-0 text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 text-[9px] font-bold">
                  <CheckCircle2 className="w-3 h-3 fill-emerald-100" />
                  <span>ONLINE</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
