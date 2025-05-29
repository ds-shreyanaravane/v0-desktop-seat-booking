"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/capex');
        if (!response.ok) throw new Error('Failed to fetch requests');
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        setRequests([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle style={{ color: '#0066a1' }}>View Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading requests...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Reason</th>
                    <th className="px-4 py-2 text-left">Approver</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-2">{r.id}</td>
                      <td className="px-4 py-2">₹{Number(r.amount).toLocaleString()}</td>
                      <td className="px-4 py-2">{r.reason}</td>
                      <td className="px-4 py-2 capitalize">{r.approver}</td>
                      <td className={`px-4 py-2 capitalize font-semibold text-white ` +
                        (r.status === 'approved' ? 'bg-green-600' :
                         r.status === 'pending' ? 'bg-purple-600' :
                         r.status === 'rejected' ? 'bg-red-600' : '')
                      }>
                        {r.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 