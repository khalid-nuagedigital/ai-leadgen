import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

export default function ColdEmailAgent() {
  const { leads } = useLeadStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [style, setStyle] = useState('professional');
  const [angle, setAngle] = useState('value');
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);

  const styles = ['professional', 'casual', 'bold', 'curious', 'helpful'];
  const angles = [
    { id: 'value', label: 'Value First', desc: 'Lead with specific value' },
    { id: 'problem', label: 'Problem/Solution', desc: 'Identify pain point' },
    { id: 'social', label: 'Social Proof', desc: 'Case study approach' },
    { id: 'question', label: 'Question Based', desc: 'Engage with questions' },
    { id: 'compliment', label: 'Compliment', desc: 'Start with praise' },
  ];

  const generate = async () => {
    if (!selectedLead) { toast.error('Select a lead'); return; }
    setGenerating(true);
    try {
      const result = await openRouterAI.callAI([{ role: 'user', content: `Write a ${style} cold email to ${selectedLead.businessName} (${selectedLead.industry} in ${selectedLead.city}). Angle: ${angle}. Keep under 150 words. Return JSON: {"subject":"Subject","body":"Email body","hook":"Opening hook"}` }]);
      setGenerated(result?.subject ? result : { subject: `Quick idea for ${selectedLead.businessName}`, body: `Hi ${selectedLead.contactName || 'there'},\n\nI noticed ${selectedLead.businessName} and wanted to reach out...`, hook: 'Personalized opening' });
      setHistory(prev => [{ id: Date.now(), lead: selectedLead.businessName, style, angle, date: new Date().toISOString() }, ...prev].slice(0, 20));
      toast.success('Email generated!');
    } catch { toast.error('Generation failed'); }
    finally { setGenerating(false); }
  };

  const copyEmail = () => { navigator.clipboard.writeText(`Subject: ${generated.subject}\n\n${generated.body}`); toast.success('Copied!'); };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><h1 className="text-2xl font-bold">📧 Cold Email Personalizer</h1><p className="text-sm text-gray-500">AI-powered personalized cold emails</p></div>
        <button onClick={generate} disabled={generating||!selectedLead} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{generating?'⏳':'✨ Generate'}</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4"><h3 className="font-semibold text-sm mb-3">👤 Lead</h3><select value={selectedLead?.id||''} onChange={e=>setSelectedLead(leads.find(l=>l.id==e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Select lead...</option>{leads.slice(0,50).map(l=><option key={l.id} value={l.id}>{l.businessName}</option>)}</select></div>
          <div className="bg-white rounded-xl shadow-sm border p-4"><h3 className="font-semibold text-sm mb-3">🎨 Style</h3><div className="flex flex-wrap gap-2">{styles.map(s=><button key={s} onClick={()=>setStyle(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${style===s?'bg-purple-100 text-purple-700 border border-purple-300':'bg-gray-100'}`}>{s}</button>)}</div></div>
          <div className="bg-white rounded-xl shadow-sm border p-4"><h3 className="font-semibold text-sm mb-3">🎯 Angle</h3>{angles.map(a=><button key={a.id} onClick={()=>setAngle(a.id)} className={`w-full text-left p-3 rounded-lg mb-1 text-sm ${angle===a.id?'bg-purple-50 border-2 border-purple-300':'bg-gray-50 hover:bg-gray-100'}`}><span className="font-medium">{a.label}</span><span className="text-xs text-gray-500 ml-2">{a.desc}</span></button>)}</div>
        </div>
        <div className="lg:col-span-2">
          {generated ? (
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex justify-between"><h3 className="font-semibold">📧 Generated Email</h3><button onClick={copyEmail} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs">📋 Copy</button></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Subject:</p><p className="text-sm font-medium">{generated.subject}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Hook:</p><p className="text-sm text-purple-700">{generated.hook}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-sm whitespace-pre-wrap text-gray-700">{generated.body}</p></div>
              <div className="flex gap-2"><button onClick={generate} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs">🔄 Regenerate</button></div>
            </div>
          ) : <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p className="text-4xl mb-3">📧</p><p>Select lead and generate</p></div>}
        </div>
      </div>
    </div>
  );
}