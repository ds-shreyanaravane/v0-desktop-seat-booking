import { connectDB, sql } from '../lib/db';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Helper function to read Excel file
async function readEmployeeExcel(filePath: string) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found at path: ${filePath}`);
    }

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const employees = XLSX.utils.sheet_to_json(worksheet);

    // Validate required columns
    const requiredColumns = ['employee_id', 'employee_name', 'employee_email', 'department'];
    const firstRow = employees[0] as any;
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Transform and validate data
    return employees.map((emp: any) => {
      // Validate UUID format (36 characters with hyphens)
      const id = String(emp.employee_id).trim();
      if (id.length !== 36 || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        throw new Error(`Invalid UUID format for employee: ${emp.employee_name}. Expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
      }

      // Validate email format
      const email = String(emp.employee_email).trim();
      if (!email.includes('@')) {
        throw new Error(`Invalid email format for employee: ${emp.employee_name}`);
      }

      return {
        id,
        name: String(emp.employee_name).trim(),
        email,
        department: String(emp.department).trim()
      };
    });
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

async function importEmployees() {
  try {
    const pool = await connectDB();
    console.log('Connected to MSSQL');

    // Get Excel file path from command line argument or use default
    const excelPath = process.argv[2] || 'C:/Users/shreya.naravane/Desktop/employees.xlsx';
    console.log(`Reading employee data from: ${excelPath}`);

    // Read employee data from Excel
    const employees = await readEmployeeExcel(excelPath);
    console.log(`Found ${employees.length} employees in Excel file`);

    // Check if Employees table exists, if not create it
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Employees')
      CREATE TABLE Employees (
        employee_id VARCHAR(36) PRIMARY KEY,
        employee_name VARCHAR(100) NOT NULL,
        employee_email VARCHAR(100) NOT NULL UNIQUE,
        department VARCHAR(50) NOT NULL
      )
    `);

    // Import employees
    let successCount = 0;
    let errorCount = 0;

    for (const emp of employees) {
      try {
        // Check if employee already exists
        const existingEmployee = await pool.request()
          .input('email', sql.VarChar(100), emp.email)
          .query('SELECT employee_id FROM Employees WHERE employee_email = @email');

        if (existingEmployee.recordset.length > 0) {
          // Update existing employee
          await pool.request()
            .input('id', sql.VarChar(36), emp.id)
            .input('name', sql.VarChar(100), emp.name)
            .input('email', sql.VarChar(100), emp.email)
            .input('dept', sql.VarChar(50), emp.department)
            .query(`
              UPDATE Employees 
              SET employee_name = @name,
                  department = @dept,
                  employee_id = @id
              WHERE employee_email = @email
            `);
          console.log(`Updated employee: ${emp.name}`);
        } else {
          // Insert new employee
          await pool.request()
            .input('id', sql.VarChar(36), emp.id)
            .input('name', sql.VarChar(100), emp.name)
            .input('email', sql.VarChar(100), emp.email)
            .input('dept', sql.VarChar(50), emp.department)
            .query(`
              INSERT INTO Employees (employee_id, employee_name, employee_email, department)
              VALUES (@id, @name, @email, @dept)
            `);
          console.log(`Imported new employee: ${emp.name}`);
        }
        successCount++;
      } catch (error) {
        console.error(`Error processing employee ${emp.name}:`, error);
        errorCount++;
      }
    }

    console.log('\nImport Summary:');
    console.log(`Total employees processed: ${employees.length}`);
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Errors encountered: ${errorCount}`);

  } catch (error) {
    console.error('Error importing employees:', error);
  } finally {
    process.exit();
  }
}

// Run the import
importEmployees(); 