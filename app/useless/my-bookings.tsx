"use client"

import { format } from "date-fns"
import { Calendar, MapPin, Clock, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

// Mock data for bookings
const bookings = [
  {
    id: 1,
    date: new Date(2025, 3, 24),
    seatId: "TC-101",
    zone: "Tender Checking Area",
    time: "9:00 AM - 5:00 PM",
  },
  {
    id: 2,
    date: new Date(2025, 3, 25),
    seatId: "CB-203",
    zone: "Cubical Area",
    time: "10:00 AM - 4:00 PM",
  },
  {
    id: 3,
    date: new Date(2025, 3, 26),
    seatId: "SR-305",
    zone: "Store Room",
    time: "8:00 AM - 3:00 PM",
  },
]

export default function MyBookings() {
  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-medium text-slate-300">Upcoming Bookings</h3>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Calendar className="w-10 h-10 mb-2 text-slate-400" />
            <p className="text-sm text-slate-400">No upcoming bookings</p>
            <Button variant="outline" size="sm" className="mt-4">
              Book a Desk
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <Card key={booking.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="text-sm font-medium text-slate-200">
                        {format(booking.date, "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-200">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="text-xs text-slate-300">
                        {booking.seatId}, {booking.zone}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-slate-400" />
                      <span className="text-xs text-slate-300">{booking.time}</span>
                    </div>
                  </div>

                  <Separator className="my-2 bg-slate-700" />

                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}
