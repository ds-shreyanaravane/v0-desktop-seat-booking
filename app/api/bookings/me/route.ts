import { NextResponse } from 'next/server';
import { connectDB, sql } from '@/lib/db';
import { verifySession, addSession, removeSession } from '@/lib/session'; // Assuming you have a session verification utility

export async function GET(request: Request) {
  try {
    const session = await verifySession();
    console.log('[/api/bookings/me] Session details received:', session);

    if (!session || !session.employeeId) {
      console.error('[/api/bookings/me] Unauthorized access attempt or missing employeeId in session.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[/api/bookings/me] Fetching bookings for employeeId: ${session.employeeId}`);

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

    const requestPool = pool.request().input('employeeId', sql.VarChar, session.employeeId);

    if (fromDate) {
      query += ` AND b.booking_date >= @fromDate`;
      requestPool.input('fromDate', sql.Date, fromDate);
    }
    if (toDate) {
      query += ` AND b.booking_date <= @toDate`;
      requestPool.input('toDate', sql.Date, toDate);
    }

    query += ` ORDER BY b.booking_date DESC, b.from_time DESC;`;
    
    console.log('[/api/bookings/me] Executing query:', query);
    // For more detailed debugging, you might log parameters separately if your DB driver supports it clearly

    const result = await requestPool.query(query);

    console.log(`[/api/bookings/me] Raw bookings count from DB: ${result.recordset.length}`);
    if (result.recordset.length > 0) {
      console.log('[/api/bookings/me] First raw booking:', result.recordset[0]);
    }

    const bookings = result.recordset.map(booking => ({
      ...booking,
      booking_date: booking.booking_date ? new Date(booking.booking_date).toISOString().split('T')[0] : null, // Format to YYYY-MM-DD
    }));

    return NextResponse.json({ bookings });

  } catch (error) {
    console.error('Error fetching user bookings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bookings';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 