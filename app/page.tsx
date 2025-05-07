"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import SeatFilters from "@/components/SeatFilters";
import FloorPlan from "@/components/FloorPlan";
import StatsOverlay from "@/components/StatsOverlay";
import SeatDialog from "@/components/SeatDialog";
import LoginForm from "@/components/LoginForm";
import { employees as dummyEmployees, mockSeats } from "@/lib/dummyData";

type Employee = {
  employee_id: number;
  employee_name: string;
  employee_email: string;
};

export default function BookingApp() {
  const router = useRouter();

  // State
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
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

  // Dummy login validation (replace with real API in production)
  const handleLogin = async (employee: Employee, sid: string) => {
    setEmployee(employee);
    setSessionId(sid);
    localStorage.setItem("sessionId", sid);
  };

  // Generate mock seats (replace with API call in production)
  useEffect(() => {
    if (!employee) return;
    setSeats(mockSeats);
    // Floor stats
    const total = mockSeats.length;
    const available = mockSeats.filter((seat) => seat.status === "available").length;
    const booked = mockSeats.filter((seat) => seat.status === "booked").length;
    const yours = mockSeats.filter((seat) => seat.status === "yours").length;
    setFloorStats({ total, available, booked, yours });
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
  const handleBookSeat = async (fromTime: string, toTime: string, bookingDate: string) => {
    if (selectedSeat && employee) {
      setIsLoading(true);
      try {
        const response = await fetch("/api/seats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            seatId: selectedSeat.id,
            status: "yours",
            employeeName: employee.employee_name,
            fromTime,
            toTime,
            bookingDate
          })
        });
        const data = await response.json();
        setSeats(data.seats);
        setFloorStats(data.stats);
        setIsDialogOpen(false);
      } catch (error) {
        console.error("Error booking seat:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleCancelBooking = () => {
    if (selectedSeat) {
      setSeats(
        seats.map((seat) =>
          seat.id === selectedSeat.id ? { ...seat, status: "available", bookedBy: undefined } : seat,
        ),
      );
      setFloorStats((prev) => ({
        ...prev,
        available: prev.available + 1,
        yours: prev.yours - 1,
      }));
      setIsDialogOpen(false);
    }
  };

  // Filter seats
  const filteredSeats = seats.filter((seat) => {
    // Always show blocked seats
    if (seat.status === "blocked") return true;

    if (selectedZone && seat.zone !== selectedZone) return false;
    if (selectedSeatType && seat.type !== selectedSeatType) return false;
    if (searchQuery && !seat.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    // Filter by date and time range if set
    if (selectedFromTime && selectedToTime) {
      if (
        seat.bookingDate === (selectedDate ? selectedDate.toISOString().slice(0, 10) : undefined) &&
        seat.fromTime && seat.toTime &&
        !(selectedToTime <= seat.fromTime || selectedFromTime >= seat.toTime)
      ) {
        return false;
      }
    }
    return true;
  });
  

  const fetchSeats = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedZone) params.append("zone", selectedZone);
      if (selectedSeatType) params.append("seatType", selectedSeatType);
      if (searchQuery) params.append("searchQuery", searchQuery);

      const response = await fetch(`/api/seats?${params.toString()}`);
      const data = await response.json();
      
      setSeats(data.seats);
      setFloorStats(data.stats);
    } catch (error) {
      console.error("Error fetching seats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const found = dummyEmployees.find(emp => emp.employee_email === loginEmail.trim());
    if (!found) {
      setLoginError("Invalid email. Please try again.");
      return;
    }
    // Simulate session id
    const sid = Math.random().toString(36).slice(2);
    await handleLogin(found, sid);
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
  };

  // --- LOGIN FORM ---
  if (!employee) {
    return (
      <div className="bg-gradient-to-b from-[#1A1F2E] to-[#131725] min-h-screen flex items-center justify-center">
        <form
          onSubmit={handleLoginFormSubmit}
          className="bg-[#1E2536] p-8 rounded-lg shadow-lg border border-[#2A3042] w-full max-w-sm"
        >
          <h2 className="text-2xl font-bold mb-6 text-white">Employee Login</h2>
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full p-3 mb-4 rounded bg-[#131725] border border-[#2A3042] text-white"
            required
          />
          {loginError && <div className="text-red-500 mb-4">{loginError}</div>}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-2 rounded hover:from-purple-700 hover:to-indigo-800"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // --- SEAT BOOKING UI ---
  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-[#2A3042]/50 bg-gradient-to-b from-[#1A1F2E] to-[#131725] p-0 shadow-xl">
      <TopBar
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
      />
      <div className="flex h-full">
        <SeatFilters
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedTime={selectedTime}
          setSelectedTime={setSelectedTime}
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          selectedSeatType={selectedSeatType}
          setSelectedSeatType={setSelectedSeatType}
          timeSlots={timeSlots}
          selectedFromTime={selectedFromTime}
          setSelectedFromTime={setSelectedFromTime}
          selectedToTime={selectedToTime}
          setSelectedToTime={setSelectedToTime}
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
      />
    </div>
  );
}
