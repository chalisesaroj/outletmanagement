import React from 'react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'sky' | 'emerald' | 'amber' | 'rose' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'sky',
}) => {
  const colorMap = {
    sky: 'text-sky-600 bg-sky-50 dark:bg-sky-950/50 dark:text-sky-400 border-sky-100 dark:border-sky-900',
    emerald: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900',
    rose: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900',
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={cn('p-2.5 rounded-xl border', colorMap[color])}>
          {icon}
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                trend.isPositive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
