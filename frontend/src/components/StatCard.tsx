import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: ReactNode;
  iconBgColor?: string;
  trend?: 'up' | 'down';
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  iconBgColor = 'bg-gradient-to-br from-blue-400 to-blue-600',
  trend
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
          {change && (
            <div className="flex items-center space-x-1">
              <span
                className={`text-sm font-medium ${
                  changeType === 'increase'
                    ? 'text-green-600'
                    : changeType === 'decrease'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}
              >
                {changeType === 'increase' && '↗ '}
                {changeType === 'decrease' && '↘ '}
                {change}
              </span>
              <span className="text-xs text-gray-500">from last month</span>
            </div>
          )}
        </div>
        <div className={`w-14 h-14 ${iconBgColor} rounded-xl flex items-center justify-center text-white shadow-md`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
