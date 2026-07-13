import React, { useState, useEffect, useMemo } from 'react';
import { PackageSearch, Search, ShoppingBag, DollarSign, Package, AlertCircle, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { getProducts } from '@/src/domains/store/products/api/productApi';
import type { Product } from '@/src/shared/types';

export default function OnlineStoreHub() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getProducts()
      .then(data => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setError('Store API unavailable. Product catalog will appear when the store service is deployed.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(products.map(p => p.category)))],
    [products],
  );

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const selected = products.find(p => p.id === selectedId);
  const totalValue = products.reduce((s, p) => s + p.price, 0);
  const avgRating = products.length
    ? (products.reduce((s, p) => s + p.rating, 0) / products.length).toFixed(1)
    : '—';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Store & Inventory</h3>
            <p className="text-[10px] text-slate-500">Live catalog from the store API</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Products', value: String(products.length), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Catalog Value', value: totalValue.toLocaleString() + ' Birr', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Categories', value: String(Math.max(categories.length - 1, 0)), icon: PackageSearch, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg Rating', value: avgRating, icon: ShoppingBag, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => {
          const SIcon = s.icon;
          return (
            <div key={i} className={`${s.bg} rounded-xl p-2.5`}>
              <SIcon className={`w-3.5 h-3.5 ${s.color} mb-0.5`} />
              <p className="font-black text-lg text-slate-900">{s.value}</p>
              <p className="text-[9px] font-medium text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-[220px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-brand-red/30"
          />
        </div>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${catFilter === c ? 'bg-brand-red/10 text-brand-red' : 'text-slate-400 hover:text-slate-600'}`}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filtered.length === 0 && !error ? (
        <div className="bg-white border border-slate-200 rounded-xl py-16 text-center">
          <Package className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">No products in the catalog yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  {['Product', 'Category', 'Price', 'Rating', ''].map(h => (
                    <th key={h} className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} onClick={() => setSelectedId(item.id)}
                    className={`border-b border-slate-50 cursor-pointer transition-colors ${selectedId === item.id ? 'bg-brand-red/5' : 'hover:bg-slate-50'}`}>
                    <td className="px-2 py-2 text-sm font-medium text-slate-800">{item.name}</td>
                    <td className="px-2 py-2 text-[11px] text-slate-500">{item.category}</td>
                    <td className="px-2 py-2 text-sm font-bold text-slate-900">{item.price.toLocaleString()} Birr</td>
                    <td className="px-2 py-2 text-[11px] text-slate-500">{item.rating} ({item.reviewsCount})</td>
                    <td className="px-2 py-2">
                      {item.image && (
                        <a href={item.image} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                          className="p-1 text-slate-300 hover:text-brand-red transition-colors">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 h-fit">
            <div className="flex items-center gap-1.5 mb-3">
              <PackageSearch className="w-3.5 h-3.5 text-brand-red" />
              <h4 className="font-bold text-sm text-slate-900">Product Details</h4>
            </div>
            {selected ? (
              <div className="space-y-3">
                {selected.image && (
                  <img src={selected.image} alt={selected.name} className="w-full h-32 object-cover rounded-lg border border-slate-100" />
                )}
                <div>
                  <p className="font-bold text-slate-900">{selected.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{selected.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-slate-400">Price</p>
                    <p className="font-bold text-slate-900">{selected.price.toLocaleString()} Birr</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-slate-400">Category</p>
                    <p className="font-bold text-slate-900">{selected.category}</p>
                  </div>
                </div>
                {selected.features.length > 0 && (
                  <ul className="text-[11px] text-slate-600 space-y-1">
                    {selected.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-brand-red" /> {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">Select a product to view details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
