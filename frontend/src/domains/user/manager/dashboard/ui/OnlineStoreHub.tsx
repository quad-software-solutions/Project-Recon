import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, DollarSign, Package, Tag, Loader2 } from 'lucide-react';
import { listProducts } from '@/domains/store/products/api/productApi';
import { listActiveCategories } from '@/domains/store/categories/api/categoriesApi';
import type { Product, ProductCategory } from '@/domains/store/model/types';

export default function OnlineStoreHub() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      listProducts(),
      listActiveCategories(),
    ]).then(([prods, cats]) => {
      setProducts(prods);
      setCategories(cats);
    }).catch(() => {
      setError('Failed to load store data.');
    }).finally(() => setLoading(false));
  }, []);

  const categoryNames = ['All', ...categories.map(c => c.name)];

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category_name === catFilter;
    return matchSearch && matchCat;
  });

  const totalValue = products.reduce((s, p) => s + Number(p.price || 0), 0);
  const totalItems = products.length;
  const activeItems = products.filter(p => p.is_active).length;
  const categoryCount = categories.length;

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  if (error) {
    return <div className="flex items-center justify-center py-16 text-sm text-slate-400">{error}</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
        </div>
        <h3 className="font-bold text-base text-slate-900">Store & Inventory</h3>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total Products', value: totalItems.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Value', value: totalValue.toLocaleString() + ' Birr', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Products', value: activeItems.toString(), icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Categories', value: categoryCount.toString(), icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
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

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-full pl-6 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-600/30"
          />
        </div>
        {categoryNames.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${catFilter === c ? 'bg-blue-600/10 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {['Product', 'SKU', 'Category', 'Price', 'Status'].map(h => (
                <th key={h} className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                <td className="px-2 py-2 text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  {product.name}
                </td>
                <td className="px-2 py-2 text-[10px] font-mono text-slate-400">{product.sku}</td>
                <td className="px-2 py-2 text-[11px] text-slate-500">{product.category_name}</td>
                <td className="px-2 py-2 text-sm font-bold text-slate-900">{Number(product.price).toLocaleString()} Birr</td>
                <td className="px-2 py-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    product.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {product.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No products match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
