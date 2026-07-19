import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, Code, ChevronDown, Loader2 } from 'lucide-react';
import { downloadCsv, downloadJson, downloadPdf } from '../utils/export';

interface Props {
  rows: Record<string, any>[];
  filename?: string;
  title?: string;
  columns?: string[];
  disabled?: boolean;
}

export default function ReportExportDropdown({ rows, filename = 'export', title = 'Report', columns, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const wrap = (key: string, fn: () => void) => async () => {
    setBusy(key);
    await new Promise(r => setTimeout(r, 0));
    fn();
    setBusy(null);
    setOpen(false);
  };

  const items = [
    { key: 'pdf', label: 'Export PDF', icon: FileText, fn: () => downloadPdf(title, rows, columns), desc: 'Print or save as PDF' },
    { key: 'csv', label: 'Export CSV', icon: FileSpreadsheet, fn: () => downloadCsv(rows, filename), desc: 'Open in Excel or Sheets' },
    { key: 'json', label: 'Export JSON', icon: Code, fn: () => downloadJson(rows, filename), desc: 'Raw data format' },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled || rows.length === 0}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm"
      >
        <Download className="w-3.5 h-3.5" /> Export <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl border border-slate-200 shadow-lg z-20 py-1 overflow-hidden">
          {items.map(item => (
            <button
              key={item.key}
              type="button"
              onClick={wrap(item.key, item.fn)}
              disabled={busy === item.key}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {busy === item.key ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <item.icon className="w-4 h-4 text-slate-500" />}
              <div className="text-left">
                <p className="font-semibold">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
