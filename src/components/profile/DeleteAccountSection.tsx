import { Button } from '../ui/Button';

export function DeleteAccountSection() {
  return (
    <div className="bg-white rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-medium text-red-600">Danger Zone</h3>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Delete Account</h4>
            <p className="text-sm text-gray-600">
              Permanently delete your account and all data
            </p>
          </div>
          <Button
            variant="secondary"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}