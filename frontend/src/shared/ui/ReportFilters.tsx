import React from 'react';
import { Search, CalendarDays, RefreshCw } from 'lucide-react';

export const DATE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'This Week', days: 7 },
  { label: 'Last Week', days: 14 },
  { label: 'This Month', days: 30 },
  { label: 'Last Month', days: 60 },
  { label: 'Last 3 Months', days: 90 },
  { label: 'Last 6 Months', days: 180 },
  { label: 'Last Year', days: 365 },
] as const;

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  datePreset: string;
  onDatePresetChange: (v: string) => void;
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (v: string) => void;
  onDateToChange?: (v: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  filters?: React.ReactNode;
}

export default function ReportFilters({
  search, onSearchChange,
  datePreset, onDatePresetChange,
  dateFrom, dateTo,
  onDateFromChange, onDateToChange,
  onRefresh, loading,
  filters,
}: Props) {
  const isCustom = datePreset === 'custom';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <select
              value={datePreset}
              onChange={e => onDatePresetChange(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-700 py-1.5 pr-2 pl-1 focus:outline-none"
            >
              {DATE_PRESETS.map(d => <option key={d.label} value={d.days.toString()}>{d.label}</option>)}
              <option value="custom">Custom Range</option>
            </select>
          </div>
          {isCustom && onDateFromChange && onDateToChange && (
            <div className="flex items-center gap-1">
              <input type="date" value={dateFrom || ''} onChange={e => onDateFromChange(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900" />
              <span className="text-slate-400 text-xs">—</span>
              <input type="date" value={dateTo || ''} onChange={e => onDateToChange(e.target.value)}
                className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-900" />
            </div>
          )}
          {onRefresh && (
            <button type="button" onClick={onRefresh} disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>
      {filters && <div className="flex flex-wrap gap-2">{filters}</div>}
    </div>
  );
}
