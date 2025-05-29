'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Submission {
  id: number;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  approver: string;
}

export default function ManagerDashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/capex/manager');
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleApproval = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch('/api/capex/manager', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status,
          approver: 'manager',
        }),
      });

      if (!response.ok) throw new Error('Failed to update submission');

      toast.success(`Submission ${status} successfully`);
      fetchSubmissions(); // Refresh the list
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manager Dashboard</h2>
      
      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">No pending submissions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {submissions.map((submission) => (
            <Card key={submission.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Submission #{submission.id}</span>
                  <span className="text-sm font-normal">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Amount</p>
                    <p className="text-lg">₹{submission.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Reason</p>
                    <p className="text-lg">{submission.reason}</p>
                  </div>
                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => handleApproval(submission.id, 'rejected')}
                      className="text-red-600 hover:text-red-700"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApproval(submission.id, 'approved')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 