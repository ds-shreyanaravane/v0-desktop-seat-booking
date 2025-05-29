import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

// Get all pending submissions for manager approval
export async function GET() {
  try {
    const query = `
      SELECT * FROM submissions 
      WHERE status = 'pending' 
      AND approver = 'manager'
      ORDER BY created_at DESC
    `;
    
    const submissions = await executeQuery(query);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching manager submissions:', error);
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
    const { id, status, approver } = body;

    if (!id || !status || !approver) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch the submission to check final_approver
    const submissions = await executeQuery(
      'SELECT final_approver FROM submissions WHERE id = @id',
      [undefined, id, undefined]
    );
    const finalApprover = submissions[0]?.final_approver;

    let updateQuery;
    let params;
    if (status === 'approved' && finalApprover === 'cio') {
      // Move to CIO approval
      updateQuery = `
        UPDATE submissions 
        SET status = 'pending',
            approver = 'cio',
            manager_approval = 1,
            updated_at = GETDATE()
        WHERE id = @id AND approver = @approver;
      `;
      params = [undefined, id, approver];
    } else {
      // Normal approval/rejection
      updateQuery = `
        UPDATE submissions 
        SET status = @status,
            manager_approval = CASE WHEN @status = 'approved' THEN 1 ELSE 0 END,
            updated_at = GETDATE()
        WHERE id = @id AND approver = @approver;
      `;
      params = [status, id, approver];
    }

    await executeQuery(updateQuery, params);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    );
  }
} 