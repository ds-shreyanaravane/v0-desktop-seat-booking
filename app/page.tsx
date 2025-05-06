"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";
import SeatFilters from "@/components/SeatFilters";
import FloorPlan from "@/components/FloorPlan";
import StatsOverlay from "@/components/StatsOverlay";
import SeatDialog from "@/components/SeatDialog";

export default function BookingApp() {
  const router = useRouter();

  // State
  const [employee, setEmployee] = useState<any>(null);
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

  // Generate 24-hour time slots
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, "0");
    return `${hour}:00`;
  });

  // Employee check
  useEffect(() => {
    const emp = JSON.parse(localStorage.getItem("employee") || "null");
    setEmployee(emp);
    if (!emp) {
      router.push("/login");
    }
  }, [router]);

  // Generate mock seats (replace with API call in production)
  useEffect(() => {
    const generateSeats = () => {
      const mockSeats: any[] = [];
      const angle = 20;
      const adjustForAngle = (x: number, y: number, rowIndex: number, colIndex: number) => {
        const angleOffset = rowIndex * Math.tan((angle * Math.PI) / 180) * 10;
        return {
          x: x + angleOffset + colIndex * 5,
          y: y,
        };
      };
      const tenderStartX = 245;
      const tenderStartY = 285;
      const rowSpacing = 40;
      const colSpacing = 45;
      const tenderRows = [
        [
          { id: "TC-101", status: "available" },
          { id: "TC-102", status: "available" },
          { id: "TC-103", status: "booked" },
          { id: "TC-104", status: "available" },
        ],
        // ...add more rows as needed
      ];
      tenderRows.forEach((row, rowIndex) => {
        row.forEach((seat, colIndex) => {
          const { x, y } = adjustForAngle(
            tenderStartX + colIndex * colSpacing,
            tenderStartY + rowIndex * rowSpacing,
            rowIndex,
            colIndex,
          );
          mockSeats.push({
            id: seat.id,
            x,
            y,
            width: 40,
            height: 25,
            status: seat.status,
            type: "standard",
            zone: "tender",
            angle: angle,
          });
        });
      });
      // Floor stats
      const total = mockSeats.length;
      const available = mockSeats.filter((seat) => seat.status === "available").length;
      const booked = mockSeats.filter((seat) => seat.status === "booked").length;
      const yours = mockSeats.filter((seat) => seat.status === "yours").length;
      setFloorStats({ total, available, booked, yours });
      return mockSeats;
    };
    setSeats(generateSeats());
  }, []);

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
  const handleBookSeat = async () => {
    if (selectedSeat && employee) {
      setSeats(
        seats.map((seat) =>
          seat.id === selectedSeat.id ? { ...seat, status: "yours", bookedBy: employee.employee_name } : seat,
        ),
      );
      setFloorStats((prev) => ({
        ...prev,
        available: prev.available - 1,
        yours: prev.yours + 1,
      }));
      setIsDialogOpen(false);
      router.push("/account");
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
    if (selectedZone && seat.zone !== selectedZone) return false;
    if (selectedSeatType && seat.type !== selectedSeatType) return false;
    if (searchQuery && !seat.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (!employee) return <div>Loading...</div>;

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
        />
        <FloorPlan
          seats={filteredSeats}
          scale={scale}
          position={position}
          onSeatClickAction={handleSeatClick}
          onMouseDownAction={handleMouseDown}
          onMouseMoveAction={handleMouseMove}
          onMouseUpAction={handleMouseUp}
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