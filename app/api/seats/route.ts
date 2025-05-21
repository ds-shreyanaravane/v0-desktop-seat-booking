import { NextResponse } from 'next/server';
import { connectDB, sql } from '@/lib/db';
import { format as formatDateFns } from 'date-fns';
import Image from 'next/image';

// Mock data - replace with database in production
let seats: any[] = [];

// Initialize seats with mock data
/*function initializeSeats() {
  const mockSeats: any[] = [];
  const angle = 20;
  const adjustForAngle = (x: number, y: number, rowIndex: number, colIndex: number) => {
    const angleOffset = rowIndex * Math.tan((angle * Math.PI) / 180) * 10;
    return {
      x: x + angleOffset + colIndex * 5,
      y: y,
    };
  };

  const tenderStartX = 245;
  const tenderStartY = 285;
  const rowSpacing = 40;
  const colSpacing = 45;
  const tenderRows = [
    [
      { id: "TC-101", status: "available" },
      { id: "TC-102", status: "available" },
      { id: "TC-103", status: "booked" },
      { id: "TC-104", status: "available" },
    ],
    // Add more rows as needed
  ];

  tenderRows.forEach((row, rowIndex) => {
    row.forEach((seat, colIndex) => {
      const { x, y } = adjustForAngle(
        tenderStartX + colIndex * colSpacing,
        tenderStartY + rowIndex * rowSpacing,
        rowIndex,
        colIndex,
      );
      mockSeats.push({
        id: seat.id,
        x,
        y,
        width: 40,
        height: 25,
        status: seat.status,
        type: "standard",
        zone: "tender",
        angle: angle,
      });
    });
  });

  seats = mockSeats;
}

// Initialize seats on first load
if (seats.length === 0) {
  initializeSeats();
}*/

// Helper function to calculate seat positions
type ZoneConfig = {
  startX: number;
  startY: number;
  rowSpacing: number;
  colSpacing: number;
  angle: number;
  seatsPerRow: number;
};

type ZoneConfigs = {
  [key: string]: ZoneConfig;
};

function calculateSeatPosition(seat: any, zone: string) {
  const baseConfig: ZoneConfigs = {
    tender: {
      startX: 245,
      startY: 285,
      rowSpacing: 60,
      colSpacing: 70,
      angle: 0,
      seatsPerRow: 4
    },
    cubical: {
      startX: 500,
      startY: 285,
      rowSpacing: 60,
      colSpacing: 70,
      angle: 0,
      seatsPerRow: 4
    }
  };

  const config = baseConfig[zone] || baseConfig.tender;
  
  // Calculate row and column indices
  const rowIndex = Math.floor((seat.seat_no - 1) / config.seatsPerRow);
  const colIndex = (seat.seat_no - 1) % config.seatsPerRow;
  
  // Return calculated position with increased seat size
  return {
    x: config.startX + colIndex * config.colSpacing,
    y: config.startY + rowIndex * config.rowSpacing,
    width: 60,     // Increased from 40
    height: 40,    // Increased from 25
    angle: config.angle
  };
}

// Helper functions (can be moved to a utility file if used elsewhere)
const pad = (n: string | number): string => n.toString().padStart(2, "0");

