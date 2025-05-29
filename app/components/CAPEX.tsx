'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import CAPEXStatus from './CAPEXStatus';

interface CAPEXFormData {
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  currentApprover: 'manager' | 'cio' | 'cfo' | 'completed';
  managerApproval?: boolean;
  cioApproval?: boolean;
  cfoApproval?: boolean;
  buFunction?: string;
  division?: string;
  location?: string;
}

export default function CAPEXForm() {
  const [formData, setFormData] = useState<CAPEXFormData>({
    amount: 0,
    reason: '',
    status: 'pending',
    currentApprover: 'manager',
  });

  const [submittedRequest, setSubmittedRequest] = useState<CAPEXFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/capex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formData.amount,
          reason: formData.reason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit CAPEX request');
      }

      const result = await response.json();
      
      const newRequest = {
        ...formData,
        id: result.id,
        managerApproval: undefined,
        cioApproval: undefined,
        cfoApproval: undefined,
      };

      setSubmittedRequest(newRequest);
      toast.success('CAPEX request submitted successfully');
      
      setFormData({
        amount: 0,
        reason: '',
        status: 'pending',
        currentApprover: 'manager',
      });
    } catch (error) {
      toast.error('Failed to submit CAPEX request');
      console.error('Error submitting CAPEX request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRequiredApprovers = (amount: number) => {
    if (amount <= 5000000) return ['manager'];
    if (amount <= 10000000) return ['manager', 'cio'];
    return ['manager', 'cio', 'cfo'];
  };

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoadingBookings(true);
      try {
        const response = await fetch('/api/capex');
        if (!response.ok) throw new Error('Failed to fetch bookings');
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        setBookings([]);
      } finally {
        setIsLoadingBookings(false);
      }
    };
    fetchBookings();
  }, [submittedRequest]);

  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto border-t-8" style={{ borderTopColor: '#0066a1' }}>
        <CardHeader>
          <CardTitle style={{ color: '#0066a1' }}>CAPEX Approval Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="amount" className="text-lg font-medium" style={{ fontSize: '1.25rem' }}>
                Amount (₹)
              </label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                required
                min="0"
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="reason" className="text-lg font-medium" style={{ fontSize: '1.25rem' }}>
                Reason
              </label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                placeholder="Enter reason for CAPEX request"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="buFunction" className="text-lg font-medium" style={{ fontSize: '1.25rem' }}>BU Function</label>
              <select
                id="buFunction"
                className="block w-full rounded border border-gray-300 px-3 py-2 text-lg"
                value={formData.buFunction || ''}
                onChange={e => setFormData({ ...formData, buFunction: e.target.value })}
                required
              >
                <option value="" style={{ fontSize: '2.5rem' }}>Select BU Function</option>
                <option value="BPT-IT" style={{ fontSize: '2.5rem' }}>BPT-IT</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="division" className="text-lg font-medium" style={{ fontSize: '1.25rem' }}>Division</label>
              <select
                id="division"
                className="block w-full rounded border border-gray-300 px-3 py-2 text-lg"
                value={formData.division || ''}
                onChange={e => setFormData({ ...formData, division: e.target.value })}
                required
              >
                <option value="" style={{ fontSize: '2.5rem' }}>Select Division</option>
                <option value="Sales" style={{ fontSize: '2.5rem' }}>Sales</option>
                <option value="Marketing" style={{ fontSize: '2.5rem' }}>Marketing</option>
                <option value="Supply Chain" style={{ fontSize: '2.5rem' }}>Supply Chain</option>
                <option value="RnD" style={{ fontSize: '2.5rem' }}>RnD</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-lg font-medium" style={{ fontSize: '1.25rem' }}>Location</label>
              <select
                id="location"
                className="block w-full rounded border border-gray-300 px-3 py-2 text-lg"
                value={formData.location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                required
              >
                <option value="" style={{ fontSize: '2.5rem' }}>Select Location</option>
                <option value="Mumbai" style={{ fontSize: '2.5rem' }}>Mumbai</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-large" style={{ fontSize: '1.25rem' }}>Required Approvers:</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {getRequiredApprovers(formData.amount).map((approver) => (
                  <li key={approver} className="capitalize" style={{ fontSize: '1.25rem' }}>
                    {approver}
                  </li>
                ))}
              </ul>
            </div>

            <Button type="submit" className="w-full text-white" style={{ backgroundColor: '#0066a1' }} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {submittedRequest && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Request Status</CardTitle>
          </CardHeader>
          <CardContent>
            <CAPEXStatus
              amount={submittedRequest.amount}
              status={submittedRequest.status}
              currentApprover={submittedRequest.currentApprover}
              managerApproval={submittedRequest.managerApproval}
              cioApproval={submittedRequest.cioApproval}
              cfoApproval={submittedRequest.cfoApproval}
            />
          </CardContent>
        </Card>
      )}

      {bookings.length > 0 && (
        <Card className="w-full max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle style={{ color: '#0066a1' }}>View Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBookings ? (
              <div>Loading bookings...</div>
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
                    {bookings.map((b) => (
                      <tr key={b.id} className="border-t">
                        <td className="px-4 py-2">{b.id}</td>
                        <td className="px-4 py-2">₹{Number(b.amount).toLocaleString()}</td>
                        <td className="px-4 py-2">{b.reason}</td>
                        <td className="px-4 py-2 capitalize">{b.approver}</td>
                        <td className="px-4 py-2 capitalize">{b.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 