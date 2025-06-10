"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Clock, Brain, Eye, Headphones, Hand, Users, Target, BookOpen, Loader2 } from "lucide-react"

export default function ScheduleGenerator({ isOpen, onClose, userCourses, onScheduleGenerated, isGenerating }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [preferences, setPreferences] = useState({
    selectedCourses: [],
    learningTimes: [],
    learningStyles: [],
    studyDuration: 60,
    breakDuration: 15,
    studyDaysPerWeek: 5,
  })

  const learningTimes = [
    { id: "early-morning", label: "Early Morning", time: "6:00 - 8:00 AM", icon: "🌅" },
    { id: "morning", label: "Morning", time: "8:00 - 12:00 PM", icon: "☀️" },
    { id: "afternoon", label: "Afternoon", time: "12:00 - 5:00 PM", icon: "🌤️" },
    { id: "evening", label: "Evening", time: "5:00 - 8:00 PM", icon: "🌆" },
    { id: "night", label: "Night", time: "8:00 - 11:00 PM", icon: "🌙" },
  ]

  const learningStyles = [
    { id: "visual", label: "Visual", description: "Learn through diagrams and visual aids", icon: Eye },
    { id: "auditory", label: "Auditory", description: "Learn through listening", icon: Headphones },
    { id: "kinesthetic", label: "Hands-on", description: "Learn through practice", icon: Hand },
    { id: "reading", label: "Reading/Writing", description: "Learn through text", icon: BookOpen },
    { id: "social", label: "Group Study", description: "Learn with others", icon: Users },
    { id: "logical", label: "Problem Solving", description: "Learn through reasoning", icon: Target },
  ]

  const activities = {
    visual: ["Watch video lectures", "Create mind maps", "Review diagrams", "Study visual materials"],
    auditory: ["Listen to recordings", "Discuss concepts", "Attend lectures", "Use text-to-speech"],
    kinesthetic: ["Practice problems", "Lab work", "Hands-on exercises", "Build projects"],
    reading: ["Read textbooks", "Review notes", "Study articles", "Write summaries"],
    social: ["Group study", "Peer teaching", "Study groups", "Discussion forums"],
    logical: ["Solve problems", "Analyze cases", "Work through examples", "Apply concepts"],
  }

  const toggleSelection = (category, item) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: prev[category].includes(item) ? prev[category].filter((i) => i !== item) : [...prev[category], item],
    }))
  }

  const generateSchedule = () => {
    const schedule = []
    const weekDays = [1, 2, 3, 4, 5, 6, 7] // Mon-Sun

    weekDays.slice(0, preferences.studyDaysPerWeek).forEach((day) => {
      preferences.selectedCourses.forEach((courseId) => {
        const course = userCourses.find((c) => c.id === courseId)
        const randomTime = preferences.learningTimes[Math.floor(Math.random() * preferences.learningTimes.length)]
        const randomStyle = preferences.learningStyles[Math.floor(Math.random() * preferences.learningStyles.length)]
        const timeData = learningTimes.find((t) => t.id === randomTime)
        const activity = activities[randomStyle][Math.floor(Math.random() * activities[randomStyle].length)]

        schedule.push({
          day,
          courseName: course.name,
          courseCode: course.code,
          courseColor: course.color,
          timeSlot: timeData.time,
          duration: preferences.studyDuration,
          learningStyle: randomStyle,
          activity: `${activity} for ${course.name}`,
          priority: Math.random() > 0.7 ? "high" : "normal",
        })
      })
    })

    onScheduleGenerated(schedule)
  }

  const resetAndClose = () => {
    setCurrentStep(1)
    setPreferences({
      selectedCourses: [],
      learningTimes: [],
      learningStyles: [],
      studyDuration: 60,
      breakDuration: 15,
      studyDaysPerWeek: 5,
    })
    onClose()
  }

  if (isGenerating) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Generating Your Schedule</h3>
            <p className="text-slate-600">AI is creating the perfect study plan for you...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-800">Generate Study Schedule - Step {currentStep} of 3</DialogTitle>
        </DialogHeader>

        <style jsx>{`
          @keyframes slideInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        <div className="relative overflow-hidden">
          {/* Step 1: Course Selection */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              currentStep === 1
                ? "translate-x-0 opacity-100"
                : currentStep > 1
                  ? "-translate-x-full opacity-0 absolute top-0 left-0 w-full"
                  : "translate-x-full opacity-0 absolute top-0 left-0 w-full"
            }`}
          >
            <div className="space-y-6 min-h-[400px]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">Select Your Courses</h3>
                <p className="text-slate-600">Choose from your registered courses</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userCourses.map((course, index) => (
                  <Card
                    key={course.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 border-slate-200 ${
                      preferences.selectedCourses.includes(course.id)
                        ? "ring-2 ring-slate-800 bg-slate-50 scale-105"
                        : "hover:shadow-lg"
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: currentStep === 1 ? "slideInUp 0.6s ease-out forwards" : "none",
                    }}
                    onClick={() => toggleSelection("selectedCourses", course.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: course.color }}></div>
                          <div>
                            <h4 className="font-semibold text-slate-800">{course.name}</h4>
                            <p className="text-sm text-slate-600">
                              {course.code} • {course.credits} credits
                            </p>
                          </div>
                        </div>
                        <div
                          className={`transition-all duration-300 ${
                            preferences.selectedCourses.includes(course.id)
                              ? "scale-100 opacity-100"
                              : "scale-0 opacity-0"
                          }`}
                        >
                          <Check className="w-5 h-5 text-slate-800" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="studyDuration" className="text-slate-700">
                    Study Session (minutes)
                  </Label>
                  <Input
                    id="studyDuration"
                    type="number"
                    value={preferences.studyDuration}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, studyDuration: Number.parseInt(e.target.value) }))
                    }
                    className="border-slate-300 focus:border-slate-800"
                  />
                </div>
                <div>
                  <Label htmlFor="studyDays" className="text-slate-700">
                    Study Days per Week
                  </Label>
                  <Input
                    id="studyDays"
                    type="number"
                    min="1"
                    max="7"
                    value={preferences.studyDaysPerWeek}
                    onChange={(e) =>
                      setPreferences((prev) => ({ ...prev, studyDaysPerWeek: Number.parseInt(e.target.value) }))
                    }
                    className="border-slate-300 focus:border-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Learning Times */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              currentStep === 2
                ? "translate-x-0 opacity-100"
                : currentStep > 2
                  ? "-translate-x-full opacity-0 absolute top-0 left-0 w-full"
                  : "translate-x-full opacity-0 absolute top-0 left-0 w-full"
            }`}
          >
            <div className="space-y-6 min-h-[400px]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">When do you study best?</h3>
                <p className="text-slate-600">Select your preferred study times</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {learningTimes.map((time, index) => (
                  <Card
                    key={time.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 border-slate-200 ${
                      preferences.learningTimes.includes(time.id)
                        ? "ring-2 ring-slate-800 bg-slate-50 scale-105"
                        : "hover:shadow-lg"
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: currentStep === 2 ? "slideInUp 0.6s ease-out forwards" : "none",
                    }}
                    onClick={() => toggleSelection("learningTimes", time.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <span className="text-3xl mb-2 block">{time.icon}</span>
                      <h4 className="font-semibold text-slate-800">{time.label}</h4>
                      <p className="text-sm text-slate-600">{time.time}</p>
                      <div
                        className={`mt-2 transition-all duration-300 ${
                          preferences.learningTimes.includes(time.id) ? "scale-100 opacity-100" : "scale-0 opacity-0"
                        }`}
                      >
                        <Check className="w-5 h-5 text-slate-800 mx-auto" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Learning Styles */}
          <div
            className={`transition-all duration-500 ease-in-out ${
              currentStep === 3
                ? "translate-x-0 opacity-100"
                : "translate-x-full opacity-0 absolute top-0 left-0 w-full"
            }`}
          >
            <div className="space-y-6 min-h-[400px]">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">How do you learn best?</h3>
                <p className="text-slate-600">Select your learning preferences</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningStyles.map((style, index) => {
                  const IconComponent = style.icon
                  return (
                    <Card
                      key={style.id}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 border-slate-200 ${
                        preferences.learningStyles.includes(style.id)
                          ? "ring-2 ring-slate-800 bg-slate-50 scale-105"
                          : "hover:shadow-lg"
                      }`}
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: currentStep === 3 ? "slideInUp 0.6s ease-out forwards" : "none",
                      }}
                      onClick={() => toggleSelection("learningStyles", style.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <IconComponent className="w-6 h-6 text-slate-700 mt-1" />
                            <div>
                              <h4 className="font-semibold text-slate-800">{style.label}</h4>
                              <p className="text-sm text-slate-600">{style.description}</p>
                            </div>
                          </div>
                          <div
                            className={`transition-all duration-300 ${
                              preferences.learningStyles.includes(style.id)
                                ? "scale-100 opacity-100"
                                : "scale-0 opacity-0"
                            }`}
                          >
                            <Check className="w-5 h-5 text-slate-800" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 mb-4">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Step {currentStep} of 3</span>
            <span>{Math.round((currentStep / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-slate-800 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Previous
          </Button>
          {currentStep < 3 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={
                (currentStep === 1 && preferences.selectedCourses.length === 0) ||
                (currentStep === 2 && preferences.learningTimes.length === 0)
              }
              className="bg-slate-800 hover:bg-slate-700 text-white"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={generateSchedule}
              disabled={preferences.learningStyles.length === 0}
              className="bg-slate-800 hover:bg-slate-700 text-white"
            >
              Generate Schedule
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
