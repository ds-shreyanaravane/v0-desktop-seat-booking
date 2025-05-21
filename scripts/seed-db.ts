import { connectDB, sql } from '../lib/db';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createDatabaseSchema() {
  try {
    const pool = await connectDB();
    console.log('Connected to MSSQL');

    // Drop foreign key constraints
    await pool.request().query(`
      DECLARE @sql NVARCHAR(MAX) = '';
      SELECT @sql += 'ALTER TABLE ' + QUOTENAME(OBJECT_SCHEMA_NAME(parent_object_id))
        + '.' + QUOTENAME(OBJECT_NAME(parent_object_id)) 
        + ' DROP CONSTRAINT ' + QUOTENAME(name) + ';'
      FROM sys.foreign_keys
      WHERE referenced_object_id = OBJECT_ID('Employees');
      EXEC sp_executesql @sql;
    `);

    // Drop existing tables
    await pool.request().query('DROP TABLE IF EXISTS booking');
    await pool.request().query('DROP TABLE IF EXISTS Employees');
    await pool.request().query('DROP TABLE IF EXISTS Seats');
    await pool.request().query('DROP TABLE IF EXISTS Sessions');

    // Create Employees table
    await pool.request().query(`
      CREATE TABLE Employees (
        employee_id VARCHAR(36) PRIMARY KEY,
        employee_name VARCHAR(100) NOT NULL,
        employee_email VARCHAR(100) NOT NULL UNIQUE,
        department VARCHAR(50) NOT NULL
      )
    `);

    // Create Sessions table with matching employee_id length
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sessions')
      CREATE TABLE Sessions (
        session_id VARCHAR(100) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES Employees(employee_id)
      )
    `);

    // Create Seats table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Seats')
      CREATE TABLE Seats (
        seat_no INT NOT NULL PRIMARY KEY,
        is_booked BIT NOT NULL,
        wing_no CHAR(1) DEFAULT 'A' NOT NULL,
        floor_no INT DEFAULT 4 NOT NULL,
        is_cubic BIT NOT NULL,
        x INT,
        y INT,
        width INT,
        height INT,
        type VARCHAR(50),
        zone VARCHAR(50),
        angle INT,
        status VARCHAR(20),
        label VARCHAR(100)
      )
    `);

    // Create booking table with matching employee_id length
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'booking')
      CREATE TABLE booking (
        booking_id INT IDENTITY(1,1) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        booking_date DATE NOT NULL,
        booking_time TIMESTAMP NOT NULL,
        from_time TIME NOT NULL,
        to_time TIME NOT NULL,
        total_hours_of_booking AS CAST(DATEDIFF(MINUTE, from_time, to_time) AS FLOAT) / 60.0 PERSISTED,
        seat_no INT NOT NULL,
        Date DATE NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES Employees(employee_id),
        FOREIGN KEY (seat_no) REFERENCES Seats(seat_no)
      )
    `);

    console.log('Database schema created successfully!');
  } catch (error) {
    console.error('Error creating database schema:', error);
  } finally {
    process.exit();
  }
}

// Run the schema creation
createDatabaseSchema(); 