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
    <div className="w-[36rem] flex-shrink-0 border-r-4 border-[#2A3042]/70 p-2 bg-[#005792] text-white overflow-y-auto text-2xl">
      <div className="space-y-10">
        <div>
          <Label className="text-white mb-4 block text-3xl font-extrabold">Select Date</Label>
          <div className="w-full flex justify-center">
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
            className="rounded-2xl border-4 border-[#2A3042] bg-white text-black p-0 max-w-[36rem]"
            classNames={{
              day: "h-20 w-20 text-4xl flex items-center justify-center",
              cell: "h-20 w-20 text-4xl text-center p-0 relative",
              caption_label: "text-4xl font-extrabold",
              nav: "space-x-2 flex items-center text-4xl p-2",
              table: "w-full border-collapse space-y-1 text-4xl",
            }}
            initialFocus
          />
          </div>
        </div>
        <div>
          <Label className="text-white mb-4 block text-3xl font-extrabold">From Time</Label>
          <Select value={selectedFromTime} onValueChange={setSelectedFromTime}>
            <SelectTrigger className="w-full bg-white border-4 border-[#2A3042] text-black text-3xl py-7 rounded-3xl">
              <SelectValue placeholder="Select from time" />
            </SelectTrigger>
            <SelectContent className="bg-white border-4 border-[#2A3042] text-black text-3xl rounded-3xl">
              {timeOptions.map((time) => (
                <SelectItem
                  key={time}
                  value={time}
                  className="text-black hover:bg-[#e0e0e0] focus:bg-[#e0e0e0] text-3xl py-6 rounded-3xl"
                >
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white mb-4 block text-3xl font-extrabold">To Time</Label>
          <Select value={selectedToTime} onValueChange={setSelectedToTime}>
            <SelectTrigger className="w-full bg-white border-4 border-[#2A3042] text-black text-3xl py-7 rounded-3xl">
              <SelectValue placeholder="Select to time" />
            </SelectTrigger>
            <SelectContent className="bg-white border-4 border-[#2A3042] text-black text-3xl rounded-3xl">
              {timeOptions.map((time) => (
                <SelectItem
                  key={time}
                  value={time}
                  disabled={time <= selectedFromTime}
                  className="text-black hover:bg-[#e0e0e0] focus:bg-[#e0e0e0] text-3xl py-6 rounded-3xl"
                >
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white mb-4 block text-3xl font-extrabold">Seat Type</Label>
          <Select value={selectedSeatType || ""} onValueChange={setSelectedSeatType}>
            <SelectTrigger className="w-full bg-white border-4 border-[#2A3042] text-black text-2xl py-5 rounded-2xl">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-white border-4 border-[#2A3042] text-black text-2xl rounded-2xl">
              <SelectItem value="standard" className="text-black hover:bg-[#e0e0e0] text-2xl py-4 rounded-2xl">Standard</SelectItem>
              <SelectItem value="cubic" className="text-black hover:bg-[#e0e0e0] text-2xl py-4 rounded-2xl">Cubic</SelectItem>
              <SelectItem value="meeting" className="text-black hover:bg-[#e0e0e0] text-2xl py-4 rounded-2xl">Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button 
          onClick={onApplyFilters}
          className="w-full mt-12 bg-gradient-to-r from-[#8BC34A] to-[#43a047] hover:from-[#7CB342] hover:to-[#388E3C] text-white font-extrabold text-2xl py-6 px-10 rounded-2xl shadow-xl transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-[#8BC34A] focus:ring-opacity-50"
        >
          Apply Filters
        </button>
        <button
          onClick={onClearFilters}
          className="w-full mt-4 bg-white text-[#005792] font-extrabold text-2xl py-6 px-10 rounded-2xl border-4 border-[#005792] shadow-xl transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-[#005792] focus:ring-opacity-50"
        >
          Clear Filters
        </button>
        <div className="mt-12 relative">
          <Label className="text-white mb-4 block text-3xl font-extrabold">Search Employee Seat</Label>
          <input
            type="text"
            value={employeeSearch}
            onChange={e => setEmployeeSearch(e.target.value)}
            placeholder="Enter employee name or ID"
            className="w-full bg-white border-4 border-[#2A3042] rounded-2xl px-6 py-5 text-2xl text-black focus:ring-4 focus:ring-[#8BC34A] focus:border-[#8BC34A] placeholder-gray-500"
            onFocus={() => setShowSuggestions(employeeSuggestions.length > 0)}
            autoComplete="off"
          />
          {showSuggestions && employeeSuggestions.length > 0 && (
            <div className="absolute z-20 w-full bg-white border-4 border-[#2A3042] rounded-2xl mt-2 max-h-80 overflow-y-auto shadow-2xl text-2xl">
              {employeeSuggestions.map(emp => (
                <div
                  key={emp.employee_id}
                  className="px-6 py-5 cursor-pointer hover:bg-[#e0e0e0] text-black text-2xl rounded-2xl"
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
            className="w-full mt-4 bg-gradient-to-r from-[#8BC34A] to-[#43a047] hover:from-[#7CB342] hover:to-[#388E3C] text-white font-extrabold text-2xl py-5 px-10 rounded-2xl shadow-xl transition-all duration-150 ease-in-out focus:outline-none focus:ring-4 focus:ring-[#8BC34A] focus:ring-opacity-50"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}