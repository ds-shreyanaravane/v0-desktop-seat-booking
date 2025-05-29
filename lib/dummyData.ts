// lib/dummyData.ts

export const employees = [
    {
      employee_id: 1,
      employee_name: 'Alice',
      employee_desig: 'Developer',
      employee_partner_id: 101,
      employee_dept: 'Engineering',
      employee_email: 'alice@example.com',
    },
    {
      employee_id: 2,
      employee_name: 'Bob',
      employee_desig: 'Manager',
      employee_partner_id: 102,
      employee_dept: 'HR',
      employee_email: 'bob@example.com',
    },
  ];
  
  /*export const seats = [
    { seat_no: 1, is_booked: false, wing_no: 1, floor_no: 1, partner_id: 101, is_cubic: false },
    { seat_no: 2, is_booked: false, wing_no: 1, floor_no: 1, partner_id: 101, is_cubic: true },
    { seat_no: 3, is_booked: false, wing_no: 1, floor_no: 1, partner_id: 102, is_cubic: false },
  ];*/

// Floor plan mock seats (moved from page.tsx)
export const mockSeats = (() => {
  const mockSeats: any[] = [];
  const angle = 20;
  const adjustForAngle = (x: number, y: number, rowIndex: number, colIndex: number) => {
    const angleOffset = rowIndex * Math.tan((angle * Math.PI) / 180) * 10;
    return {
      x: x + angleOffset + colIndex * 5,
      y: y,
    };
  };
  const tenderStartX = 245;
  const tenderStartY = 285;
  const rowSpacing = 40;
  const colSpacing = 45;
  const tenderRows = [
    [
      { id: "TC-101", status: "available" },
      { id: "TC-102", status: "available" },
      { id: "TC-103", status: "booked" },
      { id: "TC-104", status: "blocked" },
    ],
    [
      { id: "TC-105", status: "available" },
      { id: "TC-106", status: "blocked" },
      { id: "TC-107", status: "available" },
      { id: "TC-108", status: "booked" },
    ],
    [
      { id: "TC-109", status: "available" },
      { id: "TC-110", status: "available" },
      { id: "TC-111", status: "blocked" },
      { id: "TC-112", status: "available" },
    ],
    // ...add more rows as needed
  ];
  tenderRows.forEach((row, rowIndex) => {
    row.forEach((seat, colIndex) => {
      const { x, y } = adjustForAngle(
        tenderStartX + colIndex * colSpacing,
        tenderStartY + rowIndex * rowSpacing,
        rowIndex,
        colIndex,
      );
      mockSeats.push({
        id: seat.id,
        x,
        y,
        width: 40,
        height: 25,
        status: seat.status,
        type: "standard",
        zone: "tender",
        angle: angle,
      });
    });
  });
  return mockSeats;
})();

export const bookings: any[] = [];