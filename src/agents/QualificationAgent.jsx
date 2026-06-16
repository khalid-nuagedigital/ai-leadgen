import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';
import toast from 'react-hot-toast';

export default function QualificationAgent() {
  const { leads, updateLead } = useLeadStore();
  const [autoMode, setAutoMode] = useState(false);

  const toQualify = leads.filter(l => l.status === 'outreached' || l.status === 'nurturing');

  useEffect(() => {
    let interval;
    if (autoMode && toQualify.length > 0) {
      interval = setInterval(() => {
        const next = toQualify[0];
        if (next) qualifyLead(next);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [autoMode, toQualify.length]);

  const qualifyLead = (lead) => {
    const score = Math.min(100, (lead.score || 0) + Math.floor(Math.random() * 35));
    const category = score >= 80 ? 'Hot' : score >= 60 ? 'Warm' : score >= 40 ? 'Cool' : 'Cold';
    const newStatus = score >= 60 ? 'qualified' : 'nurturing';
    
    setTimeout(() => {
      updateLead(lead.id, {
        status: newStatus,
        qualificationScore: score,
        score: score,
        qualificationNotes: `AI Qualified: ${category} Lead (${score}/100)`,
      });
      toast.success(`✅ ${lead.businessName} qualified: ${category} (${score})`);
    }, 600);
  };

  const qualifyAll = () => {
    toQualify.forEach(lead => qualifyLead(lead));
    toast.success('All leads qualified!');
  };

  const qualified = leads.filter(l => l.status === 'qualified');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">✅ Qualification Agent</h1>
          <p className="text-gray-500 mt-1">Score and qualify leads automatically.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAutoMode(!autoMode)} className={`px-4 py-2 rounded-lg text-sm font-medium ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={qualifyAll} disabled={toQualify.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
            ⚡ Qualify All ({toQualify.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Hot (80+)', value: qualified.filter(l => (l.qualificationScore || 0) >= 80).length, color: 'red' },
          { label: 'Warm (60-79)', value: qualified.filter(l => {const s = l.qualificationScore || 0; return s >= 60 && s < 80;}).length, color: 'yellow' },
          { label: 'Cool (40-59)', value: qualified.filter(l => {const s = l.qualificationScore || 0; return s >= 40 && s < 60;}).length, color: 'blue' },
          { label: 'Total Qualified', value: qualified.length, color: 'green' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border text-center">
            <div className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-3">📋 Qualified Leads ({qualified.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {qualified.map(lead => (
            <div key={lead.id} className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{lead.businessName}</div>
                <div className="text-xs text-gray-500">Score: {lead.qualificationScore || lead.score}</div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full font-bold ${
                (lead.qualificationScore || 0) >= 80 ? 'bg-red-100 text-red-700' :
                (lead.qualificationScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {lead.qualificationScore || lead.score}
              </span>
            </div>
          ))}
          {qualified.length === 0 && <p className="text-gray-400 text-center py-8">No qualified leads yet</p>}
        </div>
      </div>
    </div>
  );
}
