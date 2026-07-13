import React, { useState } from 'react';
import { PackageSearch, Save, Plus, Trash2, X, Search, ShoppingBag, DollarSign, Package, AlertCircle } from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  sku: string;
  active: boolean;
}

const defaultItems: InventoryItem[] = [
  { id: '1', name: 'Pro Multi-Pocket Backpack', category: 'Apparel & Bags', price: '6,500', stock: 24, sku: 'BAG-001', active: true },
  { id: '2', name: 'LiDAR Sweep Sensor', category: 'Sensors', price: '11,400', stock: 45, sku: 'SEN-002', active: true },
  { id: '3', name: 'Geometry & Compass Kit', category: 'Stationery', price: '1,500', stock: 8, sku: 'STA-003', active: true },
  { id: '4', name: 'Insulated Sports Bottle', category: 'Accessories', price: '2,200', stock: 0, sku: 'ACC-004', active: false },
  { id: '5', name: 'Student Coding Laptop', category: 'Accessories', price: '34,500', stock: 5, sku: 'ACC-005', active: true },
  { id: '6', name: 'ESP32 IoT Explorer Pack', category: 'Microcontrollers', price: '5,400', stock: 32, sku: 'MCU-006', active: true },
];

const categories = ['All', 'Apparel & Bags', 'Sensors', 'Stationery', 'Accessories', 'Microcontrollers'];

export default function OnlineStoreHub() {
  const [items, setItems] = useState<InventoryItem[]>(defaultItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saved, setSaved] = useState(false);

  const selected = items.find(i => i.id === selectedId);

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || i.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalValue = items.reduce((s, i) => s + parseInt(i.price.replace(/,/g, '')) * i.stock, 0);
  const totalItems = items.length;
  const lowStock = items.filter(i => i.stock > 0 && i.stock < 10).length;
  const outOfStock = items.filter(i => i.stock === 0).length;

  const selectItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      setSelectedId(id);
      setEditName(item.name);
      setEditPrice(item.price);
      setEditStock(item.stock.toString());
      setEditCategory(item.category);
      setSaved(false);
    }
  };

  const saveSelected = () => {
    if (!selectedId) return;
    setItems(prev => prev.map(i => i.id === selectedId ? { ...i, name: editName, price: editPrice, stock: parseInt(editStock) || 0, category: editCategory } : i));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const addItem = () => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: 'New Product',
      category: 'Accessories',
      price: '0',
      stock: 0,
      sku: 'NEW-' + String(Date.now()).slice(-4),
      active: true,
    };
    setItems(prev => [newItem, ...prev]);
    setSelectedId(newItem.id);
    setEditName(newItem.name);
    setEditPrice(newItem.price);
    setEditStock('0');
    setEditCategory(newItem.category);
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <h3 className="font-bold text-base text-slate-900">Store & Inventory</h3>
        </div>
        <button onClick={addItem}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Product
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total Products', value: totalItems.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Inventory Value', value: totalValue.toLocaleString() + ' Birr', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Low Stock', value: lowStock.toString(), icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Out of Stock', value: outOfStock.toString(), icon: X, color: 'text-red-600', bg: 'bg-red-50' },
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
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${catFilter === c ? 'bg-blue-600/10 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                {['Product', 'SKU', 'Category', 'Price', 'Stock', ''].map(h => (
                  <th key={h} className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2 py-1.5 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} onClick={() => selectItem(item.id)}
                  className={`border-b border-slate-50 cursor-pointer transition-colors ${selectedId === item.id ? 'bg-blue-600/5' : 'hover:bg-slate-50'}`}
                >
                  <td className="px-2 py-2 text-sm font-medium text-slate-800 flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    {item.name}
                  </td>
                  <td className="px-2 py-2 text-[10px] font-mono text-slate-400">{item.sku}</td>
                  <td className="px-2 py-2 text-[11px] text-slate-500">{item.category}</td>
                  <td className="px-2 py-2 text-sm font-bold text-slate-900">{item.price} Birr</td>
                  <td className="px-2 py-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.stock > 10 ? 'bg-emerald-50 text-emerald-600' : item.stock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {item.stock}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={e => { e.stopPropagation(); deleteItem(item.id); }} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No products match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-3 h-fit">
          <div className="flex items-center gap-1.5 mb-3">
            <PackageSearch className="w-3.5 h-3.5 text-blue-600" />
            <h4 className="font-bold text-sm text-slate-900">Edit Product</h4>
            {selected && <span className="text-[10px] text-slate-400 font-mono ml-auto">{selected.sku}</span>}
          </div>
          {selected ? (
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Product Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Price (Birr)</label>
                  <input value={editPrice} onChange={e => setEditPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Stock</label>
                  <input type="number" value={editStock} onChange={e => setEditStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select value={editCategory} onChange={e => setEditCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-slate-800 focus:outline-none focus:border-blue-600/30 focus:bg-white"
                >
                  {categories.filter(c => c !== 'All').map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <button onClick={saveSelected}
                className={`self-start px-4 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                  saved ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Save className="w-3 h-3" />
                {saved ? 'Saved!' : 'Update Product'}
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Select a product from the table to edit.</p>
          )}
        </div>
      </div>
    </div>
  );
}
