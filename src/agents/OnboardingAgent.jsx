import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import toast from 'react-hot-toast';

export default function OnboardingAgent() {
  const { leads, updateLead } = useLeadStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [step, setStep] = useState(1);
  const [checklist, setChecklist] = useState([
    { id: 1, task: 'Send welcome email', done: false },
    { id: 2, task: 'Schedule kickoff call', done: false },
    { id: 3, task: 'Collect client requirements', done: false },
    { id: 4, task: 'Set up project in system', done: false },
    { id: 5, task: 'Assign account manager', done: false },
    { id: 6, task: 'Create project timeline', done: false },
    { id: 7, task: 'Send login credentials', done: false },
    { id: 8, task: 'Schedule first review', done: false },
  ]);

  const convertedLeads = leads.filter(l => l.status === 'converted' || l.status === 'meeting_booked');
  const progress = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);

  const toggleTask = (id) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
    if (selectedLead) updateLead(selectedLead.id, { onboardingProgress: progress });
  };

  const sendReminder = () => {
    toast.success(`📧 Reminder sent to ${selectedLead?.businessName || 'client'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><h1 className="text-2xl font-bold">🚀 Client Onboarding</h1><p className="text-sm text-gray-500">Streamline new client setup</p></div>
        <button onClick={sendReminder} disabled={!selectedLead} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">📧 Send Reminder</button></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">👤 Client</h3>
            <select value={selectedLead?.id||''} onChange={e=>setSelectedLead(convertedLeads.find(l=>l.id==e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Select client...</option>{convertedLeads.map(l=><option key={l.id} value={l.id}>{l.businessName}</option>)}</select>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{progress}%</div>
            <div className="text-xs text-gray-500">Complete</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-purple-600 h-2 rounded-full transition-all" style={{width:`${progress}%`}} /></div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-semibold mb-4">✅ Onboarding Checklist</h3>
            <div className="space-y-2">
              {checklist.map(item => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${item.done ? 'bg-green-50 border-green-200' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={()=>toggleTask(item.id)}>
                  <div className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${item.done?'bg-green-500 border-green-500 text-white':'border-gray-300'}`}>{item.done?'✓':''}</div><span className={`text-sm ${item.done?'text-green-700 line-through':'text-gray-700'}`}>{item.task}</span></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.done?'bg-green-100 text-green-700':'bg-gray-200 text-gray-500'}`}>{item.done?'Done':'Pending'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}