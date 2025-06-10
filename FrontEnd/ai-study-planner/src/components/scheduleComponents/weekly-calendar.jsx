"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Plus } from "lucide-react"

export default function WeeklyCalendar({ selectedDate, setSelectedDate, schedule, onCreateTask }) {
  const [selectedDay, setSelectedDay] = useState(5) // Thursday selected by default

  const weekDays = [
    { name: "Mon", date: 2 },
    { name: "Tue", date: 3 },
    { name: "Wed", date: 4 },
    { name: "Thu", date: 5 },
    { name: "Fri", date: 6 },
    { name: "Sat", date: 7 },
    { name: "Sun", date: 8 },
  ]

  const getTasksForDay = (dayDate) => {
    if (!schedule) return []
    return schedule.filter((task) => task.day === dayDate)
  }

  const selectedDayName = weekDays.find((day) => day.date === selectedDay)?.name || "Thu"
  const tasksForSelectedDay = getTasksForDay(selectedDay)

  return (
    <div className="space-y-6">
      {/* Week View */}
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => (
          <Card
            key={day.date}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedDay === day.date ? "bg-blue-600 text-white shadow-lg" : "bg-white hover:bg-gray-50"
            }`}
            onClick={() => setSelectedDay(day.date)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-sm font-medium mb-1">{day.name}</div>
              <div className="text-2xl font-bold">{day.date}</div>
              {getTasksForDay(day.date).length > 0 && (
                <div className="mt-2">
                  <div
                    className={`w-2 h-2 rounded-full mx-auto ${selectedDay === day.date ? "bg-white" : "bg-blue-500"}`}
                  ></div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Day Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Tasks for {selectedDayName}day, June {selectedDay}
          </h3>
          <span className="text-sm text-gray-500">{tasksForSelectedDay.length} tasks</span>
        </div>

        {tasksForSelectedDay.length > 0 ? (
          <div className="space-y-3">
            {tasksForSelectedDay.map((task, index) => (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: task.courseColor }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{task.courseName}</h4>
                        <span className="text-sm text-gray-500">{task.courseCode}</span>
                        {task.priority === "high" && (
                          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">High Priority</span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{task.activity}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{task.timeSlot}</span>
                        <span>{task.duration} minutes</span>
                        <span className="capitalize">{task.learningStyle} learning</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="p-12 text-center">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No tasks scheduled for this day</h3>
              <p className="text-gray-500 mb-6">Stay organized by scheduling your tasks and assignments</p>
              <Button
                onClick={onCreateTask}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
