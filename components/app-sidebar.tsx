"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon, Filter, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import MyBookings from "@/components/my-bookings"

interface AppSidebarProps {
  isOpen: boolean
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
  selectedZone: string | null
  onZoneChange: (zone: string | null) => void
  selectedSeatType: string | null
  onSeatTypeChange: (type: string | null) => void
}

export default function AppSidebar({
  isOpen,
  selectedDate,
  onDateChange,
  selectedZone,
  onZoneChange,
  selectedSeatType,
  onSeatTypeChange,
}: AppSidebarProps) {
  const [activeTab, setActiveTab] = useState("date")

  const zones = [
    { id: "tender", name: "Tender Checking Area" },
    { id: "cubical", name: "Cubical Area" },
    { id: "cabin", name: "Cabin" },
    { id: "design", name: "Design Center" },
  ]

  const seatTypes = [
    { id: "standard", name: "Standard Desk" },
    { id: "standing", name: "Standing Desk" },
    { id: "meeting", name: "Meeting Pod" },
    { id: "focus", name: "Focus Room" },
  ]

  if (!isOpen) return null

  return (
    <div className="w-80 h-full border-r border-slate-800 bg-slate-900 flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Workspace Booking</h2>
      </div>
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="date" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 p-2">
            <TabsTrigger value="date" className="text-xs">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>Date</span>
            </TabsTrigger>
            <TabsTrigger value="filters" className="text-xs">
              <Filter className="w-4 h-4 mr-1" />
              <span>Filters</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs">
              <BookMarked className="w-4 h-4 mr-1" />
              <span>My Bookings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="date" className="mt-0 p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-300">Select Date</h3>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={onDateChange} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-300">Select Time</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="justify-start">
                    <span>09:00 AM</span>
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <span>05:00 PM</span>
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2 text-slate-300">Duration</h3>
                <Button variant="outline" className="w-full justify-start">
                  <span>Full Day (8 hours)</span>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="mt-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="mb-2 text-sm font-medium text-slate-300">Zones</h3>
                  <div className="space-y-2">
                    {zones.map((zone) => (
                      <div key={zone.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`zone-${zone.id}`}
                          checked={selectedZone === zone.id}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onZoneChange(zone.id)
                            } else {
                              onZoneChange(null)
                            }
                          }}
                        />
                        <label
                          htmlFor={`zone-${zone.id}`}
                          className="text-sm font-medium leading-none text-slate-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {zone.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                <div>
                  <h3 className="mb-2 text-sm font-medium text-slate-300">Seat Types</h3>
                  <div className="space-y-2">
                    {seatTypes.map((type) => (
                      <div key={type.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={selectedSeatType === type.id}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              onSeatTypeChange(type.id)
                            } else {
                              onSeatTypeChange(null)
                            }
                          }}
                        />
                        <label
                          htmlFor={`type-${type.id}`}
                          className="text-sm font-medium leading-none text-slate-200 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {type.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="bg-slate-800" />

                <div>
                  <h3 className="mb-2 text-sm font-medium text-slate-300">Availability</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-500 rounded-sm"></div>
                      <span className="text-sm text-slate-200">Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                      <span className="text-sm text-slate-200">Your Booking</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                      <span className="text-sm text-slate-200">Booked</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-slate-600 rounded-sm"></div>
                      <span className="text-sm text-slate-200">Unavailable</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookings" className="mt-0">
            <MyBookings />
          </TabsContent>
        </Tabs>
      </div>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Selected date:</span>
          <Badge variant="outline" className="text-xs">
            {selectedDate ? format(selectedDate, "MMM d, yyyy") : "None"}
          </Badge>
        </div>
      </div>
    </div>
  )
}
