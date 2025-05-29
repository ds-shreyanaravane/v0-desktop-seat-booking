import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { User, Clock, Trash2 } from "lucide-react";
import { format as formatDateFns, parseISO } from "date-fns";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { TableCell } from "@/components/ui/table";

const formatTime = (date: Date) => date.toTimeString().slice(0,5);

// Helper to format date to YYYY-MM-DD for input type="date"
const toInputDateString = (date: Date): string => formatDateFns(date, "yyyy-MM-dd");
// Helper to format time to HH:mm for input type="time"
const toInputTimeString = (date: Date): string => formatDateFns(date, "HH:mm");

type SeatDialogProps = {
  selectedSeat: any;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  selectedDate: Date | undefined;
  selectedTime: string;
  handleBookSeat: (fromTime: string, toTime: string, bookingDate: string) => void;
  handleCancelBooking: () => void;
  bookingError?: string | null;
};

export default function SeatDialog({
  selectedSeat,
  isDialogOpen,
  setIsDialogOpen,
  selectedDate,
  selectedTime,
  handleBookSeat,
  handleCancelBooking,
  bookingError,
}: SeatDialogProps) {
  const [internalBookingDate, setInternalBookingDate] = useState<string>("");
  const [fromTime, setFromTime] = useState<string>("");
  const [toTime, setToTime] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  // Initialize and reset state when dialog opens or selectedDate changes
  useEffect(() => {
    if (isDialogOpen) {
      const now = new Date();
      const initialDate = selectedDate ? toInputDateString(selectedDate) : toInputDateString(now);
      
      // Ensure initialDate is not in the past
      const todayStr = toInputDateString(new Date());
      const finalInitialDate = initialDate < todayStr ? todayStr : initialDate;
      setInternalBookingDate(finalInitialDate);

      // Default times: current hour for fromTime, next hour for toTime
      // If initialDate is today, ensure fromTime is not in the past
      let defaultFromHour = now.getHours();
      if (finalInitialDate === todayStr && now.getHours() > defaultFromHour) {
        defaultFromHour = now.getHours();
      }
      
      const fromDate = new Date();
      fromDate.setHours(defaultFromHour, finalInitialDate === todayStr ? now.getMinutes() : 0, 0, 0);
      // Ensure fromTime is not in the past if it's for today
      if (finalInitialDate === todayStr && fromDate < now) {
        fromDate.setHours(now.getHours(), now.getMinutes());
      }


      const toDate = new Date(fromDate.getTime());
      toDate.setHours(fromDate.getHours() + 1);

      setFromTime(toInputTimeString(fromDate));
      setToTime(toInputTimeString(toDate));
      setValidationError(""); // Clear previous errors
    }
  }, [isDialogOpen, selectedDate]);

  // Validation logic
  const validateInputs = useCallback(() => {
    if (!internalBookingDate || !fromTime || !toTime) {
      setValidationError("Please fill in all date and time fields.");
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight

    // Parse internalBookingDate (YYYY-MM-DD string) into a Date object
    // The date string from <input type="date"> is already in local timezone.
    // Adding T00:00:00 ensures it's parsed as local midnight.
    const bookingDateObj = parseISO(internalBookingDate); // date-fns parseISO handles YYYY-MM-DD
    
    // 1. Date >= Today's Date
    // We should compare bookingDateObj (which is at midnight) with today (also at midnight)
    if (bookingDateObj < today) {
      setValidationError("Booking date cannot be in the past.");
      return false;
    }

    // 2. From Time < To Time (lexicographical for HH:mm)
    if (fromTime >= toTime) {
      setValidationError("From time must be earlier than To time.");
      return false;
    }

    // 3. From Time >= Current Time (if booking for today)
    if (toInputDateString(bookingDateObj) === toInputDateString(today)) {
      const now = new Date();
      const currentTimeString = toInputTimeString(now);
      if (fromTime < currentTimeString) {
        setValidationError("Booking start time cannot be in the past for today.");
        return false;
      }
    }

    setValidationError("");
    return true;
  }, [internalBookingDate, fromTime, toTime]);

  // Perform validation whenever date/time inputs change
  useEffect(() => {
    if(isDialogOpen) { // Only validate when dialog is open
      validateInputs();
    }
  }, [internalBookingDate, fromTime, toTime, isDialogOpen, validateInputs]);

  const handleBookClick = () => {
    if (validateInputs()) {
      // Frontend formatTime function for HH:mm:ss to send to backend
      const pad = (n: string | number) => n.toString().padStart(2, "0");
      const formatToFullTime = (t: string) => { // HH:mm -> HH:mm:00
        if (!t) return "00:00:00";
        const [h, m] = t.split(':');
        return `${pad(h)}:${pad(m)}:00`;
      };
      handleBookSeat(formatToFullTime(fromTime), formatToFullTime(toTime), internalBookingDate);
    }
  };
  
  const minDate = toInputDateString(new Date());
  const minTimeToday = internalBookingDate === minDate ? toInputTimeString(new Date()) : undefined;

  const getTimeString = (isoString: string) => {
    const date = new Date(isoString);
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const local = new Date();
    local.setHours(hour, minute, 0, 0);
    return formatDateFns(local, "h:mm a");
  };

  if (!selectedSeat) return null;
  const today = new Date();
  const todayString = formatDateFns(today, "EEEE, MMMM d, yyyy");
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-6xl bg-gradient-to-br from-[#005792] to-[#003d6b] p-20 shadow-2xl border-2 border-[#2A3042]/50 text-white rounded-2xl backdrop-blur-sm">
        <DialogHeader>
          <div className="text-center text-4xl font-extrabold text-white mb-8 bg-white/10 p-6 rounded-xl backdrop-blur-sm">
            {todayString}
          </div>
          <DialogTitle className="mb-12 text-center text-6xl font-bold text-white flex items-center justify-center">
            Seat {selectedSeat.id}
            <Badge
              variant="outline"
              className={
                selectedSeat.status === "available"
                  ? "bg-[#8BC34A]/20 text-[#43a047] border-[#8BC34A]/30 ml-8 text-3xl px-8 py-4 hover:bg-[#8BC34A]/30 transition-all duration-300"
                  : selectedSeat.status === "yours"
                  ? "bg-[#005792]/20 text-[#005792] border-[#005792]/30 ml-8 text-3xl px-8 py-4 hover:bg-[#005792]/30 transition-all duration-300"
                  : "bg-rose-500/20 text-rose-400 border-rose-500/30 ml-8 text-3xl px-8 py-4 hover:bg-rose-500/30 transition-all duration-300"
              }
            >
              {selectedSeat.status === "yours"
                ? "Your Booking"
                : selectedSeat.status.charAt(0).toUpperCase() + selectedSeat.status.slice(1)}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-200 text-center text-4xl mb-10 bg-white/5 p-6 rounded-xl backdrop-blur-sm">
            {internalBookingDate ? formatDateFns(parseISO(internalBookingDate), "EEEE, MMMM d, yyyy") : "No date selected"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-12 mt-12">
          <div className="bg-white/5 p-8 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <label className="block text-4xl font-medium text-white mb-8">Date</label>
            <input
              type="date"
              value={internalBookingDate}
              min={minDate}
              onChange={e => setInternalBookingDate(e.target.value)}
              className="mt-1 block w-full rounded-xl border-2 border-[#2A3042] bg-[#1A1F2E]/80 px-12 py-10 text-4xl text-white placeholder-gray-400 focus:border-[#8BC34A] focus:outline-none focus:ring-4 focus:ring-[#8BC34A] transition-all duration-300 hover:bg-[#1A1F2E]"
            />
          </div>
          <div className="bg-white/5 p-8 rounded-xl backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
            <label className="block text-4xl font-medium text-white mb-8">Time</label>
            <div className="flex items-center space-x-12">
              <input
                type="time"
                value={fromTime}
                min={minTimeToday}
                onChange={e => setFromTime(e.target.value)}
                className="block w-full rounded-xl border-2 border-[#2A3042] bg-[#1A1F2E]/80 px-12 py-10 text-4xl text-white focus:border-[#8BC34A] focus:outline-none focus:ring-4 focus:ring-[#8BC34A] transition-all duration-300 hover:bg-[#1A1F2E]"
              />
              <span className="text-white text-4xl">to</span>
              <input
                type="time"
                value={toTime}
                min={fromTime}
                onChange={e => setToTime(e.target.value)}
                className="block w-full rounded-xl border-2 border-[#2A3042] bg-[#1A1F2E]/80 px-12 py-10 text-4xl text-white focus:border-[#8BC34A] focus:outline-none focus:ring-4 focus:ring-[#8BC34A] transition-all duration-300 hover:bg-[#1A1F2E]"
              />
            </div>
          </div>
          {(validationError || bookingError) && (
            <div className="text-red-500 text-2xl bg-red-900/20 p-8 rounded-xl border-2 border-red-700/30 animate-shake">
              {validationError || bookingError}
            </div>
          )}
          {((selectedSeat.from_time || selectedSeat.fromTime) && (selectedSeat.to_time || selectedSeat.toTime) && (selectedSeat.booking_date || selectedSeat.bookingDate)) && (
            <div className="p-6 bg-[#E8F5E9]/90 rounded-xl border-2 border-[#8BC34A]/30 text-[#1A1F2E] text-xl backdrop-blur-sm hover:bg-[#E8F5E9] transition-all duration-300">
              <Clock className="h-6 w-6 text-[#43a047] inline mr-4" />
              <span className="font-semibold">Booked Time:</span> {formatDateFns(new Date(selectedSeat.booking_date || selectedSeat.bookingDate), "MMMM d, yyyy")}, {getTimeString(selectedSeat.from_time || selectedSeat.fromTime)} - {getTimeString(selectedSeat.to_time || selectedSeat.toTime)}
            </div>
          )}
          {(selectedSeat.status === "booked" || selectedSeat.status === "yours") && selectedSeat.bookedBy && !validationError && !bookingError && (
            <div className="p-6 bg-[#F5FAFF]/90 rounded-xl border-2 border-[#2A3042]/30 text-[#1A1F2E] text-xl backdrop-blur-sm hover:bg-[#F5FAFF] transition-all duration-300">
              <User className="h-6 w-6 text-[#005792] inline mr-4" />
              <span className="font-semibold">Booked by:</span> {selectedSeat.bookedBy}
            </div>
          )}
        </div>
        <DialogFooter className="mt-12 flex flex-row gap-8 justify-end">
          <Button
            variant="outline"
            className="text-2xl px-12 py-8 rounded-xl border-2 text-white hover:bg-white/10 transition-all duration-300"
            onClick={() => setIsDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="text-2xl px-12 py-8 rounded-xl bg-gradient-to-r from-[#8BC34A] to-[#43a047] text-white hover:from-[#43a047] hover:to-[#8BC34A] transition-all duration-300 shadow-lg hover:shadow-xl"
            onClick={handleBookClick}
          >
            Book Seat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}