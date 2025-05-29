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

export default function CIODashboard() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/capex/cio');
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
      const response = await fetch('/api/capex/cio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          status,
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
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">CIO Dashboard</h1>
      <div className="grid gap-6">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <CardTitle>CAPEX Request #{submission.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-lg">₹{submission.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="text-gray-600">{submission.reason}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Submitted On</p>
                  <p className="text-gray-600">
                    {new Date(submission.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={() => handleApproval(submission.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleApproval(submission.id, 'rejected')}
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {submissions.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-gray-500">No pending submissions</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 