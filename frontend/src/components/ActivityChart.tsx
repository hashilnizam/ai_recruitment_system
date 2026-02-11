'use client';

import { ChartIcon, TrendingUpIcon, TrendingDownIcon } from '@/components/Icons';

interface ActivityData {
  label: string;
  value: number;
  previousValue?: number;
}

interface ActivityChartProps {
  title: string;
  data: ActivityData[];
  type?: 'bar' | 'line';
  color?: string;
}

export default function ActivityChart({ title, data, type = 'bar', color = '#3B82F6' }: ActivityChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const getBarHeight = (value: number) => (value / maxValue) * 100;

  const getChangeIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    if (change > 0) {
      return <TrendingUpIcon size={16} className="text-green-500" />;
    } else if (change < 0) {
      return <TrendingDownIcon size={16} className="text-red-500" />;
    }
    return null;
  };

  const getChangeText = (current: number, previous?: number) => {
    if (!previous) return '';
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ChartIcon size={16} />
          <span>Last 7 days</span>
        </div>
      </div>

      {type === 'bar' ? (
        <div className="space-y-4">
          {/* Chart Bars */}
          <div className="flex items-end justify-between h-40 px-2">
            {data.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="w-full max-w-8 flex flex-col items-center">
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    {item.value}
                  </div>
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                    style={{ 
                      height: `${getBarHeight(item.value)}%`,
                      backgroundColor: color,
                      minHeight: '4px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Labels */}
          <div className="flex justify-between px-2 mt-2">
            {data.map((item, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="text-xs text-gray-600 truncate">{item.label}</div>
                {item.previousValue && (
                  <div className="flex items-center justify-center mt-1 space-x-1">
                    {getChangeIcon(item.value, item.previousValue)}
                    <span className={`text-xs ${
                      item.value > item.previousValue ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {getChangeText(item.value, item.previousValue)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Simple Line Chart */}
          <div className="relative h-40">
            <svg className="w-full h-full" viewBox="0 0 300 160">
              {/* Grid Lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1="0"
                  y1={i * 40}
                  x2="300"
                  y2={i * 40}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              ))}
              
              {/* Data Line */}
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={data.map((item, index) => 
                  `${(index * 300) / (data.length - 1)},${160 - (item.value / maxValue) * 140}`
                ).join(' ')}
              />
              
              {/* Data Points */}
              {data.map((item, index) => (
                <circle
                  key={index}
                  cx={(index * 300) / (data.length - 1)}
                  cy={160 - (item.value / maxValue) * 140}
                  r="4"
                  fill={color}
                  className="hover:r-6 transition-all"
                />
              ))}
            </svg>
          </div>

          {/* Labels */}
          <div className="flex justify-between mt-2">
            {data.map((item, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="text-xs text-gray-600 truncate">{item.label}</div>
                <div className="text-xs font-medium text-gray-700">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold text-gray-900">
              {data.reduce((sum, item) => sum + item.value, 0)}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Average: <span className="font-semibold text-gray-900">
              {(data.reduce((sum, item) => sum + item.value, 0) / data.length).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
