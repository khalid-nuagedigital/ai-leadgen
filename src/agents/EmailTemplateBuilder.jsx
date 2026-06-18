import React, { useState } from 'react';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

export default function EmailTemplateBuilder() {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('marketing');
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Welcome Email', subject: 'Welcome to {{company}}!', body: 'Hi {{name}},\n\nWelcome aboard! We\'re excited to have you.\n\nBest,\nTeam', category: 'onboarding' },
    { id: 2, name: 'Follow-up', subject: 'Following up - {{company}}', body: 'Hi {{name}},\n\nJust checking in.\n\nBest,\nTeam', category: 'follow-up' },
  ]);
  const [previewLead, setPreviewLead] = useState({ businessName: 'ABC Corp', contactName: 'John', industry: 'Tech' });

  const generateTemplate = async () => {
    if (!name) { toast.error('Enter template name'); return; }
    try {
      const result = await openRouterAI.callAI([{ role: 'user', content: `Create an email template named "${name}" for ${category}. Return JSON: {"subject":"Subject with {{variables}}","body":"Body with {{variables}}"}` }]);
      if (result?.subject) { setSubject(result.subject); setBody(result.body); toast.success('Template generated!'); }
    } catch { setSubject('Hello {{name}}'); setBody('Hi {{name}},\n\nWe have an offer for {{company}}.\n\nBest,\nTeam'); }
  };

  const saveTemplate = () => {
    if (!name || !subject || !body) { toast.error('Fill all fields'); return; }
    setTemplates(prev => [{ id: Date.now(), name, subject, body, category }, ...prev]);
    toast.success('Template saved!');
  };

  const preview = (t) => {
    return { subject: t.subject.replace(/\{\{(\w+)\}\}/g, (_, k) => previewLead[k] || k), body: t.body.replace(/\{\{(\w+)\}\}/g, (_, k) => previewLead[k] || k) };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><h1 className="text-2xl font-bold">📧 Email Template Builder</h1><p className="text-sm text-gray-500">Create reusable email templates</p></div>
        <button onClick={saveTemplate} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium">💾 Save Template</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
            <div><label className="text-xs">Template Name</label><input value={name} onChange={e=>setName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs">Category</label><select value={category} onChange={e=>setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1"><option value="marketing">Marketing</option><option value="follow-up">Follow-up</option><option value="onboarding">Onboarding</option><option value="transactional">Transactional</option></select></div>
            <button onClick={generateTemplate} className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm">✨ AI Generate</button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">Preview Data</h3>
            <input value={previewLead.businessName} onChange={e=>setPreviewLead({...previewLead,businessName:e.target.value})} placeholder="Company" className="w-full px-3 py-2 border rounded-lg text-sm mb-2" />
            <input value={previewLead.contactName} onChange={e=>setPreviewLead({...previewLead,contactName:e.target.value})} placeholder="Name" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <div><label className="text-xs font-medium">Subject</label><input value={subject} onChange={e=>setSubject(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
            <div><label className="text-xs font-medium">Body (use {'{{'}variables{'}}'})</label><textarea value={body} onChange={e=>setBody(e.target.value)} rows="10" className="w-full px-3 py-2 border rounded-lg text-sm mt-1 resize-none" /></div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <p className="text-sm font-medium">{subject.replace(/\{\{(\w+)\}\}/g, (_,k)=>previewLead[k]||k)}</p>
              <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{body.replace(/\{\{(\w+)\}\}/g, (_,k)=>previewLead[k]||k)}</p>
            </div>
          </div>
        </div>
      </div>
      {templates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">📚 Saved Templates ({templates.length})</h3>
          <div className="grid grid-cols-2 gap-3">{templates.map(t=>{const p=preview(t);return(<div key={t.id} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={()=>{setName(t.name);setSubject(t.subject);setBody(t.body);setCategory(t.category);}}><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-gray-500">{p.subject}</p><span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{t.category}</span></div>)})}</div>
        </div>
      )}
    </div>
  );
}