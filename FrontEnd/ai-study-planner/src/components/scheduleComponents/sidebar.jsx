"use client"

import { BarChart3, BookOpen, Calendar, ClipboardList, Home, Settings, User, GraduationCap } from "lucide-react"

const menuItems = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "courses", label: "Courses", icon: BookOpen },
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "analysis", label: "CWA Analysis", icon: BarChart3 },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: Settings },
]

export default function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold">
            edu<span className="text-blue-400">Planner</span>
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    currentPage === item.id
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
