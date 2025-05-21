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
      <DialogContent className="max-w-3xl rounded-lg bg-[#005792] p-8 shadow-xl border border-[#2A3042]/50 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-white">My Bookings</DialogTitle>
          <DialogDescription className="text-gray-200 text-center">View and manage your seat bookings.</DialogDescription>
        </DialogHeader>
        
        {/* Date Filters */}
        <div className="flex flex-col sm:flex-row gap-4 my-4 p-4 border border-[#2A3042]/50 rounded-lg bg-[#1A1F2E]">
          <div className="flex-1">
            <label htmlFor="filterFromDate" className="block text-sm font-medium text-[#D0D5E0] mb-1">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="filterFromDate"
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-[#131725] hover:bg-[#2A3042] border-[#2A3042]"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {filterFromDate ? formatDateFns(filterFromDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1E2536] border-[#2A3042]" align="start">
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
            <label htmlFor="filterToDate" className="block text-sm font-medium text-[#D0D5E0] mb-1">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="filterToDate"
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-[#131725] hover:bg-[#2A3042] border-[#2A3042]"
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {filterToDate ? formatDateFns(filterToDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#1E2536] border-[#2A3042]" align="start">
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
           <Button onClick={() => { setFilterFromDate(undefined); setFilterToDate(undefined); }} variant="ghost" className="sm:self-end text-sm">Clear Filters</Button>
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        )}

        {error && (
          <div className="text-red-500 bg-red-900/20 p-3 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" /> {error}
          </div>
        )}

        {!isLoading && !error && bookings.length === 0 && (
          <p className="text-center py-4">You have no bookings.</p>
        )}

        {!isLoading && !error && bookings.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <Table>
              <TableHeader>
                <TableRow className="border-b-[#2A3042] bg-[#005792]/20">
                  <TableHead className="text-white">Seat No.</TableHead>
                  <TableHead className="text-white">Date</TableHead>
                  <TableHead className="text-white">Time</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.booking_id} className="border-b-[#2A3042]/50 hover:bg-[#1A1F2E]">
                    <TableCell>{booking.seat_no} ({booking.seat_type})</TableCell>
                    <TableCell>{formatDateFns(new Date(booking.booking_date), "MMMM d, yyyy")}</TableCell>
                    <TableCell>
                      {getTimeString(booking.from_time)} - {getTimeString(booking.to_time)}
                    </TableCell>
                    <TableCell>{getStatus(booking.booking_date, booking.from_time)}</TableCell>
                    <TableCell>
                      {(() => {
                        const bookingDateObj = new Date(booking.booking_date);
                        const fromTimeObj = new Date(booking.from_time);
                        const bookingStart = new Date(
                          bookingDateObj.getFullYear(),
                          bookingDateObj.getMonth(),
                          bookingDateObj.getDate(),
                          fromTimeObj.getUTCHours(),
                          fromTimeObj.getUTCMinutes(),
                          fromTimeObj.getUTCSeconds()
                        );
                        const isFuture = bookingStart > new Date();
                        return isFuture ? (
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEditBooking(booking)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleCancelBooking(booking.booking_id, booking.seat_no)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null;
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <DialogFooter className="mt-4">
          <Button variant="outline" className="font-bold text-[#005792] bg-white border-[#005792] hover:bg-[#005792] hover:text-white" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>

      {/* Edit Booking Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-white p-8 rounded-lg shadow-xl border border-[#2A3042]/50 text-black">
          <DialogHeader>
            <DialogTitle>Edit Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">Date</label>
              <input type="date" className="w-full border rounded px-3 py-2" value={editDate} onChange={e => setEditDate(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1 font-medium">From Time</label>
              <input type="time" className="w-full border rounded px-3 py-2" value={editFromTime} onChange={e => setEditFromTime(e.target.value)} />
            </div>
            <div>
              <label className="block mb-1 font-medium">To Time</label>
              <input type="time" className="w-full border rounded px-3 py-2" value={editToTime} onChange={e => setEditToTime(e.target.value)} />
            </div>
            {editError && <div className="text-red-600 text-sm">{editError}</div>}
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button variant="default" onClick={handleEditSubmit}>Save</Button>
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