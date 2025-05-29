import { NextResponse } from "next/server";
import { connectDB, sql } from '@/lib/db';
import { addSession, removeSession } from '@/lib/session';

// In-memory session store (replace with proper session management in production)
const sessions = new Map();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    console.log('Login attempt for email:', email);
    
    const pool = await connectDB();
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Employees WHERE employee_email = @email');

    console.log('Query result:', result.recordset);

    if (result.recordset.length === 0) {
      console.log('No employee found with email:', email);
      return NextResponse.json({ error: 'Invalid email' }, { status: 401 });
    }

    const employee = result.recordset[0];
    const sessionId = Math.random().toString(36).slice(2);

    // Add session to database
    await addSession(sessionId, {
      employeeId: employee.employee_id,
      employeeName: employee.employee_name,
      employeeEmail: employee.employee_email
    });

    console.log('Session created successfully');
    return NextResponse.json({ employee, sessionId });
  } catch (error) {
    console.error('Login failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Login failed', details: errorMessage }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 401 });
    }

    const pool = await connectDB();
    const result = await pool.request()
      .input('sessionId', sql.VarChar, sessionId)
      .query(`
        SELECT e.* 
        FROM Employees e
        JOIN Sessions s ON e.employee_id = s.employee_id
        WHERE s.session_id = @sessionId
        AND s.expires_at > GETDATE()
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    return NextResponse.json({ employee: result.recordset[0] });
  } catch (error) {
    console.error('Auth check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Authentication failed', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionId = request.headers.get('x-session-id');
    if (!sessionId) {
      return NextResponse.json({ error: 'No session ID provided' }, { status: 401 });
    }

    await removeSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Logout failed', details: errorMessage }, { status: 500 });
  }
} 