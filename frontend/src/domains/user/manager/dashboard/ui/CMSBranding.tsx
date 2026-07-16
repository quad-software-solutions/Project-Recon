import React, { useState, useEffect, useRef } from 'react';
import { Save, Check, Loader2, RotateCcw, Palette, Type, FileText, Eye, Smartphone, Monitor, Image, Globe, Upload } from 'lucide-react';
import { saveBranding, resetBranding } from '@/shared/hooks/useBranding';

const STORAGE_KEY = 'ethio-cms-branding';

interface BrandingData {
  slogan: string;
  vision: string;
  programDesc: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl: string;
  heroTitle: string;
  heroSubtitle: string;
}

const defaults: BrandingData = {
  slogan: 'Empowering the Next Generation of Innovators',
  vision: 'We believe that every student has the potential to shape the future of technology in Ethiopia and beyond.',
  programDesc: 'An introductory robotics course designed for young learners to build foundational STEM skills through hands-on VEX IQ kits.',
  primaryColor: '#ed1c24',
  secondaryColor: '#1e293b',
  fontFamily: 'Inter',
  logoUrl: '',
  heroTitle: 'Welcome to STEM Center',
  heroSubtitle: 'Building the Future, One Robot at a Time',
};

export default function CMSBranding() {
  const [data, setData] = useState<BrandingData>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaults;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'hero'>('content');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setData(prev => ({ ...prev, logoUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(t);
    }
  }, [saved]);

  const update = <K extends keyof BrandingData>(key: K, value: BrandingData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      saveBranding(data);
      setSaving(false);
      setSaved(true);
    }, 600);
  };

  const handleReset = () => {
    setData(defaults);
    resetBranding();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600/10 flex items-center justify-center">
            <Palette className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <h3 className="font-bold text-base text-slate-900">CMS & Branding</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(!preview)}
            className={`p-1.5 rounded-lg transition-colors ${preview ? 'bg-blue-600/10 text-blue-600' : 'text-slate-400 hover:bg-slate-100'}`}
            title={preview ? 'Edit mode' : 'Preview mode'}
          >
            {preview ? <Smartphone className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleReset} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors" title="Reset to defaults">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
        {(['content', 'style', 'hero'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-[11px] font-bold rounded-md uppercase tracking-wider transition-all ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'content' ? 'Content' : tab === 'style' ? 'Style' : 'Hero'}
          </button>
        ))}
      </div>

      {activeTab === 'content' && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Type className="w-3 h-3" />Target Slogan
              </label>
              {preview ? (
                <p className="text-sm text-slate-800 font-medium bg-slate-50 rounded-lg px-3 py-2 border border-slate-200" style={{ borderColor: data.primaryColor + '20' }}>{data.slogan}</p>
              ) : (
                <input type="text" value={data.slogan} onChange={e => update('slogan', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white transition-all"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <FileText className="w-3 h-3" />Vision Quote
              </label>
              {preview ? (
                <p className="text-sm text-slate-600 italic bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">{data.vision}</p>
              ) : (
                <textarea rows={2} value={data.vision} onChange={e => update('vision', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white transition-all resize-none"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <FileText className="w-3 h-3" />Program Description
              </label>
              {preview ? (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">{data.programDesc}</p>
              ) : (
                <textarea rows={3} value={data.programDesc} onChange={e => update('programDesc', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white transition-all resize-none"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'style' && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Palette className="w-3 h-3" />Primary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input type="color" value={data.primaryColor} onChange={e => update('primaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-slate-500">{data.primaryColor}</span>
                <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: data.primaryColor }} />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Palette className="w-3 h-3" />Secondary Brand Color
              </label>
              <div className="flex items-center gap-2">
                <input type="color" value={data.secondaryColor} onChange={e => update('secondaryColor', e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-slate-500">{data.secondaryColor}</span>
                <div className="w-6 h-6 rounded-full border border-slate-200" style={{ backgroundColor: data.secondaryColor }} />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Image className="w-3 h-3" />Logo URL
              </label>
              {preview ? (
                data.logoUrl ? <img src={data.logoUrl} alt="Logo" className="h-10 object-contain" /> : <p className="text-xs text-slate-400 italic">No logo set</p>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="text" value={data.logoUrl} onChange={e => update('logoUrl', e.target.value)} placeholder="https://example.com/logo.png"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white transition-all"
                  />
                  <input type="file" accept="image/*" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors shrink-0" title="Upload image">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              )}
              {data.logoUrl && !preview && (
                <div className="mt-2 rounded-lg border border-slate-200 p-3 flex items-center justify-center bg-white">
                  <img src={data.logoUrl} alt="" className="max-h-12 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Monitor className="w-3 h-3" />Font Family
              </label>
              <select value={data.fontFamily} onChange={e => update('fontFamily', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white transition-all"
              >
                {['Inter', 'Hanken Grotesk', 'system-ui', 'Georgia', 'Arial', 'Poppins', 'Roboto', 'Montserrat'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hero' && (
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4">
          <div className="flex flex-col gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Globe className="w-3 h-3" />Hero Section Title
              </label>
              {preview ? (
                <p className="text-lg font-bold text-slate-800 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200" style={{ borderColor: data.primaryColor + '20', color: data.primaryColor }}>{data.heroTitle}</p>
              ) : (
                <input type="text" value={data.heroTitle} onChange={e => update('heroTitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white transition-all"
                />
              )}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Type className="w-3 h-3" />Hero Section Subtitle
              </label>
              {preview ? (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">{data.heroSubtitle}</p>
              ) : (
                <textarea rows={2} value={data.heroSubtitle} onChange={e => update('heroSubtitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white transition-all resize-none"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={saving}
        className={`self-start px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
          saved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? 'Saving...' : saved ? 'Changes Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
