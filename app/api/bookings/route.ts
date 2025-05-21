import { NextResponse } from 'next/server';
import { db } from '@/lib/mysql';
import { bookings, employees } from '../../../lib/dummyData';

/*export async function POST(request: Request) {
  const data = await request.json();
  // data: { employee_id, booking_date, from_time, to_time, total_hours, seat_no }
  await db.query(
    `INSERT INTO booking (employee_id, booking_date, from_time, to_time, total_hours, seat_no)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.employee_id,
      data.booking_date,
      data.from_time,
      data.to_time,
      data.total_hours,
      data.seat_no,
    ]
  );
  // Optionally update seat status
  await db.query(
    `UPDATE Seats SET is_booked = true WHERE seat_no = ?`,
    [data.seat_no]
  );
  return NextResponse.json({ success: true });
}*/

export async function GET() {
  return NextResponse.json(bookings);
}

export async function POST(request: Request) {
  const { employee_email } = await request.json();
  const employee = employees.find(e => e.employee_email === employee_email);
  if (employee) {
    return NextResponse.json({ success: true, employee });
  } else {
    return NextResponse.json({ success: false, message: 'Invalid email' }, { status: 401 });
  }
}