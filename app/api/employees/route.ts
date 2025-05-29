import { NextResponse } from 'next/server';
import { connectDB, sql } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const pool = await connectDB();
    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(`
        SELECT TOP 10 employee_id, employee_name
        FROM Employees
        WHERE employee_name LIKE @search
        ORDER BY employee_name
      `);
    return NextResponse.json({ employees: result.recordset });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
} 