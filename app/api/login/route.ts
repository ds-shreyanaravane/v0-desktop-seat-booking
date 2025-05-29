import { NextResponse } from 'next/server';
import { connectDB, sql } from '@/lib/db';
import Image from 'next/image';

export async function POST(request: Request) {
  try {
    const { employee_email } = await request.json();
    console.log('Attempting login for email:', employee_email);
    
    const pool = await connectDB();
    console.log('Database connection established');
    
    // First verify if the Employees table exists
    const tableCheck = await pool.request().query(`
      SELECT COUNT(*) as tableCount 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'Employees'
    `);
    
    if (tableCheck.recordset[0].tableCount === 0) {
      console.error('Employees table does not exist');
      return NextResponse.json({ 
        success: false, 
        message: 'Database configuration error' 
      }, { status: 500 });
    }

    // Query to get employee details with detailed logging
    console.log('Executing employee query...');
    const result = await pool.request()
      .input('employee_email', sql.VarChar, employee_email)
      .query(`
        SELECT 
          employee_id,
          employee_name,
          employee_email,
          employee_desig,
          employee_dept
        FROM Employees 
        WHERE employee_email = @employee_email
      `);

    console.log('Query result:', {
      recordCount: result.recordset.length,
      foundEmployee: result.recordset[0] || 'No employee found'
    });

    if (result.recordset.length > 0) {
      const employee = result.recordset[0];
      console.log('Login successful for:', employee.employee_name);
      return NextResponse.json({ 
        success: true, 
        employee: {
          employee_id: employee.employee_id,
          employee_name: employee.employee_name,
          employee_email: employee.employee_email,
          employee_desig: employee.employee_desig,
          employee_dept: employee.employee_dept
        }
      });
    } else {
      console.log('No employee found with email:', employee_email);
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid email' 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}