const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// CONFIG
const inputFile = 'seats1.xlsx';
const outputFile = 'seats_output.xlsx';
const cellWidth = 70; // Adjust as needed
const cellHeight = 60; // Adjust as needed

// Set these to the exact pixel position of seat 1 in your image!
const seat1_x = 1500; // <-- SET THIS
const seat1_y = 40;   // <-- SET THIS

// Special objects and their grid sizes
const specialSizes = {
  'PILLAR': { w: 2, h: 2 },
  'XEROX MACHINE': { w: 3, h: 1 },
  'CRECHE ROOM': { w: 4, h: 4 },
  'GENTS VC': { w: 1, h: 2 },
  'HANDICAP VC': { w: 1, h: 2 },
  'LADIES VC': { w: 1, h: 2 },
  'PANTRY': { w: 1, h: 2 },
  'P1': { w: 2, h: 2 },
  'P2': { w: 2, h: 2 }
};

const specialTypes = {
  'PILLAR': 'pillar',
  'XEROX MACHINE': 'xerox',
  'CRECHE ROOM': 'creche_room',
  'GENTS VC': 'gents_vc',
  'HANDICAP VC': 'handicap_vc',
  'LADIES VC': 'ladies_vc',
  'PANTRY': 'pantry',
  'P1': 'parking',
  'P2': 'parking'
};

// Read Excel
const workbook = XLSX.readFile(inputFile);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

// Find the origin (seat 1)
let originRow = -1, originCol = -1;
for (let r = 0; r < rows.length; r++) {
  for (let c = 0; c < rows[r].length; c++) {
    if (rows[r][c] && rows[r][c].toString().trim() === '1') {
      originRow = r;
      originCol = c;
      break;
    }
  }
  if (originRow !== -1) break;
}
if (originRow === -1) {
  console.error('Seat 1 not found!');
  process.exit(1);
}

// --- BEGIN CUSTOM LAYOUT ---
const seatWidth = 40;
const seatHeight = 60;
const gap = 70;
const slantOffset = 0;
const x0 = 1100; // top-right seat
const y0 = 40;

const seatRows = [
  8,  // row 1 (top, rightmost)
  9,  // row 2
  10, // row 3
  10, // row 4
  9,  // row 5
  8,  // row 6
  6   // row 7 (bottom)
];

let seatNo = 1;
const seats = [];
for (let row = 0; row < seatRows.length; row++) {
  for (let col = 0; col < seatRows[row]; col++) {
    const x = x0 - col * (seatWidth + gap) - row * slantOffset;
    const y = y0 + row * (seatHeight + gap);
    seats.push({
      seat_no: seatNo,
      x,
      y,
      width: seatWidth,
      height: seatHeight,
      type: 'standard',
      zone: 'main',
      is_cubic: false,
      wing_no: 1,
      floor_no: 1,
      status: 'available'
    });
    seatNo++;
  }
}

const specialObjects = [
  { id: 'cabin-1', type: 'cabin', x: 100, y: 40, width: 80, height: 30, label: 'CABIN' },
  { id: 'cubical-1', type: 'cubical', x: 200, y: 40, width: 80, height: 30, label: 'CUBICAL' },
  { id: 'design-center', type: 'design_center', x: 100, y: 400, width: 120, height: 30, label: 'DESIGN CENTER' },
  { id: 'staircase-1', type: 'staircase', x: 300, y: 500, width: 100, height: 30, label: 'STAIRCASE' },
  { id: 'gents-toilet', type: 'gents_toilet', x: 500, y: 200, width: 80, height: 30, label: "GENTS TOILET" },
  { id: 'ladies-toilet', type: 'ladies_toilet', x: 600, y: 200, width: 80, height: 30, label: "LADIES TOILET" },
  { id: 'pantry-area', type: 'pantry_area', x: 700, y: 300, width: 100, height: 30, label: 'PANTRY AREA' },
  { id: 'unit-label', type: 'label', x: 500, y: 300, width: 200, height: 40, label: 'UNIT NO. 4A STATION' },
  // ...add more special objects as needed, matching screenshot
];

const output = [...seats, ...specialObjects];
// --- END CUSTOM LAYOUT ---

// Write to Excel
const ws = XLSX.utils.json_to_sheet(output);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Seats');
XLSX.writeFile(wb, outputFile);

console.log('Output written to', outputFile);

// Write to CSV (seats only)
const csvWriter = createCsvWriter({
  path: 'seats.csv',
  header: [
    { id: 'seat_no', title: 'seat_no' },
    { id: 'zone', title: 'zone' },
    { id: 'x', title: 'x' },
    { id: 'y', title: 'y' },
    { id: 'width', title: 'width' },
    { id: 'height', title: 'height' },
    { id: 'is_cubic', title: 'is_cubic' },
    { id: 'wing_no', title: 'wing_no' },
    { id: 'floor_no', title: 'floor_no' },
    { id: 'type', title: 'type' },
    { id: 'status', title: 'status' },
    { id: 'label', title: 'label' },
  ]
});

csvWriter.writeRecords(output)
  .then(() => {
    console.log('Seats CSV file generated!');
  }); 