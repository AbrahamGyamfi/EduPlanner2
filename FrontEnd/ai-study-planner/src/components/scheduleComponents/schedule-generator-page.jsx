"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, Calendar, Clock, Brain, BookOpen, Download, RefreshCw } from "lucide-react"
import ScheduleGenerator from "./schedule-generator"

export default function ScheduleGeneratorPage({ userCourses }) {
  const [showGenerator, setShowGenerator] = useState(false)
  const [generatedSchedule, setGeneratedSchedule] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleScheduleGenerated = (schedule) => {
    setIsGenerating(true)
    // Simulate generation time
    setTimeout(() => {
      setGeneratedSchedule(schedule)
      setShowGenerator(false)
      setIsGenerating(false)
    }, 2000)
  }

  const exportSchedule = () => {
    if (!generatedSchedule) return

    const scheduleData = {
      generatedAt: new Date().toISOString(),
      schedule: generatedSchedule,
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scheduleData, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "study-schedule.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <div className="h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-slate-800">Schedule Generator</h1>
        <p className="text-slate-600 mt-2">Create personalized study schedules with AI-powered auto-generation</p>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {!generatedSchedule ? (
          /* Welcome State */
          <div className="max-w-4xl mx-auto">
            <Card className="border-slate-200 shadow-lg">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-blue-400" />
                </div>

                <h2 className="text-2xl font-bold text-slate-800 mb-4">Smart Schedule Generation</h2>
                <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
                  Let our AI create the perfect study schedule for you based on your registered courses, learning
                  preferences, and optimal study times. Get organized in just a few clicks!
                </p>

                <Button
                  onClick={() => setShowGenerator(true)}
                  size="lg"
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 text-lg"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Schedule
                </Button>

                {/* Features */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">Your Courses</h3>
                    <p className="text-sm text-slate-600">
                      Uses your registered courses to create relevant study sessions
                    </p>
                  </div>

                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">Optimal Timing</h3>
                    <p className="text-sm text-slate-600">Schedules study sessions when you're most productive</p>
                  </div>

                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">Learning Style</h3>
                    <p className="text-sm text-slate-600">Adapts to your preferred learning methods and techniques</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Generated Schedule Display */
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Schedule Header */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader className="bg-slate-800 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Your Generated Study Schedule
                    </CardTitle>
                    <p className="text-slate-300 mt-1">{generatedSchedule.length} study sessions across the week</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowGenerator(true)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={exportSchedule}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {generatedSchedule.map((session, index) => (
                <Card key={index} className="border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: session.courseColor }}></div>
                        <div>
                          <h3 className="font-semibold text-slate-800">{session.courseName}</h3>
                          <p className="text-sm text-slate-500">{session.courseCode}</p>
                        </div>
                      </div>
                      {session.priority === "high" && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">High Priority</span>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">
                          {
                            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][
                              session.day - 1
                            ]
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{session.timeSlot}</span>
                      </div>

                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-700 font-medium mb-1">Study Activity:</p>
                        <p className="text-sm text-slate-600">{session.activity}</p>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{session.duration} minutes</span>
                        <span className="capitalize">{session.learningStyle} learning</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowGenerator(true)}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Generate New Schedule
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportSchedule}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to Calendar
                  </Button>
                  <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                    <Calendar className="w-4 h-4 mr-2" />
                    View in Calendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Schedule Generator Modal */}
      {showGenerator && (
        <ScheduleGenerator
          isOpen={showGenerator}
          onClose={() => setShowGenerator(false)}
          userCourses={userCourses}
          onScheduleGenerated={handleScheduleGenerated}
          isGenerating={isGenerating}
        />
      )}
    </div>
  )
}
