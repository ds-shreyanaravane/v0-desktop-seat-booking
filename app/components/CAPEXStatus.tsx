'use client';

interface CAPEXStatusProps {
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  currentApprover: 'manager' | 'cio' | 'cfo' | 'completed';
  managerApproval?: boolean;
  cioApproval?: boolean;
  cfoApproval?: boolean;
}

export default function CAPEXStatus({
  amount,
  status,
  currentApprover,
  managerApproval,
  cioApproval,
  cfoApproval,
}: CAPEXStatusProps) {
  const getRequiredApprovers = (amount: number) => {
    if (amount <= 5000000) return ['manager'];
    if (amount <= 10000000) return ['manager', 'cio'];
    return ['manager', 'cio', 'cfo'];
  };

  const requiredApprovers = getRequiredApprovers(amount);

  const getStatusColor = (approval: boolean | undefined, approver: string) => {
    if (approver === 'manager' && (approval === undefined || approval === null)) return 'bg-yellow-300';
    if (approval === undefined) return 'bg-gray-200';
    return approval ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (approval: boolean | undefined, approver: string) => {
    if (approver === 'manager' && (approval === undefined || approval === null)) return 'Pending';
    if (approval === undefined) return 'Pending';
    return approval ? 'Approved' : 'Rejected';
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold">Approval Status</h3>
      <div className="space-y-2">
        {requiredApprovers.map((approver) => (
          <div key={approver} className="flex items-center space-x-4">
            <div className="w-24 capitalize">{approver}</div>
            <div className={`h-2 w-2 rounded-full ${getStatusColor(
              approver === 'manager' ? managerApproval :
              approver === 'cio' ? cioApproval :
              cfoApproval,
              approver
            )}`} />
            <div className="text-sm text-gray-600">
              {getStatusText(
                approver === 'manager' ? managerApproval :
                approver === 'cio' ? cioApproval :
                cfoApproval,
                approver
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <div className="text-sm font-medium">Current Status:</div>
        <div className={`inline-block px-3 py-1 rounded-full text-sm ${
          status === 'approved' ? 'bg-green-100 text-green-800' :
          status === 'rejected' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>
    </div>
  );
} 