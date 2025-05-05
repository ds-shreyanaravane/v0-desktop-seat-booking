"use client";
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";

/*import { redirect } from "next/navigation"
import LoginPage from "@/components/login-page"

export default function Home() {
  // In a real app, you would check for authentication here
  // For demo purposes, we'll just show the login page
  const isAuthenticated = false

  if (isAuthenticated) {
    redirect("/dashboard")
  }

  return <LoginPage />
}*/

type Employee = {
  employee_id: number;
  employee_name: string;
  employee_desig: string;
  employee_partner_id: number;
  employee_dept: string;
  employee_email: string;
};

type Seat = {
  seat_no: number;
  is_booked: boolean;
  wing_no: number;
  floor_no: number;
  partner_id: number;
  is_cubic: boolean;
  x: number;
  y: number;
};

function ChairIcon({ color = "#43a047", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="10" width="12" height="6" rx="2" fill={color} />
      <rect x="7" y="4" width="10" height="7" rx="2" fill={color} />
      <rect x="6" y="17" width="2" height="4" rx="1" fill={color} />
      <rect x="16" y="17" width="2" height="4" rx="1" fill={color} />
    </svg>
  );
}

const today = new Date().toISOString().slice(0, 10);

export default function BookingApp() {
  const [email, setEmail] = useState('');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState(today);
  const [fromTime, setFromTime] = useState("09:00");
  const [toTime, setToTime] = useState("17:00");
  const router = useRouter();

  // Fetch seats for selected date/time
  useEffect(() => {
    fetch(`/api/seats?date=${date}&from=${fromTime}&to=${toTime}`)
      .then(res => res.json())
      .then(data => setSeats(data));
  }, [date, fromTime, toTime]);

  // Login handler
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify({ employee_email: email }),
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      setEmployee(data.employee);
      localStorage.setItem("employee", JSON.stringify(data.employee));
    } else {
      setMessage(data.message);
    }
  };

  // Book seat handler
  const handleBook = async () => {
    if (!selectedSeat || !employee) return;
    const bookingData = {
      employee_id: employee.employee_id,
      seat_no: selectedSeat.seat_no,
      booking_date: date,
      from_time: fromTime,
      to_time: toTime,
      total_hours: 8,
    };
    const res = await fetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      setSelectedSeat(null);
      router.push("/account");
    }
  };

  if (!employee) {
    return (
      <form onSubmit={handleLogin} style={{ margin: "2rem auto", maxWidth: 400 }}>
        <input
          type="email"
          placeholder="Employee Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: 8, width: "100%", marginBottom: 8 }}
        />
        <button type="submit" style={{ padding: 8, width: "100%" }}>Login</button>
        {message && <div style={{ color: 'red', marginTop: 8 }}>{message}</div>}
      </form>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h2>Welcome, {employee.employee_name}</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </label>
        <label style={{ marginLeft: 16 }}>
          From: <select value={fromTime} onChange={e => setFromTime(e.target.value)}>
            <option value="09:00">09:00</option>
            <option value="10:00">10:00</option>
            {/* ...more times */}
          </select>
        </label>
        <label style={{ marginLeft: 16 }}>
          To: <select value={toTime} onChange={e => setToTime(e.target.value)}>
            <option value="17:00">17:00</option>
            <option value="18:00">18:00</option>
            {/* ...more times */}
          </select>
        </label>
      </div>
      <h3>Available Seats</h3>
      <div style={{ position: "relative", width: 900, height: 600, margin: "auto" }}>
        <img
          src="/workspace-ss.png"
          alt="Workspace Map"
          style={{ width: "100%", height: "100%", display: "block" }}
        />
        <svg
          width={900}
          height={600}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {seats.map(seat => (
            <g
              key={seat.seat_no}
              transform={`translate(${seat.x},${seat.y})`}
              onClick={() => !seat.is_booked && setSelectedSeat(seat)}
              style={{ cursor: seat.is_booked ? "not-allowed" : "pointer" }}
            >
              <circle
                cx={0}
                cy={0}
                r={20}
                fill={
                  selectedSeat && selectedSeat.seat_no === seat.seat_no
                    ? "#8e24aa" // purple for selected
                    : seat.is_booked
                    ? "#e53935" // red for booked
                    : "#43a047" // green for available
                }
                opacity={0.2}
              />
              <ChairIcon
                color={
                  selectedSeat && selectedSeat.seat_no === seat.seat_no
                    ? "#8e24aa"
                    : seat.is_booked
                    ? "#e53935"
                    : "#43a047"
                }
                size={28}
              />
              <text
                x={0}
                y={32}
                textAnchor="middle"
                fontSize="12"
                fill="#fff"
                fontWeight="bold"
              >
                {seat.seat_no}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {selectedSeat && (
        <div className="modal">
          <p>Book Seat <b>{selectedSeat.seat_no}</b>?</p>
          <button onClick={handleBook} style={{ marginRight: 8 }}>Confirm</button>
          <button onClick={() => setSelectedSeat(null)}>Cancel</button>
        </div>
      )}
      {message && <div style={{ color: 'green', marginTop: 16 }}>{message}</div>}
    </div>
  );
}
