import { NextResponse } from 'next/server';
import { connectDB, sql } from '@/lib/db';

export async function GET(request: Request, context: { params: { employee_id: string } }) {
  try {
    // Log the full request URL (FE string)
    console.log('FE Request URL:', request.url);
    const url = new URL(request.url);
    console.log('FE Query Params:', Object.fromEntries(url.searchParams.entries()));

    const employeeId = context.params.employee_id;
    console.log('Fetching booking for employee:', employeeId);
    
    const pool = await connectDB();
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log('Current date:', currentDate);

    // Log BE query and parameters
    const sqlQuery = `
      SELECT TOP 1 *
      FROM booking
      WHERE employee_id = @employeeId
      AND booking_date = @currentDate
    `;
    console.log('BE SQL Query:', sqlQuery);
    console.log('BE SQL Params:', { employeeId, currentDate });
    
    const result = await pool.request()
      .input('employeeId', sql.VarChar, employeeId)
      .input('currentDate', sql.Date, currentDate)
      .query(sqlQuery);
    
    console.log('Query result:', result.recordset);
    
    if (result.recordset.length === 0) {
      console.log('No current booking found for employee:', employeeId);
      return NextResponse.json({ booking: null });
    }
    
    return NextResponse.json({ booking: result.recordset[0] });
  } catch (error) {
    console.error('Error fetching employee booking:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch booking',
      details: error
    }, { status: 500 });
  }
} 