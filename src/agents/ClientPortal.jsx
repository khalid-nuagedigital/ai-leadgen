import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import toast from 'react-hot-toast';

export default function ClientPortal() {
  const { leads } = useLeadStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const convertedLeads = leads.filter(l => l.status === 'converted' || l.status === 'meeting_booked');

  const clientData = selectedLead ? {
    projects: [{ name: 'Website Redesign', progress: 75, status: 'In Progress' }, { name: 'SEO Campaign', progress: 40, status: 'Active' }, { name: 'Social Media', progress: 90, status: 'Almost Done' }],
    invoices: [{ id: 'INV-001', amount: '$1,500', status: 'Paid', date: '2024-01-15' }, { id: 'INV-002', amount: '$2,300', status: 'Pending', date: '2024-02-01' }],
    meetings: [{ date: '2024-02-15', time: '10:00 AM', topic: 'Monthly Review' }, { date: '2024-02-28', time: '2:00 PM', topic: 'Strategy Planning' }],
    documents: [{ name: 'Contract.pdf', size: '245KB' }, { name: 'Proposal.pdf', size: '1.2MB' }, { name: 'Report-Jan.pdf', size: '890KB' }],
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><h1 className="text-2xl font-bold">👥 Client Portal</h1><p className="text-sm text-gray-500">Manage client projects & communications</p></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4"><h3 className="font-semibold text-sm mb-3">👤 Client</h3><select value={selectedLead?.id||''} onChange={e=>setSelectedLead(convertedLeads.find(l=>l.id==e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Select client...</option>{convertedLeads.map(l=><option key={l.id} value={l.id}>{l.businessName}</option>)}</select></div>
          {selectedLead && (
            <div className="bg-white rounded-xl shadow-sm border p-4"><h3 className="font-semibold text-sm mb-3">📋 Quick Links</h3>
              {['overview','projects','invoices','meetings','documents'].map(tab=>(<button key={tab} onClick={()=>setActiveTab(tab)} className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 capitalize ${activeTab===tab?'bg-purple-50 text-purple-700 font-medium':'text-gray-600 hover:bg-gray-50'}`}>{tab}</button>))}</div>
          )}
        </div>
        <div className="lg:col-span-3">
          {clientData ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4"><div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🏢</div><div><h2 className="text-xl font-bold">{selectedLead.businessName}</h2><p className="text-sm text-gray-500">{selectedLead.industry} • {selectedLead.city}</p></div></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl text-center"><div className="text-2xl font-bold">{clientData.projects.length}</div><div className="text-xs text-gray-500">Active Projects</div></div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center"><div className="text-2xl font-bold">{clientData.invoices.length}</div><div className="text-xs text-gray-500">Invoices</div></div>
                    <div className="p-4 bg-gray-50 rounded-xl text-center"><div className="text-2xl font-bold">{clientData.meetings.length}</div><div className="text-xs text-gray-500">Upcoming Meetings</div></div>
                  </div>
                </div>
              )}
              {activeTab === 'projects' && clientData.projects.map((p,i)=>(<div key={i} className="p-4 border rounded-lg mb-2"><div className="flex justify-between mb-2"><span className="font-medium">{p.name}</span><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{p.status}</span></div><div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-purple-600 h-2 rounded-full" style={{width:`${p.progress}%`}} /></div><span className="text-xs text-gray-500 mt-1">{p.progress}%</span></div>))}
              {activeTab === 'invoices' && <table className="w-full text-sm"><thead><tr className="bg-gray-50"><th className="p-2 text-left">Invoice</th><th className="p-2 text-left">Amount</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Date</th></tr></thead><tbody>{clientData.invoices.map((inv,i)=>(<tr key={i} className="border-t"><td className="p-2">{inv.id}</td><td className="p-2 font-medium">{inv.amount}</td><td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs ${inv.status==='Paid'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}`}>{inv.status}</span></td><td className="p-2 text-gray-500">{inv.date}</td></tr>))}</tbody></table>}
              {activeTab === 'meetings' && clientData.meetings.map((m,i)=>(<div key={i} className="p-3 bg-gray-50 rounded-lg mb-2 flex justify-between"><div><span className="font-medium text-sm">{m.topic}</span><p className="text-xs text-gray-500">{m.date} at {m.time}</p></div><button className="text-xs text-blue-600">Join</button></div>))}
              {activeTab === 'documents' && clientData.documents.map((d,i)=>(<div key={i} className="p-3 bg-gray-50 rounded-lg mb-2 flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-lg">📄</span><div><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-gray-500">{d.size}</p></div></div><button className="text-xs text-blue-600">Download</button></div>))}
            </div>
          ) : <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p className="text-4xl mb-3">👥</p><p>Select a client to view their portal</p></div>}
        </div>
      </div>
    </div>
  );
}