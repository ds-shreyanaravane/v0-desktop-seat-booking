import { NextResponse } from 'next/server';
import { connectDB, sql } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { booking_id: string } }) {
  try {
    const bookingId = params.booking_id;
    const { booking_date, from_time, to_time } = await request.json();

    const pool = await connectDB();
    // Update the booking in the database
    await pool.request()
      .input('bookingId', sql.Int, bookingId)
      .input('bookingDate', sql.Date, booking_date)
      .input('fromTime', sql.VarChar, from_time)
      .input('toTime', sql.VarChar, to_time)
      .query(`
        UPDATE booking
        SET booking_date = @bookingDate,
            from_time = @fromTime,
            to_time = @toTime
        WHERE booking_id = @bookingId
      `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
} 