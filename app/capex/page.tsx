import CAPEXForm from '../components/CAPEX';

export default function CAPEXPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#0066a1' }}>CAPEX Approval System</h1>
      <CAPEXForm />
    </div>
  );
} 