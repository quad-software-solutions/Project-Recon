export function toCsv(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n');
}

export function downloadCsv(rows: Record<string, any>[], filename: string) {
  const csv = toCsv(rows);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

export function downloadJson(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, filename.endsWith('.json') ? filename : `${filename}.json`);
}

export function printTable(title: string, rows: Record<string, any>[], columns?: string[]) {
  genPdfHtml(title, rows, columns, true);
}

export function downloadPdf(title: string, rows: Record<string, any>[], columns?: string[]) {
  genPdfHtml(title, rows, columns, false);
}

function genPdfHtml(title: string, rows: Record<string, any>[], columns?: string[], autoPrint = true) {
  const keys = columns || (rows.length ? Object.keys(rows[0]) : []);
  const esc = (v: any) => String(v ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { margin: 0.75in; size: auto; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; padding: 2rem; color: #1e293b; background: #fff; }
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 2px solid #1e293b; }
  .header h1 { font-size: 1.5rem; font-weight: 700; letter-spacing: -0.025em; }
  .header .brand { color: #64748b; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
  .meta { display: flex; gap: 2rem; color: #64748b; font-size: 0.8125rem; margin-bottom: 1.5rem; }
  .meta span { display: flex; align-items: center; gap: 0.375rem; }
  .meta .sep { color: #cbd5e1; }
  table { width: 100%; border-collapse: collapse; font-size: 0.75rem; line-height: 1.4; }
  th { background: #1e293b; color: #fff; text-align: left; padding: 0.5rem 0.75rem; font-weight: 600; font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; }
  td { padding: 0.4375rem 0.75rem; border-bottom: 1px solid #e2e8f0; color: #334155; }
  tr:nth-child(even) td { background: #f8fafc; }
  tr:hover td { background: #f1f5f9; }
  .footer { margin-top: 2rem; padding-top: 0.75rem; border-top: 1px solid #e2e8f0; font-size: 0.6875rem; color: #94a3b8; text-align: center; }
  @media print { body { padding: 0; } .no-print { display: none; } }
</style></head><body>
<div class="header">
  <h1>${esc(title)}</h1>
  <div class="brand">Project Recon</div>
</div>
<div class="meta">
  <span>Generated: ${new Date().toLocaleString()}</span>
  <span class="sep">|</span>
  <span>Rows: ${rows.length}</span>
  <span class="sep">|</span>
  <span>Columns: ${keys.length}</span>
</div>
<table>
  <thead><tr>${keys.map(k => `<th>${esc(k)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map(r => `<tr>${keys.map(k => `<td>${esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
<div class="footer">Project Recon — Confidential</div>
${autoPrint ? '<script>window.print();window.close();<\/script>' : ''}
</body></html>`);
  w.document.close();
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
