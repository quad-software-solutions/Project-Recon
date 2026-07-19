import React from 'react';
import { Download, FileSpreadsheet, FileText, Eye, type LucideIcon } from 'lucide-react';
import { downloadCsv, downloadJson, downloadPdf } from '../utils/export';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  trend?: { value: string; positive: boolean };
  reportData?: Record<string, any>[];
  reportFilename?: string;
  onViewReport?: () => void;
}

export default function ReportCard({
  title, value, subtitle, icon: Icon, color = 'text-blue-600', bg = 'bg-blue-50',
  trend, reportData, reportFilename, onViewReport,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        {onViewReport && (
          <button type="button" onClick={onViewReport}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors" title="View Report">
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs font-medium text-slate-500 mt-0.5">{title}</p>
      {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
      {trend && (
        <p className={`text-[11px] font-bold mt-1.5 ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </p>
      )}
      {reportData && reportData.length > 0 && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100">
          <button type="button" onClick={() => downloadCsv(reportData, reportFilename || title)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
            <FileSpreadsheet className="w-3 h-3" /> CSV
          </button>
          <button type="button" onClick={() => downloadJson(reportData, reportFilename || title)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
            <Download className="w-3 h-3" /> JSON
          </button>
          <button type="button" onClick={() => downloadPdf(title, reportData)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold text-slate-500 hover:bg-slate-50 transition-colors">
            <FileText className="w-3 h-3" /> PDF
          </button>
        </div>
      )}
    </div>
  );
}
