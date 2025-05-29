import { NextResponse } from 'next/server';
import { insertSubmission, executeQuery } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, reason } = body;

    // Validate the request
    if (!amount || !reason) {
      return NextResponse.json(
        { error: 'Amount and reason are required' },
        { status: 400 }
      );
    }

    // Determine approver and final approver based on amount
    let approver;
    let finalApprover = null;
    if (amount <= 5000000) {
      approver = 'manager';
      finalApprover = null;
    } else if (amount <= 10000000) {
      approver = 'manager';
      finalApprover = 'cio';
    } else {
      approver = 'cfo';
      finalApprover = null;
    }

    // Insert the submission into the database with the determined approver and final approver
    const submissionId = await insertSubmission(amount, reason, approver, finalApprover);

    return NextResponse.json({ id: submissionId });
  } catch (error) {
    console.error('Error creating CAPEX request:', error);
    return NextResponse.json(
      { error: 'Failed to create CAPEX request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const submissions = await executeQuery('SELECT * FROM submissions ORDER BY created_at DESC');
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching CAPEX requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CAPEX requests' },
      { status: 500 }
    );
  }
} 