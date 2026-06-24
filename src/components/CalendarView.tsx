import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Flame, Shield, Clock, CheckCircle } from "lucide-react";
import { Deadline, Subtask } from "../types";

interface CalendarViewProps {
  deadlines: Deadline[];
  onOpenEmergency: (deadline: Deadline) => void;
}

export default function CalendarView({ deadlines, onOpenEmergency }: CalendarViewProps) {
  // Let's set default year & month to June 2026 as per user metadata
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 23)); // June is index 5
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // Day of week (0 = Sun, etc.)
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const daysGrid: (number | null)[] = [];
  // Padding for starting empty cells
  for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
    daysGrid.push(null);
  }
  // Days of current month
  for (let i = 1; i <= totalDaysInMonth; i++) {
    daysGrid.push(i);
  }

  // Group items by date string (YYYY-MM-DD)
  const getItemsForDate = (dayNum: number) => {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(dayNum).padStart(2, "0");
    const dateKey = `${year}-${monthStr}-${dayStr}`;

    const dateDeadlines = deadlines.filter((d) => d.dueDate === dateKey);
    
    // Extract subtasks that match this date too!
    const dateSubtasks: { parent: Deadline; subtask: Subtask }[] = [];
    deadlines.forEach((d) => {
      d.subtasks.forEach((st) => {
        if (st.dueDate === dateKey) {
          dateSubtasks.push({ parent: d, subtask: st });
        }
      });
    });

    return {
      deadlines: dateDeadlines,
      subtasks: dateSubtasks,
    };
  };

  const [selectedDay, setSelectedDay] = useState<number | null>(23); // Default highlight June 23
  const selectedDayItems = selectedDay ? getItemsForDate(selectedDay) : { deadlines: [], subtasks: [] };

  return (
    <div id="calendar-view-tab" className="grid grid-cols-1 xl:grid-cols-4 gap-8 animate-fadeIn">
      {/* Calendar Grid Section */}
      <div className="xl:col-span-3 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-950">Milestones Calendar</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Coordinate your tactical milestones and due dates.</p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200/50">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-950 hover:shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-2 min-w-28 text-center select-none">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-950 hover:shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-2.5 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-2.5">
          {daysGrid.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square bg-slate-50/40 rounded-2xl border border-slate-50/20" />;
            }

            const { deadlines: dayDeadlines, subtasks: daySubtasks } = getItemsForDate(day);
            const isToday = year === 2026 && month === 5 && day === 23;
            const isSelected = selectedDay === day;

            const totalItems = dayDeadlines.length + daySubtasks.length;

            return (
              <div
                key={`day-${day}`}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square p-2.5 rounded-2xl border flex flex-col justify-between transition-all duration-150 cursor-pointer select-none ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/30 shadow-sm shadow-blue-500/5"
                    : isToday
                    ? "border-blue-200 bg-slate-50"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/40 bg-white"
                }`}
              >
                {/* Day number with "Today" indicator */}
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-lg ${
                      isToday
                        ? "bg-blue-600 text-white shadow-sm"
                        : isSelected
                        ? "text-blue-600"
                        : "text-slate-700"
                    }`}
                  >
                    {day}
                  </span>
                  {totalItems > 0 && (
                    <span className="text-[9px] font-black bg-slate-900 text-white w-4 h-4 rounded-full flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </div>

                {/* Dot markers */}
                <div className="flex flex-wrap gap-1 mt-auto">
                  {dayDeadlines.map((d) => (
                    <span
                      key={d.id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        d.status === "critical"
                          ? "bg-red-500"
                          : d.status === "at-risk"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      title={d.title}
                    />
                  ))}
                  {daySubtasks.map((st, i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-blue-400"
                      title={`Subtask: ${st.subtask.title}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Detail Panel */}
      <div className="xl:col-span-1 space-y-5">
        <h3 className="font-display text-lg font-bold text-slate-950 flex items-center space-x-2">
          <span>Daily Briefing</span>
          {selectedDay && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
              {monthNames[month]} {selectedDay}
            </span>
          )}
        </h3>

        {selectedDayItems.deadlines.length === 0 && selectedDayItems.subtasks.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 text-center space-y-3 shadow-sm py-12">
            <Shield className="w-8 h-8 text-slate-300 mx-auto" />
            <div>
              <p className="text-slate-600 text-xs font-bold">Grid Clear</p>
              <p className="text-slate-400 text-[11px] mt-0.5">No defensive objectives or milestones scheduled for this date.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Major Deadlines listed */}
            {selectedDayItems.deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="bg-white border border-slate-100 rounded-2xl p-4.5 shadow-sm space-y-3 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500" />
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-[9px] font-bold text-red-500 uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Primary Deadline</span>
                  </div>
                  <h4 className="font-display font-bold text-sm text-slate-900 leading-tight">
                    {deadline.title}
                  </h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    {deadline.description || "No full details recorded."}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-50 pt-2.5">
                  <span className="font-semibold">Progress: {deadline.progress}%</span>
                  <button
                    onClick={() => onOpenEmergency(deadline)}
                    className="text-blue-600 hover:text-blue-700 font-bold hover:underline"
                  >
                    Focus Mode
                  </button>
                </div>
              </div>
            ))}

            {/* Scheduled Subtasks listed */}
            {selectedDayItems.subtasks.map((item, idx) => (
              <div
                key={`sub-${idx}`}
                className="bg-slate-50 border border-slate-200/40 rounded-2xl p-4 shadow-sm space-y-2"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-[9px] font-bold text-blue-500 uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Planned Milestone</span>
                  </div>
                  <h4 className="font-display font-bold text-xs text-slate-800 leading-tight">
                    {item.subtask.title}
                  </h4>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    Objective: <span className="font-semibold text-slate-500">{item.parent.title}</span>
                  </p>
                  {item.subtask.notes && (
                    <p className="text-slate-500 text-[10px] bg-white p-2 rounded-lg border border-slate-200/30 leading-snug font-sans italic mt-1.5">
                      "{item.subtask.notes}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
