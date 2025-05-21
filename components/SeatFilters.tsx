import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMemo, useState, useEffect } from "react";
import { startOfDay } from 'date-fns';

type SeatFiltersProps = {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  selectedSeatType: string | null;
  setSelectedSeatType: (type: string | null) => void;
  timeSlots: string[];
  selectedFromTime: string;
  setSelectedFromTime: (t: string) => void;
  selectedToTime: string;
  setSelectedToTime: (t: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onSearchEmployeeSeat: (search: string) => void;
};

export default function SeatFilters({
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  selectedSeatType,
  setSelectedSeatType,
  timeSlots,
  selectedFromTime,
  setSelectedFromTime,
  selectedToTime,
  setSelectedToTime,
  onApplyFilters,
  onClearFilters,
  onSearchEmployeeSeat,
}: SeatFiltersProps) {
  // Generate 30-min interval time options
  const timeOptions = useMemo(() => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }
    return options;
  }, []);

  // Get today's date string
  const todayStr = new Date().toISOString().slice(0, 10);
  // If selected date is today, min from time is now (rounded up to next 30 min)
  const now = new Date();
  let minFromTime = "00:00";
  if (selectedDate && selectedDate.toISOString().slice(0, 10) === todayStr) {
    const minutes = now.getMinutes();
    const roundedMinutes = minutes % 30 === 0 ? minutes : minutes + (30 - (minutes % 30));
    const pad = (n: number) => n.toString().padStart(2, "0");
    minFromTime = `${pad(now.getHours() + (roundedMinutes === 60 ? 1 : 0))}:${pad(roundedMinutes === 60 ? 0 : roundedMinutes)}`;
  }

  const today = startOfDay(new Date());

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeSuggestions, setEmployeeSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (employeeSearch.length > 1) {
      fetch(`/api/employees?search=${encodeURIComponent(employeeSearch)}`)
        .then(res => res.json())
        .then(data => setEmployeeSuggestions(data.employees || []));
      setShowSuggestions(true);
    } else {
      setEmployeeSuggestions([]);
      setShowSuggestions(false);
    }
  }, [employeeSearch]);

  return (
    <div className="w-96 flex-shrink-0 border-r border-[#2A3042]/50 p-8 bg-[#005792] text-white overflow-y-auto">
      <div className="space-y-4">
        <div>
          <Label className="text-white mb-2 block">Select Date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date && date < today) {
                setSelectedDate(today);
              } else {
                setSelectedDate(date);
              }
            }}
            disabled={(date) => date < today}
            className="rounded-lg border border-[#2A3042] bg-white text-black"
            initialFocus
          />
        </div>
        <div>
          <Label className="text-white mb-2 block">From Time</Label>
          <Select value={selectedFromTime} onValueChange={setSelectedFromTime}>
            <SelectTrigger className="w-full bg-white border-[#2A3042] text-black">
              <SelectValue placeholder="Select from time" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#2A3042] text-black">
              {timeOptions.map((time) => (
                <SelectItem
                  key={time}
                  value={time}
                  disabled={selectedDate && selectedDate.toISOString().slice(0, 10) === todayStr && time < minFromTime}
                  className="text-black hover:bg-[#e0e0e0] focus:bg-[#e0e0e0]"
                >
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white mb-2 block">To Time</Label>
          <Select value={selectedToTime} onValueChange={setSelectedToTime}>
            <SelectTrigger className="w-full bg-white border-[#2A3042] text-black">
              <SelectValue placeholder="Select to time" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#2A3042] text-black">
              {timeOptions.map((time) => (
                <SelectItem
                  key={time}
                  value={time}
                  disabled={time <= selectedFromTime}
                  className="text-black hover:bg-[#e0e0e0] focus:bg-[#e0e0e0]"
                >
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white mb-2 block">Seat Type</Label>
          <Select value={selectedSeatType || ""} onValueChange={setSelectedSeatType}>
            <SelectTrigger className="w-full bg-white border-[#2A3042] text-black">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#2A3042] text-black">
              <SelectItem value="standard" className="text-black hover:bg-[#e0e0e0]">Standard</SelectItem>
              <SelectItem value="cubic" className="text-black hover:bg-[#e0e0e0]">Cubic</SelectItem>
              <SelectItem value="meeting" className="text-black hover:bg-[#e0e0e0]">Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button 
          onClick={onApplyFilters}
          className="w-full mt-8 bg-gradient-to-r from-[#8BC34A] to-[#43a047] hover:from-[#7CB342] hover:to-[#388E3C] text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#8BC34A] focus:ring-opacity-50"
        >
          Apply Filters
        </button>
        <button
          onClick={onClearFilters}
          className="w-full mt-2 bg-white text-[#005792] font-semibold py-3 px-4 rounded-lg border border-[#005792] shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#005792] focus:ring-opacity-50"
        >
          Clear Filters
        </button>
        <div className="mt-6 relative">
          <Label className="text-white mb-2 block">Search Employee Seat</Label>
          <input
            type="text"
            value={employeeSearch}
            onChange={e => setEmployeeSearch(e.target.value)}
            placeholder="Enter employee name or ID"
            className="w-full bg-white border border-[#2A3042] rounded-md px-3 py-2 text-sm text-black focus:ring-1 focus:ring-[#8BC34A] focus:border-[#8BC34A] placeholder-gray-500"
            onFocus={() => setShowSuggestions(employeeSuggestions.length > 0)}
            autoComplete="off"
          />
          {showSuggestions && employeeSuggestions.length > 0 && (
            <div className="absolute z-20 w-full bg-white border border-[#2A3042] rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
              {employeeSuggestions.map(emp => (
                <div
                  key={emp.employee_id}
                  className="px-3 py-2 cursor-pointer hover:bg-[#e0e0e0] text-black"
                  onClick={() => {
                    setEmployeeSearch(emp.employee_name);
                    setShowSuggestions(false);
                    onSearchEmployeeSeat(emp);
                  }}
                >
                  {emp.employee_name}
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => onSearchEmployeeSeat(employeeSearch)}
            className="w-full mt-2 bg-gradient-to-r from-[#8BC34A] to-[#43a047] hover:from-[#7CB342] hover:to-[#388E3C] text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#8BC34A] focus:ring-opacity-50"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}