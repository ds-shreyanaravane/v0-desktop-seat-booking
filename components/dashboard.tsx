"use client"

import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import AppSidebar from "@/components/app-sidebar"
import FloorPlan from "@/components/floor-plan"
import TopNavigation from "@/components/top-navigation"

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedSeatType, setSelectedSeatType] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <div className="flex flex-col h-screen bg-[#131725]">
        <TopNavigation onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar
            isOpen={sidebarOpen}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedZone={selectedZone}
            onZoneChange={setSelectedZone}
            selectedSeatType={selectedSeatType}
            onSeatTypeChange={setSelectedSeatType}
          />
          <main className="flex-1 overflow-auto p-4">
            <FloorPlan selectedDate={selectedDate} selectedZone={selectedZone} selectedSeatType={selectedSeatType} />
          </main>
        </div>
      </div>
    </ThemeProvider>
  )
}
