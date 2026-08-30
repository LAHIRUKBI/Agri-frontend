'use client';
import { useState, useEffect } from 'react';
import AdminSidebar from '@/app/navigation/admin/page';

export default function SoilNutrientsPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('http://localhost:5000/api/nutrients')
      .then(res => res.json())
      .then(data => {
        if (data.success) setConfig(data.data);
        setLoading(false);
      });
  }, []);

  const handleNutrientChange = (index: number, field: string, value: string) => {
    const updated = { ...config };
    updated.nutrients[index][field] = field === 'name' || field === 'symbol' || field === 'type' ? value : Number(value);
    setConfig(updated);
  };

  const handleAddNutrient = () => {
    const updated = { ...config };
    updated.nutrients.push({ name: '', symbol: '', type: 'other', min: 0, max: 0, unit: 'ppm' });
    setConfig(updated);
  };

  const handleDeleteNutrient = async (index: number, nutrientId: string | undefined) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this nutrient?");
    if (!confirmDelete) return;

    // If the nutrient exists in the database (has an _id), call the backend to delete it
    if (nutrientId) {
      try {
        await fetch(`http://localhost:5000/api/nutrients/${nutrientId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error("Failed to delete from database", error);
        return alert("Error deleting nutrient.");
      }
    }

    // Remove it from the local UI state
    const updated = { ...config };
    updated.nutrients.splice(index, 1);
    setConfig(updated);
  };

  const saveConfig = async () => {
    setSaving(true);
    await fetch('http://localhost:5000/api/nutrients', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    alert('Soil configuration updated successfully!');
    setSaving(false);
  };

  if (loading) return <div className="flex min-h-screen bg-white"><main className="flex-1 p-6">Loading...</main></div>;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200">
        <AdminSidebar />
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-3">
          <h1 className="text-2xl font-bold text-black">Soil Nutrients Management</h1>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-colors disabled:bg-gray-300"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* pH Level */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-black mb-3">Target pH Level</h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-black mb-1">Min pH</label>
              <input
                type="number"
                step="0.1"
                value={config.phMin}
                onChange={e => setConfig({...config, phMin: Number(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-black mb-1">Max pH</label>
              <input
                type="number"
                step="0.1"
                value={config.phMax}
                onChange={e => setConfig({...config, phMax: Number(e.target.value)})}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        {/* Nutrients List */}
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-black">Nutrient Ranges (ppm)</h2>
            <button
              onClick={handleAddNutrient}
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold px-3 py-1.5 rounded border border-blue-200 transition-colors"
            >
              + Add Nutrient
            </button>
          </div>

          {config.nutrients.map((nut: any, i: number) => (
            <div key={i} className="flex flex-wrap gap-3 items-end p-3 bg-gray-50 rounded-md border border-gray-100 relative">
              <div className="flex-1 min-w-[130px]">
                <label className="block text-xs font-medium text-black mb-1">Name</label>
                <input
                  type="text"
                  value={nut.name}
                  onChange={e => handleNutrientChange(i, 'name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="w-16">
                <label className="block text-xs font-medium text-black mb-1">Symbol</label>
                <input
                  type="text"
                  value={nut.symbol}
                  onChange={e => handleNutrientChange(i, 'symbol', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-black mb-1">Type</label>
                <select
                  value={nut.type}
                  onChange={e => handleNutrientChange(i, 'type', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="main">Main</option>
                  <option value="secondary">Secondary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-black mb-1">Min (ppm)</label>
                <input
                  type="number"
                  value={nut.min}
                  onChange={e => handleNutrientChange(i, 'min', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-black mb-1">Max (ppm)</label>
                <input
                  type="number"
                  value={nut.max}
                  onChange={e => handleNutrientChange(i, 'max', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              
              {/* Delete Button */}
              <div className="w-auto">
                <button
                  onClick={() => handleDeleteNutrient(i, nut._id)}
                  className="bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold px-3 py-1.5 rounded border border-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}