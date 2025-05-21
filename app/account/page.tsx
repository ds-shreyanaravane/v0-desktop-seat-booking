"use client";
import { useEffect, useState } from "react";

type Booking = {
  booking_id: number;
  seat_no: number;
  booking_date: string;
  from_time: string;
  to_time: string;
  total_hours: number;
  // add other fields if needed
};

export default function AccountPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employee, setEmployee] = useState<any>(null);

  useEffect(() => {
    const emp = JSON.parse(localStorage.getItem("employee") || "null");
    setEmployee(emp);
    if (emp && emp.employee_id) {
      fetch(`/api/bookings?employee_id=${emp.employee_id}`)
        .then(res => res.json())
        .then(data => setBookings(data));
    }
  }, []);

  if (!employee) {
    return <div>Please log in to view your bookings.</div>;
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <h2>My Bookings</h2>
      <div>
        <p><b>Name:</b> {employee.employee_name}</p>
        <p><b>Email:</b> {employee.employee_email}</p>
      </div>
      <ul>
        {bookings.length === 0 && <li>No bookings found.</li>}
        {bookings.map(b => (
          <li key={b.booking_id} style={{ marginBottom: 12 }}>
            <b>Seat:</b> {b.seat_no} | <b>Date:</b> {b.booking_date} | <b>From:</b> {b.from_time} | <b>To:</b> {b.to_time} | <b>Hours:</b> {b.total_hours}
          </li>
        ))}
      </ul>
    </div>
  );
}


  