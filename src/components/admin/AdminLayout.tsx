import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, LayoutGrid, BarChart as ChartBar, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutGrid, label: 'Habits', href: '/admin/habits' },
    { icon: ChartBar, label: 'Analytics', href: '/admin/analytics' },
    { icon: Database, label: 'Database', href: '/admin/tables' },
  ];

  const currentPath = window.location.pathname;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
              title="Exit admin area"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold ml-2">{title}</h1>
          </div>

          {/* Navigation */}
          <div className="flex space-x-6 h-12 -mb-px">
            {navItems.map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                to={href}
                className={cn(
                  "flex items-center gap-2 px-1 border-b-2 text-sm font-medium transition-colors",
                  currentPath === href
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
