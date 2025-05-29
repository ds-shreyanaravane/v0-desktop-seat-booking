"use client";
import React from "react";

type Seat = {
  id: string;
  seat_no: number;
  x: number;
  y: number;
  width: number;
  height: number;
  status: "available" | "booked" | "blocked" | "yours" | "reserved";
  type: string;
  zone: string;
  bookedBy?: string;
  angle?: number;
  wing_no: number;
  floor_no: number;
  is_cubic: boolean;
  bookingDate?: string;
  fromTime?: string;
  toTime?: string;
};

type FloorPlanProps = {
  seats: Seat[];
  scale: number;
  position: { x: number; y: number };
  onSeatClickAction: (seat: Seat) => void;
  onMouseDownAction: (e: React.MouseEvent) => void;
  onMouseMoveAction: (e: React.MouseEvent) => void;
  onMouseUpAction: () => void;
  isLoading?: boolean;
};

export default function FloorPlan({
  seats,
  scale,
  position,
  onSeatClickAction,
  onMouseDownAction,
  onMouseMoveAction,
  onMouseUpAction,
  isLoading = false,
}: FloorPlanProps) {
  // Function to determine seat status based on current time and booking
  const getSeatStatus = (seat: Seat) => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
    const today = now.toISOString().split('T')[0];

    // If it's a special object, return its original status
    if (!['standard', 'cubic', 'meeting'].includes(seat.type)) {
      return seat.status;
    }

    // If seat has booking information
    if (seat.bookingDate) {
      const bookingDate = new Date(seat.bookingDate).toISOString().split('T')[0];
      
      // For future bookings (after today), show as available
      if (bookingDate > today) {
        return 'available';
      }
      
      // For today's bookings
      if (bookingDate === today) {
        // If current time is before booking start time
        if (seat.fromTime && currentTime < seat.fromTime) {
          return 'available';
        }
        // If current time is after booking end time
        if (seat.toTime && currentTime > seat.toTime) {
          return 'available';
        }
      }
    }

    return seat.status;
  };

  return (
    <div
      className="flex-1 relative overflow-x-scroll overflow-y-auto bg-white text-black cursor-grab active:cursor-grabbing border-4 border-[#2A3042]"
      style={{ minWidth: "100%", width: "100%" }}
      onMouseDown={onMouseDownAction}
      onMouseMove={onMouseMoveAction}
      onMouseUp={onMouseUpAction}
      onMouseLeave={onMouseUpAction}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#8BC34A]"></div>
        </div>
      )}
      <div
        className="relative transition-transform duration-100"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          left: `${position.x}px`,
          top: `${position.y}px`,
          position: "absolute",
          minWidth: "1200px",
          width: "2000px",
          height: "100vh",
        }}
      >
        <div className="relative w-[2000px] h-full min-w-[1200px] min-h-[900px]">
          {seats.map((seat) => {
            // Get the effective status for the seat
            const effectiveStatus = getSeatStatus(seat);

            // Render seat icon for seats
            const bookableSeatTypes = ["seat", "standard", "cubic", "meeting"];
            if (bookableSeatTypes.includes(seat.type)) {
              return (
                <div
                  key={seat.id}
                  className="absolute cursor-pointer flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    left: `${seat.x}px`,
                    top: `${seat.y}px`,
                    width: `${seat.width}px`,
                    height: `${seat.height}px`,
                    borderRadius: "6px",
                    backgroundColor:
                      effectiveStatus === "available"
                        ? "rgba(34, 197, 94, 0.25)"
                        : effectiveStatus === "yours"
                        ? "rgba(168, 85, 247, 0.25)"
                        : effectiveStatus === "reserved"
                        ? "rgba(156, 163, 175, 0.25)"
                        : "rgba(239, 68, 68, 0.25)",
                    border: `1.5px solid ${
                      effectiveStatus === "available"
                        ? "#22c55e"
                        : effectiveStatus === "yours"
                        ? "#a855f7"
                        : effectiveStatus === "reserved"
                        ? "#9ca3af"
                        : "#ef4444"
                    }`,
                    transform: seat.angle ? `rotate(${seat.angle}deg)` : undefined,
                    transformOrigin: "center center",
                  }}
                  onClick={() => onSeatClickAction(seat)}
                >
                  <span style={{ fontSize: "1.5em", lineHeight: 1 }} role="img" aria-label="seat">🪑</span>
                  <span style={{ 
                    fontWeight: 900,
                    fontSize: "2.5em",
                    color: effectiveStatus === "available"
                      ? "#22c55e"
                      : effectiveStatus === "yours"
                      ? "#a855f7"
                      : effectiveStatus === "reserved"
                      ? "#424242"
                      : "#ef4444"
                  }}>
                    {seat.seat_no}
                  </span>
                </div>
              );
            }
            // Render special objects (pillar, xerox, etc.)
            let specialBg = "#aaa";
            let specialLabel = seat.type.toUpperCase();
            let specialIcon = null;
            let specialBorder = "#333";
            let specialTextColor = "#222";
            
            // Special object mappings with enhanced styling
            if (seat.type === "pillar") { 
              specialBg = "#2C3E50"; // Darker blue-gray for pillars
              specialIcon = "🧱"; 
              specialLabel = "PILLAR";
              specialBorder = "#1A252F";
              specialTextColor = "#fff";
            }
            
            if (seat.type === "xerox") { 
              specialBg = "#f5f5f5"; 
              specialIcon = "🖨️"; 
              specialLabel = "XEROX";
              specialBorder = "#666";
            }
            if (seat.type === "creche_room") { 
              specialBg = "#f9e4d4"; 
              specialIcon = "🧒"; 
              specialLabel = "CRECHE";
              specialBorder = "#e6c9b3";
            }
            if (seat.type === "gents_vc") { 
              specialBg = "#E3F2FD";
              specialIcon = "🚹";
              specialLabel = "GENTS VC";
              specialBorder = "#2196F3";
              specialTextColor = "#1565C0";
            }
            if (seat.type === "handicap_vc") { 
              specialBg = "#F3E5F5";
              specialIcon = "♿";
              specialLabel = "HANDICAP VC";
              specialBorder = "#9C27B0";
              specialTextColor = "#7B1FA2";
            }
            if (seat.type === "ladies_vc") { 
              specialBg = "#FCE4EC";
              specialIcon = "🚺";
              specialLabel = "LADIES VC";
              specialBorder = "#E91E63";
              specialTextColor = "#C2185B";
            }
            if (seat.type === "pantry") { 
              specialBg = "#E8F5E9"; // Light green for pantry
              specialIcon = "🍽️"; 
              specialLabel = "PANTRY";
              specialBorder = "#4CAF50";
              specialTextColor = "#2E7D32";
            }
            if (seat.type === "parking") { 
              specialBg = "#e6e6f3"; 
              specialIcon = "🅿️"; 
              specialLabel = "PARKING";
              specialBorder = "#4a4a8b";
            }
            if (seat.type === "washroom") { 
              specialBg = "#e6f3f3"; 
              specialIcon = "🚻"; 
              specialLabel = "WASHROOM";
              specialBorder = "#4a8b8b";
            }
            if (seat.type === "toilet") { 
              specialBg = "#e6f3f3"; 
              specialIcon = "🚽"; 
              specialLabel = seat.type.toUpperCase().replace("_", " ");
              specialBorder = "#4a8b8b";
            }
            if (seat.type === "elevator") { 
              specialBg = "#f5f5f5"; 
              specialIcon = "🔼"; 
              specialLabel = "ELEVATOR";
              specialBorder = "#666";
            }
            if (seat.type === "staircase") { 
              specialBg = "#f5f5f5"; 
              specialIcon = "⬆️"; 
              specialLabel = "STAIRCASE";
              specialBorder = "#666";
            }
            if (seat.type === "entry_exit") { 
              specialBg = "#ffe6e6"; 
              specialIcon = "🚪"; 
              specialLabel = "EXIT";
              specialBorder = "#ff6b6b";
            }
            if (seat.type === "fire_exit") { 
              specialBg = "#ffe6e6"; 
              specialIcon = "🚨"; 
              specialLabel = "FIRE EXIT";
              specialBorder = "#ff6b6b";
            }
            if (seat.type === "cabin") { 
              specialBg = "#f5f0e6"; 
              specialIcon = "🏢"; 
              specialLabel = "CABIN";
              specialBorder = "#d4c5a9";
            }
            if (seat.type === "meeting_room") { 
              specialBg = "#f5e6e6"; 
              specialIcon = "👥"; 
              specialLabel = "MEETING ROOM";
              specialBorder = "#d4a9a9";
            }
            if (seat.type === "reception") { 
              specialBg = "#e6eef5"; 
              specialIcon = "🏨"; 
              specialLabel = "RECEPTION";
              specialBorder = "#a9c1d4";
            }
            if (seat.type === "store") { 
              specialBg = "#D7CCC8"; // Light brown for store
              specialIcon = "📦"; 
              specialLabel = "STORE";
              specialBorder = "#8D6E63";
              specialTextColor = "#4E342E";
            }
            
            // Handle variations in type names with consistent styling
            if (seat.type.includes("toilet")) { 
              specialBg = "#e6f3f3"; 
              specialIcon = "🚽"; 
              specialLabel = seat.type.toUpperCase().replace("_", " ");
              specialBorder = "#4a8b8b";
            }
            if (seat.type.includes("cabin")) { 
              specialBg = "#f5f0e6"; 
              specialIcon = "🏢"; 
              specialLabel = seat.type.toUpperCase().replace("_", " ");
              specialBorder = "#d4c5a9";
            }
            if (seat.type.includes("meeting")) { 
              specialBg = "#f5e6e6"; 
              specialIcon = "👥"; 
              specialLabel = seat.type.toUpperCase().replace("_", " ");
              specialBorder = "#d4a9a9";
            }
            
            return (
              <div
                key={seat.id}
                className="absolute flex flex-col items-center justify-center text-xs font-medium"
                style={{
                  left: `${seat.x}px`,
                  top: `${seat.y}px`,
                  width: `${seat.width}px`,
                  height: `${seat.height}px`,
                  borderRadius: "6px",
                  backgroundColor: specialBg,
                  border: `1.5px solid ${specialBorder}`,
                  color: specialTextColor,
                  transform: seat.angle ? `rotate(${seat.angle}deg)` : undefined,
                  transformOrigin: "center center",
                }}
              >
                {specialIcon && (
                  <span style={{ fontSize: "2.5em", lineHeight: 1 }} role="img" aria-label={seat.type}>
                    {specialIcon}
                  </span>
                )}
                <span style={{ 
                  fontWeight: 600, 
                  fontSize: "1.8em",
                  textAlign: "center",
                  marginTop: specialIcon ? "4px" : "0"
                }}>
                  {specialLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}