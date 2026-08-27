/**
 * CardStat Component
 * Kartu ringkasan statistik KPI Dashboard
 */
import React, { ReactNode } from 'react';

interface CardStatProps {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  colorClass?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const CardStat: React.FC<CardStatProps> = ({
  id,
  title,
  value,
  subtitle,
  icon,
  colorClass = 'from-blue-600 to-indigo-700 text-white',
  trend
}) => {
  return (
    <div
      id={id}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} shadow-md shadow-slate-200`}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {subtitle && <span>{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
