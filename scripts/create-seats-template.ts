import * as XLSX from 'xlsx';
import path from 'path';

// Sample seat data
const seats = [
  {
    seat_no: 1,
    is_booked: 0,
    wing_no: 'A',
    floor_no: 4,
    is_cubic: 0,
    x: 245,
    y: 285,
    width: 40,
    height: 25,
    type: 'standard',
    zone: 'tender',
    angle: 20,
    status: 'available'
  },
  {
    seat_no: 2,
    is_booked: 0,
    wing_no: 'A',
    floor_no: 4,
    is_cubic: 0,
    x: 290,
    y: 285,
    width: 40,
    height: 25,
    type: 'standard',
    zone: 'tender',
    angle: 20,
    status: 'available'
  },
  {
    seat_no: 3,
    is_booked: 1,
    wing_no: 'A',
    floor_no: 4,
    is_cubic: 0,
    x: 335,
    y: 285,
    width: 40,
    height: 25,
    type: 'standard',
    zone: 'tender',
    angle: 20,
    status: 'booked'
  },
  {
    seat_no: 4,
    is_booked: 0,
    wing_no: 'A',
    floor_no: 4,
    is_cubic: 1,
    x: 380,
    y: 285,
    width: 40,
    height: 25,
    type: 'cubic',
    zone: 'wing',
    angle: 0,
    status: 'available'
  },
  {
    seat_no: 5,
    is_booked: 0,
    wing_no: 'B',
    floor_no: 4,
    is_cubic: 0,
    x: 425,
    y: 285,
    width: 40,
    height: 25,
    type: 'standard',
    zone: 'wing',
    angle: -20,
    status: 'available'
  }
];

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Convert data to worksheet
const worksheet = XLSX.utils.json_to_sheet(seats);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Seats');

// Write to file
const filePath = path.join(__dirname, '../data/seats.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`Excel file created at: ${filePath}`); 