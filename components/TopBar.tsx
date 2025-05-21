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
}: TopBarProps) {
  const [isSeatDialogOpen, setIsSeatDialogOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);

  return (
    <div className="h-16 flex items-center justify-between px-4 md:px-6 bg-[#005792] border-b-2 border-[#2A3042] text-white shadow-md">
      <div className="flex items-center mr-4">
        <Image src="/marico-icon.png" alt="Marico Logo" width={40} height={40} className="mr-3" priority />
        <h1 className="text-lg md:text-xl font-semibold text-white flex items-center gap-4">
          Seat Booking
          {typeof floorNo !== 'undefined' && (
            <span className="ml-4 px-3 py-1 rounded bg-[#8BC34A]/20 text-[#8BC34A] text-sm font-bold">Floor {floorNo}</span>
          )}
          {typeof wingNo !== 'undefined' && (
            <span className="ml-2 px-3 py-1 rounded bg-[#43a047]/20 text-[#43a047] text-sm font-bold">Wing {wingNo}</span>
          )}
        </h1>
      </div>

      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-xs md:max-w-sm mr-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-200" />
          <input
            type="text"
            placeholder="Search Seat No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchQuery.trim()) {
                const seatNo = parseInt(searchQuery.trim(), 10);
                const foundSeat = seats.find(seat => Number(seat.seat_no) === seatNo);
                if (foundSeat) {
                  setSelectedSeat(foundSeat);
                  setIsSeatDialogOpen(true);
                } else {
                  alert("Seat not found");
                }
              }
            }}
            className="w-full bg-white border border-[#2A3042] rounded-md pl-10 pr-3 py-2 text-sm text-black focus:ring-1 focus:ring-[#8BC34A] focus:border-[#8BC34A] placeholder-gray-500"
          />
        </div>
        {employee ? (
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-[#1976d2] cursor-default">
              <User size={18} className="text-[#8BC34A]"/>
              <span className="text-sm font-medium text-white hidden md:inline">{employee.employee_name}</span>
            </div>
            <button 
              onClick={onShowMyBookings}
              title="My Bookings"
              className="p-2 hover:bg-[#1976d2] rounded-md"
            >
              <BookUser size={18} className="text-white" />
            </button>
            <button 
              onClick={onLogout} 
              title="Logout"
              className="p-2 hover:bg-[#1976d2] rounded-md"
            >
              <LogOut size={18} className="text-[#F44336]"/>
            </button>
          </div>
        ) : (
          <span className="text-sm ml-4">Not logged in</span>
        )}
      </div>

      <div className="hidden md:flex items-center space-x-1 ml-4">
        <button onClick={handleZoomIn} title="Zoom In" className="p-2 hover:bg-[#1976d2] rounded-md">
          <Plus size={18} className="text-white" />
        </button>
        <button onClick={handleZoomOut} title="Zoom Out" className="p-2 hover:bg-[#1976d2] rounded-md">
          <Minus size={18} className="text-white" />
        </button>
        <button onClick={resetView} title="Reset View" className="p-2 hover:bg-[#1976d2] rounded-md">
          <RefreshCw size={18} className="text-white" />
        </button>
        <button onClick={toggleFullscreen} title="Toggle Fullscreen" className="p-2 hover:bg-[#1976d2] rounded-md">
          <Maximize2 size={18} className="text-white" />
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