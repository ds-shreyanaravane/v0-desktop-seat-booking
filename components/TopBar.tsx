import React, { useState, useEffect } from 'react';
import { Building, Calendar as CalendarIcon, Search, ZoomIn, ZoomOut, Maximize2, Minimize2, Plus, Minus, RefreshCw, LogOut, User, BookUser } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import Image from 'next/image';
import SeatDialog from "@/components/SeatDialog";

type Employee = {
  employee_id: string;
  employee_name: string;
  employee_email: string;
};

type TopBarProps = {
  employee: Employee | null;
  onLogout: () => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  scale: number;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  resetView: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onShowMyBookings: () => void;
  floorNo?: number;
  wingNo?: string | number;
  seats: any[];
  handleBookSeat: (fromTime: string, toTime: string, bookingDate: string, seat: any) => void;
  onSeatSearch: (seat: any) => void;
};

export default function TopBar({
  employee,
  onLogout,
  selectedDate,
  setSelectedDate,
  searchQuery,
  setSearchQuery,
  scale,
  handleZoomIn,
  handleZoomOut,
  resetView,
  isFullscreen,
  toggleFullscreen,
  onShowMyBookings,
  floorNo,
  wingNo,
  seats = [],
  handleBookSeat,
  onSeatSearch,
}: TopBarProps) {
  const [isSeatDialogOpen, setIsSeatDialogOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);

  const handleSearch = () => {
    const seatNo = searchQuery.trim();
    if (!seatNo) return;
    const foundSeat = seats.find(seat => String(seat.seat_no) === seatNo);
    if (foundSeat) {
      onSeatSearch(foundSeat);
    } else {
      alert('Seat not found');
    }
  };

  return (
    <div className="h-40 flex items-center justify-between px-20 md:px-32 bg-[#005792] border-b-8 border-[#2A3042] text-white shadow-2xl text-4xl">
      <div className="flex items-center mr-16">
        <Image src="/marico-icon.png" alt="Marico Logo" width={96} height={96} className="mr-10" priority />
        <h1 className="text-5xl md:text-6xl font-extrabold text-white flex items-center gap-16">
          Seat Booking
          {typeof floorNo !== 'undefined' && (
            <span className="ml-12 px-10 py-4 rounded-2xl bg-[#8BC34A]/20 text-[#8BC34A] text-3xl font-extrabold">Floor {floorNo}</span>
          )}
          {typeof wingNo !== 'undefined' && (
            <span className="ml-8 px-10 py-4 rounded-2xl bg-[#43a047]/20 text-[#43a047] text-3xl font-extrabold">Wing {wingNo}</span>
          )}
        </h1>
      </div>

      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-2xl md:max-w-4xl mr-20">
          <Search className="absolute left-8 top-1/2 transform -translate-y-1/2 h-14 w-14 text-gray-200" />
          <input
            type="text"
            placeholder="Search Seat No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                handleSearch();
              }
            }}
            className="w-full bg-white border-4 border-[#2A3042] rounded-2xl pl-28 pr-10 py-8 text-4xl text-black focus:ring-4 focus:ring-[#8BC34A] focus:border-[#8BC34A] placeholder-gray-500"
          />
        </div>
        {employee ? (
          <div className="flex items-center space-x-12 md:space-x-16">
            <div className="flex items-center space-x-8 p-8 rounded-2xl hover:bg-[#1976d2] cursor-default">
              <User size={56} className="text-[#8BC34A]"/>
              <span className="text-4xl font-extrabold text-white hidden md:inline">{employee.employee_name}</span>
            </div>
            <button 
              onClick={onShowMyBookings}
              title="My Bookings"
              className="flex items-center gap-4 p-8 hover:bg-[#1976d2] rounded-2xl"
            >
              <BookUser size={56} className="text-white" />
              <span className="text-4xl font-extrabold text-white">My Bookings</span>
            </button>
            <button 
              onClick={onLogout} 
              title="Logout"
              className="p-8 hover:bg-[#1976d2] rounded-2xl"
            >
              <LogOut size={56} className="text-[#F44336]"/>
            </button>
          </div>
        ) : (
          <span className="text-4xl ml-16">Not logged in</span>
        )}
      </div>

      <div className="hidden md:flex items-center space-x-8 ml-16">
        <button onClick={handleZoomIn} title="Zoom In" className="p-8 hover:bg-[#1976d2] rounded-2xl">
          <Plus size={56} className="text-white" />
        </button>
        <button onClick={handleZoomOut} title="Zoom Out" className="p-8 hover:bg-[#1976d2] rounded-2xl">
          <Minus size={56} className="text-white" />
        </button>
        <button onClick={resetView} title="Reset View" className="p-8 hover:bg-[#1976d2] rounded-2xl">
          <RefreshCw size={56} className="text-white" />
        </button>
        <button onClick={toggleFullscreen} title="Toggle Fullscreen" className="p-8 hover:bg-[#1976d2] rounded-2xl">
          <Maximize2 size={56} className="text-white" />
        </button>
      </div>

      <SeatDialog
        selectedSeat={selectedSeat}
        isDialogOpen={isSeatDialogOpen}
        setIsDialogOpen={setIsSeatDialogOpen}
        selectedDate={selectedDate}
        selectedTime={""}
        handleBookSeat={(fromTime, toTime, bookingDate) =>
          handleBookSeat(fromTime, toTime, bookingDate, selectedSeat)
        }
        handleCancelBooking={() => setIsSeatDialogOpen(false)}
        bookingError={null}
      />
    </div>
  );
}