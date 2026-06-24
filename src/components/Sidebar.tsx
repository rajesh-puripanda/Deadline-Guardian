import React from "react";
import {
  LayoutDashboard,
  Calendar,
  Flame,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { User } from "firebase/auth";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "deadlines", label: "My Deadlines", icon: Flame },
    { id: "calendar", label: "Calendar View", icon: Calendar },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside id="sidebar-container" className="w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 border-r border-slate-800">
      {/* App Branding */}
      <div id="sidebar-brand-wrapper" className="p-6 flex items-center space-x-3 border-b border-slate-800">
        <div id="logo-icon-container" className="p-2.5 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 id="app-title-main" className="font-display text-lg font-bold tracking-tight text-white leading-tight">
            Deadline
          </h1>
          <p id="app-subtitle-main" className="text-xs text-blue-400 font-medium tracking-widest uppercase">
            Guardian
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav id="sidebar-navigation" className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-link-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Session Profile & Logout */}
      {user && (
        <div id="sidebar-user-section" className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div id="user-profile-details" className="flex items-center space-x-3 mb-4 px-2">
            {user.photoURL ? (
              <img
                id="user-avatar-image"
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div id="user-avatar-placeholder" className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                {user.displayName ? user.displayName[0].toUpperCase() : "U"}
              </div>
            )}
            <div id="user-info-text-wrapper" className="min-w-0 flex-1">
              <p id="user-display-name" className="text-sm font-semibold truncate text-slate-200">
                {user.displayName || "Active User"}
              </p>
              <p id="user-email-address" className="text-xs text-slate-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <button
            id="sidebar-logout-button"
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      )}
    </aside>
  );
}
