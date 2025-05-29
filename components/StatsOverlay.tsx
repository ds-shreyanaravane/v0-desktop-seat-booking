type FloorStats = {
  total: number;
  available: number;
  booked: number;
  yours: number;
};

export default function StatsOverlay({ floorStats }: { floorStats: FloorStats }) {
    return (
      <div className="absolute top-40 right-8 bg-[#005792] backdrop-blur-lg rounded-2xl border-2 border-[#2A3042] p-10 shadow-2xl min-w-[600px]">
        <div className="flex flex-col space-y-10">
          <div className="flex items-center text-4xl font-extrabold">
            <div className="w-10 h-10 bg-green-500 rounded-full mr-8 border-4 border-green-700"></div>
            <span className="text-white">Available</span>
          </div>
          <div className="flex items-center text-4xl font-extrabold">
            <div className="w-10 h-10 bg-purple-500 rounded-full mr-8 border-4 border-purple-700"></div>
            <span className="text-white">Booked by You</span>
          </div>
          <div className="flex items-center text-4xl font-extrabold">
            <div className="w-10 h-10 bg-red-500 rounded-full mr-8 border-4 border-red-700"></div>
            <span className="text-white">Booked by Others</span>
          </div>
          <div className="flex items-center text-4xl font-extrabold">
            <div className="w-10 h-10 bg-gray-400 rounded-full mr-8 border-4 border-gray-600"></div>
            <span className="text-white">Reserved</span>
          </div>
        </div>
      </div>
    );
  }