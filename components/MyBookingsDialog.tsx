"use client";
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Trash2, Loader2, CalendarDays, Pencil } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format as formatDateFns, startOfDay, parseISO } from 'date-fns';
import Image from 'next/image';

type Booking = {
  booking_id: number;
  seat_no: number;
  seat_type: string;
  seat_zone?: string;
  booking_date: string;
  from_time: string;
  to_time: string;
  created_at: string; 
};

type MyBookingsDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBookingCancelled: () => void; // Callback to refresh seats/data after cancellation
};

export default function MyBookingsDialog({ isOpen, onOpenChange, onBookingCancelled }: MyBookingsDialogProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterFromDate, setFilterFromDate] = useState<Date | undefined>(undefined);
  const [filterToDate, setFilterToDate] = useState<Date | undefined>(undefined);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editFromTime, setEditFromTime] = useState("");
  const [editToTime, setEditToTime] = useState("");
  const [editError, setEditError] = useState("");

  const fetchMyBookings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentSessionId = localStorage.getItem("sessionId");
      console.log("MyBookingsDialog: Attempting to fetch with sessionId from localStorage:", currentSessionId);
      
      if (!currentSessionId) {
        throw new Error("Session ID not found. Please log in again.");
      }

      const params = new URLSearchParams();
      if (filterFromDate) {
        params.append('fromDate', formatDateFns(filterFromDate, 'yyyy-MM-dd'));
      }
      if (filterToDate) {
        params.append('toDate', formatDateFns(filterToDate, 'yyyy-MM-dd'));
      }

      const response = await fetch(`/api/bookings/me?${params.toString()}`, {
        headers: {
          'x-session-id': currentSessionId
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch bookings');
      }
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Error fetching my bookings:", err);
      setError(err instanceof Error ? err.message : 'Could not load your bookings.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchMyBookings();
    }
  }, [isOpen, filterFromDate, filterToDate]);

  const handleCancelBooking = async (bookingId: number, seatNo: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const currentSessionId = localStorage.getItem("sessionId");
      if (!currentSessionId) {
        alert("Session ID not found. Cannot cancel booking. Please log in again.");
        return;
      }
      const response = await fetch(`/api/seats?bookingId=${bookingId}&seatNo=${seatNo}`, {
        method: 'DELETE',
        headers: {
          'x-session-id': currentSessionId
        }
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to cancel booking');
      }
      // Refresh bookings list and notify parent to refresh floor plan
      fetchMyBookings();
      onBookingCancelled(); 
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert(err instanceof Error ? err.message : 'Could not cancel booking.');
    }
  };

  const getStatus = (bookingDate: string, fromTime: string) => {
    const now = new Date();
    const bookingDateObj = new Date(bookingDate);
    const fromTimeObj = new Date(fromTime);
    const bookingStart = new Date(
      bookingDateObj.getFullYear(),
      bookingDateObj.getMonth(),
      bookingDateObj.getDate(),
      fromTimeObj.getUTCHours(),
      fromTimeObj.getUTCMinutes(),
      fromTimeObj.getUTCSeconds()
    );
    const isToday = bookingDateObj.toDateString() === now.toDateString();
    const isYourBooking = localStorage.getItem("sessionId") === bookingDate;
    const currentTime = now.getTime();
    const bookingFrom = bookingStart.getTime();
    let effectiveStatus = 'booked';

    if (isToday) {
      if (currentTime < bookingFrom) {
        effectiveStatus = 'available';
      } else if (isYourBooking) {
        effectiveStatus = 'yours';
      } else {
        effectiveStatus = 'booked';
      }
    } else if (bookingDateObj > now) {
      effectiveStatus = 'available';
    } else {
      effectiveStatus = isYourBooking ? 'yours' : 'booked';
    }

    return <Badge variant={effectiveStatus === 'available' ? "default" : effectiveStatus === 'yours' ? "default" : "secondary"}>{effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}</Badge>;
  };

  const getTimeString = (isoString: string) => {
    const date = new Date(isoString);
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const local = new Date();
    local.setHours(hour, minute, 0, 0);
    return formatDateFns(local, "h:mm a");
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditDate(booking.booking_date);
    setEditFromTime(booking.from_time.slice(0,5));
    setEditToTime(booking.to_time.slice(0,5));
    setEditDialogOpen(true);
    setEditError("");
  };

  const handleEditSubmit = async () => {
    if (!editingBooking) return;
    if (!editDate || !editFromTime || !editToTime) {
      setEditError("Please fill all fields.");
      return;
    }
    if (editFromTime >= editToTime) {
      setEditError("From time must be before To time.");
      return;
    }
    try {
      const response = await fetch(`/api/bookings/${editingBooking.booking_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_date: editDate,
          from_time: editFromTime + ":00",
          to_time: editToTime + ":00",
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        setEditError(err.error || "Failed to update booking");
        return;
      }
      setEditDialogOpen(false);
      setEditingBooking(null);
      fetchMyBookings();
      if (onBookingCancelled) onBookingCancelled();
    } catch (err) {
      setEditError("Failed to update booking");
    }
  };

  const pad = (n: string | number) => n.toString().padStart(2, "0");
  const ensureSeconds = (t: string) => {
    const parts = t.split(":");
    if (parts.length === 2) return `${pad(parts[0])}:${pad(parts[1])}:00`;
    if (parts.length === 3) return `${pad(parts[0])}:${pad(parts[1])}:${pad(parts[2])}`;
    return t;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl rounded-xl bg-[#005792] p-20 shadow-xl border-2 border-[#2A3042]/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-6xl font-bold text-white mb-10">My Bookings</DialogTitle>
          <DialogDescription className="text-gray-200 text-center text-4xl mb-6">View and manage your seat bookings.</DialogDescription>
        </DialogHeader>
        
        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-8 my-10 p-8 border-2 border-[#2A3042]/50 rounded-xl bg-[#1A1F2E]">
          <div className="flex-1">
            <label htmlFor="filterFromDate" className="block text-3xl font-medium text-[#D0D5E0] mb-4">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="filterFromDate"
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-[#131725] hover:bg-[#2A3042] border-2 border-[#2A3042] text-3xl py-8"
                >
                  <CalendarDays className="mr-4 h-10 w-10" />
                  {filterFromDate ? formatDateFns(filterFromDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1E2536] border-2 border-[#2A3042]" align="start">
                <Calendar
                  mode="single"
                  selected={filterFromDate}
                  onSelect={setFilterFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1">
            <label htmlFor="filterToDate" className="block text-3xl font-medium text-[#D0D5E0] mb-4">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="filterToDate"
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-[#131725] hover:bg-[#2A3042] border-2 border-[#2A3042] text-3xl py-8"
                >
                  <CalendarDays className="mr-4 h-10 w-10" />
                  {filterToDate ? formatDateFns(filterToDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1E2536] border-2 border-[#2A3042]" align="start">
                <Calendar
                  mode="single"
                  selected={filterToDate}
                  onSelect={setFilterToDate}
                  disabled={(date) => filterFromDate ? date < startOfDay(filterFromDate) : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
           <Button 
             onClick={() => { setFilterFromDate(undefined); setFilterToDate(undefined); }} 
             variant="ghost" 
             className="sm:self-end text-2xl py-8"
           >
             Clear Filters
           </Button>
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-20 w-20 animate-spin text-purple-500" />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-3xl bg-red-900/20 p-10 rounded-xl flex items-center border-2 border-red-700/30">
            <AlertCircle className="h-12 w-12 mr-8" /> {error}
          </div>
        )}

        {!isLoading && !error && bookings.length === 0 && (
          <p className="text-center py-12 text-4xl">You have no bookings.</p>
        )}

        {!isLoading && !error && bookings.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto pr-8">
            <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-[#2A3042] bg-[#005792]/20">
                  <TableHead className="text-white text-3xl py-10">Seat No.</TableHead>
                  <TableHead className="text-white text-3xl py-10">Date</TableHead>
                  <TableHead className="text-white text-3xl py-10">Time</TableHead>
                  <TableHead className="text-white text-3xl py-10">Status</TableHead>
                  <TableHead className="text-white text-3xl py-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => {
                  const isFutureBooking = new Date(booking.booking_date) > new Date() ||
                    (new Date(booking.booking_date).toDateString() === new Date().toDateString() &&
                     booking.from_time > new Date().toTimeString().slice(0,5));
                  return (
                    <TableRow key={booking.booking_id} className="border-b-2 border-[#2A3042]/50 hover:bg-[#1A1F2E]">
                      <TableCell className="text-3xl py-10">{booking.seat_no} ({booking.seat_type})</TableCell>
                      <TableCell className="text-3xl py-10">{formatDateFns(new Date(booking.booking_date), "MMMM d, yyyy")}</TableCell>
                      <TableCell className="text-3xl py-10">
                        {getTimeString(booking.from_time)} - {getTimeString(booking.to_time)}
                      </TableCell>
                      <TableCell className="py-10">{getStatus(booking.booking_date, booking.from_time)}</TableCell>
                      <TableCell className="py-10">
                        {isFutureBooking && (
                          <div className="flex gap-8">
                            <Button variant="outline" size="icon" onClick={() => handleEditBooking(booking)} className="h-20 w-20">
                              <Pencil className="h-10 w-10" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleCancelBooking(booking.booking_id, booking.seat_no)} className="h-20 w-20">
                              <Trash2 className="h-10 w-10" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <DialogFooter className="mt-12">
          <Button 
            variant="outline" 
            className="font-bold text-[#005792] bg-white border-2 border-[#005792] hover:bg-[#005792] hover:text-white text-2xl px-16 py-10 rounded-xl" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Edit Booking Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-6xl bg-white p-20 rounded-xl shadow-xl border-2 border-[#2A3042]/50 text-black">
          <DialogHeader>
            <DialogTitle className="text-5xl font-bold mb-10">Edit Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-10">
            <div>
              <label className="block text-3xl font-medium mb-4">Date</label>
              <input 
                type="date" 
                className="w-full border-2 rounded-xl px-10 py-8 text-3xl" 
                value={editDate} 
                onChange={e => setEditDate(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-3xl font-medium mb-4">From Time</label>
              <input 
                type="time" 
                className="w-full border-2 rounded-xl px-10 py-8 text-3xl" 
                value={editFromTime} 
                onChange={e => setEditFromTime(e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-3xl font-medium mb-4">To Time</label>
              <input 
                type="time" 
                className="w-full border-2 rounded-xl px-10 py-8 text-3xl" 
                value={editToTime} 
                onChange={e => setEditToTime(e.target.value)} 
              />
            </div>
            {editError && <div className="text-red-600 text-3xl p-8 bg-red-100 rounded-xl border-2 border-red-300">{editError}</div>}
          </div>
          <DialogFooter className="mt-12">
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              className="text-2xl px-16 py-10 rounded-xl border-2"
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              onClick={handleEditSubmit}
              className="text-2xl px-16 py-10 rounded-xl bg-[#005792] text-white hover:bg-[#004a7d]"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// Helper Badge variants (if not already defined in ui/badge.tsx)
// You might need to add these or similar to your badge component styles
// Example:
// .badge-success { background-color: green; color: white; }
// .badge-secondary { background-color: gray; color: white; } 