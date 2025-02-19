import { CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';

export function PaymentSection() {
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <CreditCard className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-900">Payment Methods</h3>
        </div>
      </div>
      
      <div className="p-6">
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">No payment methods added yet</p>
          <Button>Add Payment Method</Button>
        </div>
      </div>
    </div>
  );
}