"use client"

import { useState } from "react"
import { ThemeProvider } from "@/app/useless/theme-provider"
import AppSidebar from "@/app/useless/app-sidebar"
import FloorPlan from "@/components/FloorPlan"
import TopNavigation from "@/components/TopBar"

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedZone, setSelectedZone] = useState<string | null>(null)
  const [selectedSeatType, setSelectedSeatType] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null)
  const [seats, setSeats] = useState<string[]>([])

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
