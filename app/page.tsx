"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import SeatFilters from "@/components/SeatFilters";
import FloorPlan from "@/components/FloorPlan";
import StatsOverlay from "@/components/StatsOverlay";
import SeatDialog from "@/components/SeatDialog";
import LoginForm from "@/components/LoginForm";
import MyBookingsDialog from "@/components/MyBookingsDialog";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
};

export default function BookingApp() {
  const router = useRouter();

  // State
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedSeatType, setSelectedSeatType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [floorStats, setFloorStats] = useState({
    total: 0,
    available: 0,
    booked: 0,
    yours: 0,
  });
  const [seats, setSeats] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFromTime, setSelectedFromTime] = useState("");
  const [selectedToTime, setSelectedToTime] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Generate 24-hour time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  // On mount, check for session in localStorage
  useEffect(() => {
    const storedSessionId = localStorage.getItem("sessionId");
    if (storedSessionId) {
      checkSession(storedSessionId);
    }
  }, []);

  // Handle login
  const handleLogin = async (employee: Employee, sid: string) => {
    setEmployee(employee);
    setSessionId(sid);
    localStorage.setItem("sessionId", sid);
  };

  // Generate mock seats (replace with API call in production)
  useEffect(() => {
    if (!employee) return;
    fetchSeats(); // Fetch initial seats when employee logs in
    // Dependencies removed to prevent auto-refetch on filter changes
  }, [employee]);

  // Pan/Zoom Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setStartPosition({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - startPosition.x,
      y: e.clientY - startPosition.y,
    });
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 0.5));
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Seat selection
  const handleSeatClick = (seat: any) => {
    setSelectedSeat(seat);
    setIsDialogOpen(true);
  };

  // Booking logic
  const pad = (n: string | number) => n.toString().padStart(2, "0");
  // Always return time in HH:mm:ss format, appending :00 if needed
  const formatTime = (t: string) => {
    // t can be "HH:mm", "H:mm", or "HH:mm:ss"
    if (!t) return "";
    const parts = t.split(":");
    if (parts.length === 2) {
      // HH:mm or H:mm
      const [h, m] = parts;
      return `${pad(h)}:${pad(m)}:00`;
    } else if (parts.length === 3) {
      // HH:mm:ss or H:mm:ss
      const [h, m, s] = parts;
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    } else {
      return t; // fallback, but should not happen
    }
  };

  const handleBookSeat = async (fromTime: string, toTime: string, bookingDate: string) => {
    if (selectedSeat && employee) {
      setIsLoading(true);
      setBookingError(null);
      try {
        if (!fromTime || !toTime) {
          setBookingError("Please select both from and to times.");
          setIsLoading(false);
          return;
        }
        // Validate time format: should be HH:mm, H:mm, or HH:mm:ss
        const timeRegex = /^\d{1,2}:\d{2}(:\d{2})?$/;
        if (!timeRegex.test(fromTime) || !timeRegex.test(toTime)) {
          setBookingError("Invalid time format. Please use HH:mm or HH:mm:ss.");
          setIsLoading(false);
          return;
        }
        const formattedFromTime = formatTime(fromTime);
        const formattedToTime = formatTime(toTime);
        console.log('FE time- fromTime:', fromTime, 'toTime:', toTime);
        console.log('BE time- fromTime:', formattedFromTime, 'toTime:', formattedToTime);
        console.log('Booking payload:', {
          seatId: selectedSeat.seat_no,
          employeeId: employee.employee_id,
          fromTime: formattedFromTime,
          toTime: formattedToTime,
          bookingDate
        });
        const response = await fetch("/api/seats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seatId: selectedSeat.seat_no,
            employeeId: employee.employee_id,
            fromTime: formattedFromTime,
            toTime: formattedToTime,
            bookingDate
          })
        });

        console.log('Booking API response status:', response.status);
        if (!response.ok) {
          const error = await response.json();
          console.error('Booking API error:', error);
          setBookingError(error.error || 'Failed to book seat');
          await fetchSeats();
          return;
        }

        await fetchSeats();
        setIsDialogOpen(false);
        setSelectedSeat(null);
      } catch (error) {
        console.error('Booking exception:', error);
        setBookingError('Failed to book seat');
        await fetchSeats();
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleCancelBooking = async () => {
    if (selectedSeat) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/seats?bookingId=${selectedSeat.booking_id}`, {
          method: "DELETE"
        });

        if (!response.ok) {
          throw new Error('Failed to cancel booking');
        }

        await fetchSeats();
        setIsDialogOpen(false);
        setSelectedSeat(null);
      } catch (error) {
        console.error("Error canceling booking:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Filter seats
  const filteredSeats = filtersApplied
    ? seats.filter((seat) => {
        // Always show blocked seats if no time filter is applied
        if (!selectedFromTime || !selectedToTime) {
          if (seat.status === "blocked" || seat.status === "reserved") return true;
        }
        // Only show available seats for the selected time and type
        if (selectedSeatType && seat.type !== selectedSeatType) return false;
        if (searchQuery && !seat.seat_no.toString().includes(searchQuery)) return false;
        if (selectedFromTime && selectedToTime) {
          // Only show seats that are available for the entire slot
          return seat.status === "available";
        }
        return seat.status === "available";
      })
    : seats;
  

  const fetchSeats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSeatType) params.append("seatType", selectedSeatType);
      if (searchQuery) params.append("searchQuery", searchQuery);
      if (employee?.employee_id) {
        params.append("requestingEmployeeId", employee.employee_id);
      }
      
      // Add date and time range parameters if they are selected
      if (selectedDate) {
        params.append("bookingDate", selectedDate.toISOString().slice(0, 10)); // YYYY-MM-DD
        // Only add time filters if a date is also selected
        if (selectedFromTime) { // Assuming selectedFromTime is HH:mm from SeatFilters
          params.append("fromTime", formatTime(selectedFromTime)); // formatTime converts to HH:mm:ss
        }
        if (selectedToTime) {   // Assuming selectedToTime is HH:mm from SeatFilters
          params.append("toTime", formatTime(selectedToTime));     // formatTime converts to HH:mm:ss
        }
      }

      const response = await fetch(`/api/seats?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch seats');
      }
      
      const data = await response.json();
      setSeats(data.seats);
      setFloorStats(data.stats);
    } catch (error) {
      console.error("Error fetching seats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSession = async (sid: string) => {
    try {
      const response = await fetch("/api/auth", {
        headers: { "x-session-id": sid }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployee(data.employee);
      } else {
        localStorage.removeItem("sessionId");
        setSessionId(null);
        setEmployee(null);
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  };

  const handleLogout = async () => {
    if (sessionId) {
      try {
        await fetch("/api/auth", {
          method: "DELETE",
          headers: { "x-session-id": sessionId }
        });
      } catch (error) {
        console.error("Logout failed:", error);
      }
    }
    localStorage.removeItem("sessionId");
    setSessionId(null);
    setEmployee(null);
    setIsMyBookingsOpen(false);
  };

  const handleApplyFilters = () => {
    if (!employee) return; // Should not happen if filters are visible
    setFiltersApplied(true);
    fetchSeats();
  };

  const handleClearFilters = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setSelectedSeatType(null);
    setSelectedFromTime("");
    setSelectedToTime("");
    setFiltersApplied(false);
    fetchSeats();
  };

  const handleSearchEmployeeSeat = async (employee: any) => {
    try {
      console.log('Searching for employee:', employee);
      const response = await fetch(`/api/bookings/employee/${employee.employee_id}`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch employee booking');
      }
      
      const data = await response.json();
      console.log('Booking data:', data);
      
      if (data.booking) {
        // If there's a current booking, show it in the floor plan
        setSelectedDate(new Date(data.booking.booking_date));
        setSelectedFromTime(data.booking.from_time.slice(0, 5));
        setSelectedToTime(data.booking.to_time.slice(0, 5));
        setFiltersApplied(true);
        fetchSeats();
      } else {
        alert('No current booking found for this employee.');
      }
    } catch (error) {
      console.error('Error searching employee seat:', error);
      alert(error instanceof Error ? error.message : 'Failed to search employee seat.');
    }
  };

  // --- LOGIN FORM ---
  if (!employee) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // --- SEAT BOOKING UI ---
  // Determine current floor and wing from the first seat (if available)
  const currentFloorNo = filteredSeats.length > 0 ? filteredSeats[0].floor_no : undefined;
  const currentWingNo = filteredSeats.length > 0 ? filteredSeats[0].wing_no : undefined;

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden rounded-none border-none bg-gradient-to-b from-[#1A1F2E] to-[#131725] p-0 m-0 flex flex-col">
      <TopBar
        employee={employee}
        onLogout={handleLogout}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        scale={scale}
        handleZoomIn={handleZoomIn}
        handleZoomOut={handleZoomOut}
        resetView={resetView}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        onShowMyBookings={() => setIsMyBookingsOpen(true)}
        floorNo={currentFloorNo}
        wingNo={currentWingNo}
      />
      <div className="flex flex-row flex-1 min-h-0 overflow-auto">
        <SeatFilters
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          selectedSeatType={selectedSeatType}
          setSelectedSeatType={setSelectedSeatType}
          timeSlots={timeSlots}
          selectedFromTime={selectedFromTime}
          setSelectedFromTime={setSelectedFromTime}
          selectedToTime={selectedToTime}
          setSelectedToTime={setSelectedToTime}
          onApplyFilters={handleApplyFilters}
          onClearFilters={handleClearFilters}
          onSearchEmployeeSeat={handleSearchEmployeeSeat}
        />
        <FloorPlan
          seats={filteredSeats}
          scale={scale}
          position={position}
          onSeatClickAction={(seat) => {
            if (seat.status !== "blocked") {
              handleSeatClick(seat);
            }
          }}
          onMouseDownAction={handleMouseDown}
          onMouseMoveAction={handleMouseMove}
          onMouseUpAction={handleMouseUp}
          isLoading={isLoading}
        />
      </div>
      <StatsOverlay floorStats={floorStats} />
      <SeatDialog
        selectedSeat={selectedSeat}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        handleBookSeat={handleBookSeat}
        handleCancelBooking={handleCancelBooking}
        bookingError={bookingError}
      />
      <MyBookingsDialog
        isOpen={isMyBookingsOpen}
        onOpenChange={setIsMyBookingsOpen}
        onBookingCancelled={() => {
          fetchSeats();
        }}
      />
    </div>
  );
}
