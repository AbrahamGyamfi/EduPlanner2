"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Bell } from "lucide-react"
import ScheduleGenerator from "./schedule-generator"
import WeeklyCalendar from "./weekly-calendar"

export default function SchedulePage({ userCourses }) {
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedSchedule, setGeneratedSchedule] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleScheduleGenerated = (schedule) => {
    setGeneratedSchedule(schedule)
    setShowGenerator(false)
  }

  const currentMonth = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const totalTasks = generatedSchedule ? generatedSchedule.flat().length : 0
  const highPriorityTasks = generatedSchedule
    ? generatedSchedule.flat().filter((task) => task.priority === "high").length
    : 0

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              V
            </div>
            <span className="text-gray-700 font-medium">Vandyck</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h2 className="text-xl font-semibold text-gray-800">{currentMonth}</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{totalTasks} Total Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{highPriorityTasks} High Priority</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button variant="ghost" size="sm" className="text-gray-600">
                Day
              </Button>
              <Button variant="default" size="sm" className="bg-blue-600 text-white">
                Week
              </Button>
            </div>
            <Button onClick={() => setShowGenerator(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Generate Schedule
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 p-6">
        <WeeklyCalendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          schedule={generatedSchedule}
          onCreateTask={() => setShowGenerator(true)}
        />
      </div>

      {/* Schedule Generator Modal */}
      {showGenerator && (
        <ScheduleGenerator
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          userCourses={userCourses}
          onScheduleGenerated={handleScheduleGenerated}
        />
      )}
    </div>
  )
}
