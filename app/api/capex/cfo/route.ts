import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// Get all pending submissions for CFO approval
export async function GET() {
  try {
    const query = `
      SELECT * FROM submissions 
      WHERE status = 'pending' 
      AND approver = 'cfo'
      ORDER BY created_at DESC
    `;
    
    const submissions = await executeQuery(query);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching CFO submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}

// Update submission status (approve/reject)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const query = `
      UPDATE submissions 
      SET status = @status,
          cfo_approval = CASE WHEN @status = 'approved' THEN 1 ELSE 0 END,
          updated_at = GETDATE()
      WHERE id = @id AND approver = 'cfo';
    `;

    await executeQuery(query, [status, id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
} 