// Removed formatTimeToSQLTime7 as we'll use VARCHAR(8) and send HH:mm:ss directly

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // const zone = searchParams.get('zone'); Removed
    const seatType = searchParams.get('seatType');
    const searchQuery = searchParams.get('searchQuery');
    const filterBookingDateStr = searchParams.get('bookingDate'); // YYYY-MM-DD from client
    const filterFromTime = searchParams.get('fromTime');     // HH:mm:ss from client
    const filterToTime = searchParams.get('toTime');         // HH:mm:ss from client
    const requestingEmployeeId = searchParams.get('requestingEmployeeId'); // Added

    const pool = await connectDB();

    // Determine the date to filter bookings against
    // If filterBookingDateStr is provided, use that, otherwise default to today for general availability status.
    // For actual time-slot based availability, filterBookingDateStr, filterFromTime, and filterToTime must be present.
    const bookingDateForQuery = filterBookingDateStr ? filterBookingDateStr : formatDateFns(new Date(), 'yyyy-MM-dd');

    let query = `
      SELECT 
        s.seat_no,
        s.wing_no,
        s.floor_no,
        s.is_cubic,
        s.x,
        s.y,
        s.width,
        s.height,
        s.type,
        s.zone,
        s.status AS base_status,
        b.employee_id AS current_booking_employee_id,
        e.employee_name AS current_booked_by,
        b.from_time AS current_booking_from_time,
        b.to_time AS current_booking_to_time
      FROM Seats s
      LEFT JOIN booking b ON s.seat_no = b.seat_no AND b.booking_date = @bookingDateForQuery
      LEFT JOIN Employees e ON b.employee_id = e.employee_id
      WHERE 1=1
    `;

    // if (zone) query += ` AND s.zone = @zone`; Removed
    if (seatType) query += ` AND s.type = @seatType`;
    if (searchQuery) query += ` AND CAST(s.seat_no AS VARCHAR) LIKE @searchQuery`;

    // If time filters are applied, we need to determine if the seat is available FOR THAT SLOT.
    // This is a more complex check.
    if (filterBookingDateStr && filterFromTime && filterToTime) {
      query += `
        AND NOT EXISTS (
          SELECT 1 FROM booking conflicting_b
          WHERE conflicting_b.seat_no = s.seat_no
          AND conflicting_b.booking_date = @filterBookingDateStr
          AND (
            (CAST(conflicting_b.from_time AS TIME) < CAST(@filterToTime AS TIME) AND CAST(conflicting_b.to_time AS TIME) > CAST(@filterFromTime AS TIME))
          )
        )
      `;
    }
    
    const requestPool = pool.request()
      .input('bookingDateForQuery', sql.Date, bookingDateForQuery)
      // .input('zone', sql.VarChar, zone) Removed
      .input('seatType', sql.VarChar, seatType)
      .input('searchQuery', sql.VarChar, searchQuery ? `%${searchQuery}%` : null)
      .input('requestingEmployeeId', sql.VarChar, requestingEmployeeId); // Added

    if (filterBookingDateStr && filterFromTime && filterToTime) {
      requestPool.input('filterBookingDateStr', sql.Date, filterBookingDateStr);
      requestPool.input('filterFromTime', sql.VarChar, filterFromTime);
      requestPool.input('filterToTime', sql.VarChar, filterToTime);
    }

    const result = await requestPool.query(query);

    const seats = result.recordset.map((seat: any) => {
      let effectiveStatus = seat.base_status || 'available';

      // For special objects, always return them with their base status
      if (seat.type && !['standard', 'cubic', 'meeting'].includes(seat.type)) {
        return {
          id: `SPECIAL-${seat.type}-${seat.seat_no}`,
          seat_no: seat.seat_no,
          x: seat.x,
          y: seat.y,
          width: seat.width,
          height: seat.height,
          status: seat.base_status || 'available',
          type: seat.type,
          zone: seat.zone || 'main',
          wing_no: seat.wing_no,
          floor_no: seat.floor_no,
          is_cubic: seat.is_cubic
        };
      }

      if (filterBookingDateStr && filterFromTime && filterToTime) {
        // If time filters are applied, seats passing the NOT EXISTS clause are available for the slot.
        if (seat.base_status === 'reserved' || seat.base_status === 'blocked') {
          effectiveStatus = seat.base_status; // Keep reserved/blocked status
        } else {
          effectiveStatus = 'available'; // Default for seats available in the slot

          if (seat.current_booking_employee_id) {
            const bookingFrom = seat.current_booking_from_time;
            const bookingTo = seat.current_booking_to_time;
            // Check if this specific user's booking on this day overlaps with the filtered time slot
            if (bookingFrom && bookingTo && filterFromTime && filterToTime) {
              // Standard overlap check: (StartA < EndB) and (EndA > StartB)
              if (bookingFrom < filterToTime && bookingTo > filterFromTime) {
                const now = new Date();
                const bookingDate = new Date(filterBookingDateStr);
                const isToday = bookingDate.toDateString() === now.toDateString();
                
                if (isToday) {
                  // For today's bookings, check current time against booking time
                  const currentTime = now.toTimeString().slice(0, 8); // Get current time in HH:mm:ss format
                  if (currentTime < bookingFrom) {
                    // If current time is before booking start time, show as available
                    effectiveStatus = 'available';
                  } else if (String(seat.current_booking_employee_id) === requestingEmployeeId) {
                    effectiveStatus = 'yours';
                  } else {
                    effectiveStatus = 'booked';
                  }
                } else if (bookingDate > now) {
                  // If booking date is in the future, always show as available
                  effectiveStatus = 'available';
                } else if (String(seat.current_booking_employee_id) === requestingEmployeeId) {
                  effectiveStatus = 'yours';
                } else {
                  effectiveStatus = 'booked';
                }
              }
            }
          }
        }
      } else {
        // No specific time slot filter, check general booking for the day
        if (seat.base_status === 'reserved' || seat.base_status === 'blocked') {
          effectiveStatus = seat.base_status; // Keep reserved/blocked status
        } else if (seat.current_booking_employee_id) {
          const now = new Date();
          const bookingDate = new Date(bookingDateForQuery);
          const isToday = bookingDate.toDateString() === now.toDateString();
          
          if (isToday && seat.current_booking_from_time) {
            // For today's bookings, check current time against booking time
            const currentTime = now.toTimeString().slice(0, 8); // Get current time in HH:mm:ss format
            if (currentTime < seat.current_booking_from_time) {
              // If current time is before booking start time, show as available
              effectiveStatus = 'available';
            } else if (String(seat.current_booking_employee_id) === requestingEmployeeId) {
              effectiveStatus = 'yours';
            } else {
              effectiveStatus = 'booked';
            }
          } else if (bookingDate > now) {
            // If booking date is in the future, always show as available
            effectiveStatus = 'available';
          } else if (String(seat.current_booking_employee_id) === requestingEmployeeId) {
            effectiveStatus = 'yours';
          } else {
            effectiveStatus = 'booked';
          }
        } else {
          // No booking on this day, status is from the Seats table
          effectiveStatus = seat.base_status || 'available';
        }
      }

      let seatTypeDisplay = seat.type || 'standard'; // Default from DB type column
      if (seat.is_cubic === true || seat.is_cubic === 1) {
        seatTypeDisplay = 'cubic';
      } else if (seat.type === 'meeting') { // Assuming 'meeting' is a value in seat.type column
        seatTypeDisplay = 'meeting';
      }
      // Other types like 'pillar', 'xerox' etc., if they are in seat.type, will be handled by FloorPlan

      return {
        id: `SEAT-${seat.seat_no}`,
        x: seat.x,
        y: seat.y,
        width: seat.width,
        height: seat.height,
        status: effectiveStatus,
        type: seatTypeDisplay, // Use the determined type
        zone: seat.zone || 'tender',
        bookedBy: seat.current_booked_by, 
        fromTime: seat.current_booking_from_time, 
        toTime: seat.current_booking_to_time,     
        bookingDate: filterBookingDateStr, 
        seat_no: seat.seat_no,
        wing_no: seat.wing_no,
        floor_no: seat.floor_no,
        is_cubic: seat.is_cubic // Keep original is_cubic for any other logic if needed
      };
    });

    const stats = {
      total: result.recordset.length, // Total seats matching criteria (potentially available for slot)
      available: seats.filter((s: any) => s.status === 'available').length,
      booked: seats.filter((s: any) => s.status === 'booked').length, // This might be less relevant if filtering for a slot
      yours: 0 
    };

    return NextResponse.json({ seats, stats });
  } catch (error) {
    console.error('Error fetching seats:', error);
    return NextResponse.json({ error: 'Failed to fetch seats' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Backend received full request body for VARCHAR change:', JSON.stringify(body, null, 2));

    let { seatId, employeeId, fromTime, toTime, bookingDate } = body;

    fromTime = String(fromTime); // Expected HH:mm:ss
    toTime = String(toTime);     // Expected HH:mm:ss
    bookingDate = String(bookingDate); // Expected YYYY-MM-DD

    console.log(
      'Backend using for VARCHAR - fromTime:', fromTime, '(type:', typeof fromTime, '),',
      'toTime:', toTime, '(type:', typeof toTime, '),',
      'bookingDate:', bookingDate, '(type:', typeof bookingDate, ')'
    );

    // --- VALIDATION CHECKS ---
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to midnight for date comparison

    const requestedBookingDate = new Date(bookingDate + 'T00:00:00');

    // 1. Date >= Today's Date
    if (requestedBookingDate < today) {
      return NextResponse.json({ error: 'Booking date cannot be in the past.' }, { status: 400 });
    }

    // 2. From Time <= To Time
    if (fromTime >= toTime) {
      return NextResponse.json({ error: '"From time" must be earlier than "To time".' }, { status: 400 });
    }

    // 3. From Time >= Current Time (if booking for today)
    if (requestedBookingDate.getTime() === today.getTime()) {
      const now = new Date();
      const currentTimeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      if (fromTime < currentTimeString) {
        return NextResponse.json({ error: 'Booking time cannot be in the past for today.' }, { status: 400 });
      }
    }
    // --- END VALIDATION CHECKS ---

    const pool = await connectDB();

    // Get seat info and check type
    const seatResult = await pool.request()
      .input('seatId', sql.Int, seatId)
      .query('SELECT * FROM Seats WHERE seat_no = @seatId');
    if (!seatResult.recordset.length) {
      return NextResponse.json({ error: 'Seat not found' }, { status: 404 });
    }
    const seat = seatResult.recordset[0];
    const bookableSeatTypes = ['standard', 'meeting', 'cubic'];
    if (!bookableSeatTypes.includes(seat.type) || seat.status !== 'available') {
      return NextResponse.json({ error: 'Only available standard, meeting, or cubic seats can be booked' }, { status: 400 });
    }

    // Check if seat is already booked for the time slot
    const checkResult = await pool.request()
      .input('seatId', sql.Int, seatId)
      .input('bookingDate', sql.Date, bookingDate)
      .input('fromTime', sql.VarChar, fromTime)
      .input('toTime', sql.VarChar, toTime)
      .query(`
        SELECT b.*, e.employee_name 
        FROM booking b
        LEFT JOIN Employees e ON b.employee_id = e.employee_id
        WHERE b.seat_no = @seatId 
        AND b.booking_date = @bookingDate
        AND (
          (CAST(b.from_time AS TIME) <= CAST(@fromTime AS TIME) AND CAST(b.to_time AS TIME) > CAST(@fromTime AS TIME))
          OR (CAST(b.from_time AS TIME) < CAST(@toTime AS TIME) AND CAST(b.to_time AS TIME) >= CAST(@toTime AS TIME))
          OR (CAST(b.from_time AS TIME) >= CAST(@fromTime AS TIME) AND CAST(b.to_time AS TIME) <= CAST(@toTime AS TIME))
        )
      `);

    if (checkResult.recordset.length > 0) {
      const conflictingBooking = checkResult.recordset[0];
      const errorMessage = `Seat is already booked by ${conflictingBooking.employee_name} for this time slot (${conflictingBooking.from_time} - ${conflictingBooking.to_time})`;
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Create booking
    await pool.request()
      .input('seatId', sql.Int, seatId)
      .input('employeeId', sql.VarChar, employeeId)
      .input('fromTime', sql.VarChar, fromTime)
      .input('toTime', sql.VarChar, toTime)
      .input('bookingDate', sql.Date, bookingDate)
      .query(`
        INSERT INTO booking (seat_no, employee_id, from_time, to_time, booking_date, Date)
        VALUES (@seatId, @employeeId, @fromTime, @toTime, @bookingDate, @bookingDate)
      `);

    // Update seat status only if booking is for today
    const now = new Date();
    const bookingDateObj = new Date(bookingDate);
    const isToday = bookingDateObj.toDateString() === now.toDateString();
    
    if (isToday) {
      const currentTime = now.toTimeString().slice(0, 8);
      if (currentTime >= fromTime) {
        // Only set is_booked to 1 if the booking is for today and current time is after booking start time
        await pool.request()
          .input('seatId', sql.Int, seatId)
          .query("UPDATE Seats SET is_booked = 1, status = 'booked' WHERE seat_no = @seatId");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating booking:', error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return NextResponse.json({ error: errorMessage || 'Failed to create booking' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const seatNo = searchParams.get('seatNo');

    const pool = await connectDB();
    
    // Get booking details before deleting
    const bookingResult = await pool.request()
      .input('bookingId', sql.Int, bookingId)
      .query('SELECT booking_date, from_time FROM booking WHERE booking_id = @bookingId');
    
    if (bookingResult.recordset.length > 0) {
      const booking = bookingResult.recordset[0];
      const now = new Date();
      const bookingDate = new Date(booking.booking_date);
      const isToday = bookingDate.toDateString() === now.toDateString();
      
      // Delete the booking
      await pool.request()
        .input('bookingId', sql.Int, bookingId)
        .query('DELETE FROM booking WHERE booking_id = @bookingId');

      if (seatNo) {
        if (isToday) {
          const currentTime = now.toTimeString().slice(0, 8);
          if (currentTime >= booking.from_time) {
            // Only update seat status if the booking was for today and current time is after booking start time
            await pool.request()
              .input('seatNo', sql.Int, seatNo)
              .query("UPDATE Seats SET is_booked = 0, status = 'available' WHERE seat_no = @seatNo");
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}

/*export async function GET() {
  const [rows] = await db.query('SELECT * FROM Seats');
  return NextResponse.json(rows);
}*/

// Dummy data array (in-memory, resets on server restart)
/*let seats = [
  { seat_no: 1, is_booked: false, wing_no: 1, floor_no: 1, partner_id: 101, is_cubic: false },
  { seat_no: 2, is_booked: true, wing_no: 1, floor_no: 1, partner_id: 102, is_cubic: true },
  { seat_no: 3, is_booked: false, wing_no: 2, floor_no: 1, partner_id: 103, is_cubic: false },
  // ...add more dummy seats as needed
];*/

/*function ChairIcon({ color = "#43a047", size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="6" y="10" width="12" height="6" rx="2" fill={color} />
      <rect x="7" y="4" width="10" height="7" rx="2" fill={color} />
      <rect x="6" y="17" width="2" height="4" rx="1" fill={color} />
      <rect x="16" y="17" width="2" height="4" rx="1" fill={color} />
    </svg>
  );
}*/

const formatTime = (t: string) => {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length === 2) { // HH:mm or H:mm
    const [h, m] = parts;
    return `${pad(h)}:${pad(m)}:00`; // Appends :00 for seconds
  } else if (parts.length === 3) { // HH:mm:ss or H:mm:ss
    const [h, m, s] = parts;
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  } else {
    return t; // Fallback, ideally shouldn't be hit with valid time input
  }
};