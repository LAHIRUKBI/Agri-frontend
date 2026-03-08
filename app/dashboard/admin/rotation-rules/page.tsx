'use client';
import { useState } from 'react';
import AdminSidebar from '@/app/navigation/admin/page';

export default function RotationRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [isFetchingAI, setIsFetchingAI] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token'); 
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    };
  };

  const handleGetRules = async () => {
    setIsFetchingAI(true);
    try {
      const res = await fetch('http://localhost:5000/api/rotation/fetch-rules', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success) {
        // Load the transient rules into state
        setRules(data.data); 
      } else {
        alert("Failed to fetch new rules.");
      }
    } catch (error) {
      console.error("Error fetching from AI:", error);
      alert("Error contacting the AI service.");
    } finally {
      setIsFetchingAI(false);
    }
  };

  const handleAction = async (id: string, action: 'approved' | 'ignored', ruleData?: any) => {
    setRules(prev => prev.filter(r => r._id !== id));
    
    if (action === 'ignored') return;

    if (action === 'approved' && ruleData) {
      try {
        const res = await fetch(`http://localhost:5000/api/rotation/save-rule`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(ruleData)
        });
        
        const data = await res.json();
        if (data.success) {
          alert(`"${ruleData.ruleName}" successfully added to the database!`);
        }
      } catch (error) {
        console.error("Error saving rule to database:", error);
        alert("Error saving rule.");
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200">
        <AdminSidebar />
      </aside>

      <main className="flex-1 p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-end border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Crop Rotation Rules</h1>
          </div>
          
          <button 
            onClick={handleGetRules}
            disabled={isFetchingAI}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all disabled:bg-blue-400 flex items-center gap-2"
          >
            {isFetchingAI ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Analyzing Internet...
              </>
            ) : (
              '🔍 Get New Rules'
            )}
          </button>
        </div>

        {rules.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-gray-200 shadow-sm text-gray-500 flex flex-col items-center">
            <span className="text-4xl mb-4"></span>
            <p className="text-lg font-semibold">No pending rules at this time.</p>
            <p className="text-sm">Click "Get New Rules" to instruct the AI to find the latest rotation strategies.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {rules.map((rule) => (
              <div key={rule._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start transition-all hover:shadow-md">
                
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-900">{rule.ruleName}</h3>
                    <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border border-green-200">
                      {rule.sequence.join(' ➔ ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-5 leading-relaxed">{rule.description}</p>
                  
                  <div className="flex flex-wrap gap-6 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="flex items-center gap-1">
                      <strong className="text-gray-700">Source:</strong> 
                      <span className="text-blue-600 underline decoration-blue-300">{rule.source}</span>
                    </p>
                    <p className="flex items-center gap-1">
                      <strong className="text-gray-700">Fetched:</strong> 
                      {new Date(rule.fetchedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[160px] w-full md:w-auto">
                  <button 
                    onClick={() => handleAction(rule._id, 'approved', rule)}
                    className="bg-green-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    ✓ Add Database
                  </button>
                  <button 
                    onClick={() => handleAction(rule._id, 'ignored')}
                    className="bg-white text-red-600 border-2 border-red-100 px-4 py-2.5 rounded-lg font-bold hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    ✕ Ignore Rule
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}