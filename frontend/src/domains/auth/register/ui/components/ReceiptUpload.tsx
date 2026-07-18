import { useCallback, useEffect, useRef, useState } from 'react';
import { FileUp, X, Image as ImageIcon, FileText } from 'lucide-react';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024;

type ReceiptUploadProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
};

export function ReceiptUpload({ file, onChange, error }: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const validateAndSet = useCallback(
    (next: File | null) => {
      setLocalError('');
      if (!next) {
        onChange(null);
        return;
      }
      if (!ACCEPTED.includes(next.type)) {
        setLocalError('Please upload a PNG, JPG, WEBP, or PDF file.');
        return;
      }
      if (next.size > MAX_BYTES) {
        setLocalError('File must be 5 MB or smaller.');
        return;
      }
      onChange(next);
    },
    [onChange],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          validateAndSet(e.dataTransfer.files?.[0] || null);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 px-4 py-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40 ${
          dragOver
            ? 'border-brand-blue bg-brand-blue/[0.06]'
            : file
              ? 'border-brand-blue/40 bg-brand-blue/[0.03]'
              : 'border-slate-200 bg-white hover:border-brand-blue/40 hover:bg-slate-50'
        }`}
        aria-label="Upload payment receipt"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Receipt preview" className="max-h-36 rounded-lg object-contain" />
        ) : (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              file ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-100 text-slate-400'
            }`}
          >
            {file?.type === 'application/pdf' ? <FileText className="w-6 h-6" /> : file ? <ImageIcon className="w-6 h-6" /> : <FileUp className="w-6 h-6" />}
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-bold text-slate-800">
            {file ? file.name : 'Drag & drop receipt, or click to browse'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {file ? `${(file.size / 1024).toFixed(1)} KB` : 'PNG, JPG, WEBP or PDF · max 5 MB'}
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.pdf,application/pdf"
          className="hidden"
          onChange={(e) => validateAndSet(e.target.files?.[0] || null)}
        />
      </div>
      {file && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            validateAndSet(null);
            if (inputRef.current) inputRef.current.value = '';
          }}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-blue transition-colors"
        >
          <X className="w-3.5 h-3.5" /> Remove file
        </button>
      )}
      {(localError || error) && (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          {localError || error}
        </p>
      )}
    </div>
  );
}
