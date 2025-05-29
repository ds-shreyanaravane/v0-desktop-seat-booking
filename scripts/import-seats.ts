import { connectDB, sql } from '../lib/db';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Helper function to read Excel file
async function readSeatExcel(filePath: string) {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found at path: ${filePath}`);
    }

    // Read Excel file
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const seats = XLSX.utils.sheet_to_json(worksheet);

    // Transform data
    return seats.map((seat: any) => {
      // Handle special objects
      const isSpecialObject = !seat.seat_no && seat.type && seat.type !== 'standard' && seat.type !== 'cubic';
      
      const typeMap = {
        "PILLAR": "pillar",
        "XEROX MACHINE": "xerox",
        "CRECHE ROOM": "creche_room",
        "PANTRY": "pantry",
        "M": "gents_vc",
        "F": "ladies_vc",
        "H": "handicap_vc",
        "ENTRY_EXIT": "entry_exit",
        "OMEGA": "meeting_room",
        "ASTER": "meeting_room",
        "COSMOS": "meeting_room",
        "ARENA":"meeting_room",
        "STORE": "store",
        "HUB ROOM": "hub_room",
        // Add more as needed
      };

      return {
        seat_no: isSpecialObject ? 0 : Number(seat.seat_no), // Use 0 for special objects
        is_booked: Boolean(seat.is_booked),
        wing_no: String(seat.wing_no || 'A').trim(),
        floor_no: Number(seat.floor_no || 4),
        is_cubic: Boolean(seat.is_cubic),
        x: Number(seat.x || 0),
        y: Number(seat.y || 0),
        width: Number(seat.width || 40),
        height: Number(seat.height || 25),
        type: typeMap[String(seat.type).trim().toUpperCase()] || String(seat.type).trim().toLowerCase().replace(/ /g, '_'),
        zone: String(seat.zone || 'tender').trim(),
        angle: Number(seat.angle || 0),
        status: String(seat.status || 'available').trim(),
      };
    });
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

async function importSeats() {
  try {
    const pool = await connectDB();
    console.log('Connected to MSSQL');

    // Get Excel file path from command line argument or use default
    const excelPath = process.argv[2] || 'C:/Users/shreya.naravane/Desktop/seats.xlsx';
    console.log(`Reading seat data from: ${excelPath}`);

    // Read seat data from Excel
    const seats = await readSeatExcel(excelPath);
    console.log(`Found ${seats.length} seats in Excel file`);

    // Clear existing seats
    await pool.request().query('DELETE FROM Seats');
    console.log('Cleared existing seats');

    // Import seats
    let successCount = 0;
    let errorCount = 0;

    for (const seat of seats) {
      try {
        await pool.request()
          .input('seat_no', sql.Int, seat.seat_no)
          .input('is_booked', sql.Bit, seat.is_booked)
          .input('wing_no', sql.Char(1), seat.wing_no)
          .input('floor_no', sql.Int, seat.floor_no)
          .input('is_cubic', sql.Bit, seat.is_cubic)
          .input('x', sql.Int, seat.x)
          .input('y', sql.Int, seat.y)
          .input('width', sql.Int, seat.width)
          .input('height', sql.Int, seat.height)
          .input('type', sql.VarChar(50), seat.type)
          .input('zone', sql.VarChar(50), seat.zone)
          .input('angle', sql.Int, seat.angle)
          .input('status', sql.VarChar(20), seat.status)
          .query(`
            INSERT INTO Seats (seat_no, is_booked, wing_no, floor_no, is_cubic, x, y, width, height, type, zone, angle, status)
            VALUES (@seat_no, @is_booked, @wing_no, @floor_no, @is_cubic, @x, @y, @width, @height, @type, @zone, @angle, @status)
          `);
        console.log(`Imported seat: ${seat.seat_no}`);
        successCount++;
      } catch (error) {
        console.error(`Error processing seat ${seat.seat_no}:`, error);
        errorCount++;
      }
    }

    console.log('\nImport Summary:');
    console.log(`Total seats processed: ${seats.length}`);
    console.log(`Successfully processed: ${successCount}`);
    console.log(`Errors encountered: ${errorCount}`);

  } catch (error) {
    console.error('Error importing seats:', error);
  } finally {
    process.exit();
  }
}

// Run the import
importSeats(); 