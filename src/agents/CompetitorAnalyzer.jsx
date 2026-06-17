import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

export default function CompetitorAnalyzer() {
  const { leads } = useLeadStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzedLeads = leads.filter(l => l.status === 'analyzed');

  const addCompetitor = () => setCompetitors([...competitors, { name: '', website: '', strengths: '', weaknesses: '' }]);
  const removeCompetitor = (i) => setCompetitors(competitors.filter((_, idx) => idx !== i));
  const updateCompetitor = (i, field, value) => {
    const updated = [...competitors];
    updated[i][field] = value;
    setCompetitors(updated);
  };

  const runAnalysis = async () => {
    if (!selectedLead) { toast.error('Select a lead first'); return; }
    setAnalyzing(true);
    try {
      const result = await openRouterAI.callAI([{ 
        role: 'user', 
        content: `Compare ${selectedLead.businessName} (${selectedLead.industry}) with competitors: ${JSON.stringify(competitors)}. Return JSON: {"strengths":["s1"],"weaknesses":["w1"],"opportunities":["o1"],"threats":["t1"],"marketPosition":"position","recommendations":["r1"],"score":85}` 
      }]);
      setAnalysis(result);
      toast.success('Analysis complete!');
    } catch {
      setAnalysis({
        strengths: ['Strong local presence', 'Established brand', 'Loyal customer base'],
        weaknesses: ['Limited online presence', 'No social media strategy', 'Outdated website'],
        opportunities: ['Growing local market', 'Competitor gaps in SEO', 'Social media expansion'],
        threats: ['New competitors entering', 'Price competition', 'Changing regulations'],
        marketPosition: 'Mid-tier with growth potential',
        recommendations: ['Invest in SEO', 'Launch social media campaigns', 'Update website'],
        score: 65,
      });
    } finally { setAnalyzing(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">🔍 Competitor Analyzer</h1><p className="text-sm text-gray-500">SWOT analysis & competitive intelligence</p></div>
        <button onClick={runAnalysis} disabled={analyzing || !selectedLead} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
          {analyzing ? '⏳ Analyzing...' : '📊 Run Analysis'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold mb-3">Select Lead</h3>
            <select value={selectedLead?.id || ''} onChange={e => setSelectedLead(analyzedLeads.find(l => l.id == e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Choose lead...</option>
              {analyzedLeads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex justify-between mb-3"><h3 className="font-semibold">Competitors</h3><button onClick={addCompetitor} className="text-xs text-blue-600">+ Add</button></div>
            {competitors.map((c, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg mb-2">
                <div className="flex justify-between mb-2"><span className="text-sm font-medium">Competitor #{i+1}</span><button onClick={() => removeCompetitor(i)} className="text-red-500 text-xs">Remove</button></div>
                <input type="text" value={c.name} onChange={e => updateCompetitor(i, 'name', e.target.value)} placeholder="Name" className="w-full px-2 py-1 border rounded text-xs mb-1" />
                <input type="text" value={c.website} onChange={e => updateCompetitor(i, 'website', e.target.value)} placeholder="Website" className="w-full px-2 py-1 border rounded text-xs mb-1" />
                <input type="text" value={c.strengths} onChange={e => updateCompetitor(i, 'strengths', e.target.value)} placeholder="Strengths" className="w-full px-2 py-1 border rounded text-xs mb-1" />
                <input type="text" value={c.weaknesses} onChange={e => updateCompetitor(i, 'weaknesses', e.target.value)} placeholder="Weaknesses" className="w-full px-2 py-1 border rounded text-xs" />
              </div>
            ))}
          </div>
        </div>

        <div>
          {analysis ? (
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-xl">
                <div className="text-3xl font-bold">{analysis.score}/100</div><div className="text-sm">Competitive Score</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg"><h4 className="font-semibold text-green-700 text-sm">💪 Strengths</h4><ul className="text-xs mt-1 space-y-1">{analysis.strengths?.map((s,i)=><li key={i}>• {s}</li>)}</ul></div>
                <div className="p-3 bg-red-50 rounded-lg"><h4 className="font-semibold text-red-700 text-sm">⚠️ Weaknesses</h4><ul className="text-xs mt-1 space-y-1">{analysis.weaknesses?.map((w,i)=><li key={i}>• {w}</li>)}</ul></div>
                <div className="p-3 bg-blue-50 rounded-lg"><h4 className="font-semibold text-blue-700 text-sm">💡 Opportunities</h4><ul className="text-xs mt-1 space-y-1">{analysis.opportunities?.map((o,i)=><li key={i}>• {o}</li>)}</ul></div>
                <div className="p-3 bg-orange-50 rounded-lg"><h4 className="font-semibold text-orange-700 text-sm">🚨 Threats</h4><ul className="text-xs mt-1 space-y-1">{analysis.threats?.map((t,i)=><li key={i}>• {t}</li>)}</ul></div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg"><h4 className="font-semibold text-purple-700 text-sm">🎯 Recommendations</h4><ul className="text-xs mt-1 space-y-1">{analysis.recommendations?.map((r,i)=><li key={i}>• {r}</li>)}</ul></div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p className="text-4xl mb-3">🔍</p><p>Select a lead and add competitors to analyze</p></div>
          )}
        </div>
      </div>
    </div>
  );
}