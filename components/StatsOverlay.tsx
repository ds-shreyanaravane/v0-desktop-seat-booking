type FloorStats = {
  total: number;
  available: number;
  booked: number;
  yours: number;
};

export default function StatsOverlay({ floorStats }: { floorStats: FloorStats }) {
    return (
      <div className="absolute bottom-4 right-4 bg-[#1E2536]/80 backdrop-blur-md rounded-lg border border-[#2A3042] p-3 shadow-lg">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
            <span className="text-xs text-[#D0D5E0]">{floorStats.available} Available</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-rose-500 rounded-full mr-2"></div>
            <span className="text-xs text-[#D0D5E0]">{floorStats.booked} Booked</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <span className="text-xs text-[#D0D5E0]">{floorStats.yours} Your Bookings</span>
          </div>
        </div>
      </div>
    );
  }