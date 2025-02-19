import { Package2 } from 'lucide-react';
import { Button } from '../ui/Button';

export function SubscriptionSection() {
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <Package2 className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-900">Subscription</h3>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Free Plan</h4>
            <p className="text-sm text-gray-600">
              You're currently on the free plan
            </p>
          </div>
          <Button>Upgrade Plan</Button>
        </div>

        <div className="mt-6 border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Plan Features</h4>
          <ul className="space-y-3">
            <li className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
              Basic habit tracking
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
              Weight tracking
            </li>
            <li className="flex items-center text-sm text-gray-600">
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
              Goal setting
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}