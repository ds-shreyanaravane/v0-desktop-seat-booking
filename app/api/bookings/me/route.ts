import { NextResponse } from 'next/server';
import { connectDB, sql } from '@/lib/db';
import { verifySession, addSession, removeSession } from '@/lib/session'; // Assuming you have a session verification utility

export async function GET(request: Request) {
    const session = await verifySession();
    if (!session || !session.employeeId) {
      console.error('[/api/bookings/me] Unauthorized access attempt or missing employeeId in session.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  const employeeId = session.employeeId;
  try {
    console.log('[/api/bookings/me] Session details received:', session);

    console.log(`[/api/bookings/me] Fetching bookings for employeeId: ${employeeId}`);

    const { searchParams } = new URL(request.url); // Added to get query params
    const fromDate = searchParams.get('fromDate'); // Added
    const toDate = searchParams.get('toDate');     // Added

    const pool = await connectDB();
    let query = `
      SELECT 
        b.booking_id,
        b.seat_no,
        s.type AS seat_type,
        s.zone AS seat_zone, 
        b.booking_date,
        b.from_time,
        b.to_time,
        b.Date AS created_at
      FROM booking b
      JOIN Seats s ON b.seat_no = s.seat_no
      WHERE b.employee_id = @employeeId
    `;

    const requestPool = pool.request().input('employeeId', sql.VarChar, employeeId);

    if (fromDate) {
      query += ` AND b.booking_date >= @fromDate`;
      requestPool.input('fromDate', sql.Date, fromDate);
    }
    if (toDate) {
      query += ` AND b.booking_date <= @toDate`;
      requestPool.input('toDate', sql.Date, toDate);
    }

    const result = await requestPool.query(query);
    console.log('[/api/bookings/me] Query executed successfully');

    return NextResponse.json({ bookings: result.recordset });
  } catch (error) {
    console.error('[/api/bookings/me] Error executing query:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
