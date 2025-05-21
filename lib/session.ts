import { headers } from 'next/headers';
import { connectDB, sql } from '@/lib/db';

// This is a placeholder for your actual session store or validation logic.
// You'll need to integrate this with how your /api/auth route manages sessions.
export const MOCK_SESSION_DB = new Map<string, { employeeId: string; employeeName?: string; employeeEmail?: string; [key: string]: any }>();

// Example of how /api/auth/route.ts would use it:
// import { MOCK_SESSION_DB } from '@/lib/session';
// On login: MOCK_SESSION_DB.set(newSessionId, { employeeId: user.employee_id, employeeName: user.employee_name });
// On logout: MOCK_SESSION_DB.delete(sessionIdFromHeader);

export async function verifySession() {
  const H = headers();
  const sessionId = H.get('x-session-id');
  console.log('[lib/session.ts] verifySession: Received x-session-id header value:', sessionId);

  if (!sessionId) {
    console.log('[lib/session.ts] verifySession: x-session-id header is missing or empty. Returning null.');
    return null;
  }

  try {
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

    if (result.recordset.length > 0) {
      const employee = result.recordset[0];
      console.log(`[lib/session.ts] verifySession: Session ID ${sessionId} FOUND in database for employee ${employee.employee_id}`);
      return {
        employeeId: employee.employee_id,
        employeeName: employee.employee_name,
        employeeEmail: employee.employee_email
      };
    } else {
      console.warn(`[lib/session.ts] verifySession: Session ID ${sessionId} NOT FOUND in database or expired. Returning null.`);
      return null;
    }
  } catch (error) {
    console.error('[lib/session.ts] verifySession: Error verifying session:', error);
    return null;
  }
}

// Helper function to be used by /api/auth route for creating sessions
export async function addSession(sessionId: string, employeeData: { employeeId: string; employeeName?: string; employeeEmail?: string; }) {
  try {
    const pool = await connectDB();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

    await pool.request()
      .input('sessionId', sql.VarChar, sessionId)
      .input('employeeId', sql.VarChar, employeeData.employeeId)
      .input('expiresAt', sql.DateTime, expiresAt)
      .query(`
        INSERT INTO Sessions (session_id, employee_id, expires_at)
        VALUES (@sessionId, @employeeId, @expiresAt)
      `);
    
    console.log(`[lib/session.ts] addSession: Session ${sessionId} added for employee ${employeeData.employeeId}`);
  } catch (error) {
    console.error('[lib/session.ts] addSession: Error adding session:', error);
    throw error;
  }
}

// Helper function to be used by /api/auth route for deleting sessions
export async function removeSession(sessionId: string) {
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('sessionId', sql.VarChar, sessionId)
      .query('DELETE FROM Sessions WHERE session_id = @sessionId');
    
    const deleted = result.rowsAffected[0] > 0;
    if (deleted) {
      console.log(`[lib/session.ts] removeSession: Session ${sessionId} removed.`);
    } else {
      console.log(`[lib/session.ts] removeSession: Session ${sessionId} not found for removal.`);
    }
    return deleted;
  } catch (error) {
    console.error('[lib/session.ts] removeSession: Error removing session:', error);
    throw error;
  }
}

// You might also have functions here to create and destroy sessions if this lib manages them.
// export async function createSession(employeeId: string, employeeData: any) { ... }
// export async function deleteSession() { ... } 