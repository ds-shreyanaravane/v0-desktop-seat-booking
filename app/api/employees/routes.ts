import { NextResponse } from 'next/server';

let employees = [
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
  // ...add more dummy employees as needed
];

export async function GET() {
  return NextResponse.json(employees);
}