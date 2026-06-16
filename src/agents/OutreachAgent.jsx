import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';
import toast from 'react-hot-toast';

export default function OutreachAgent() {
  const { leads, updateLead } = useLeadStore();
  const [autoMode, setAutoMode] = useState(false);
  const [sending, setSending] = useState(null);

  const readyLeads = leads.filter(l => l.status === 'analyzed' && l.personalizedOffer);
  const outreached = leads.filter(l => l.status === 'outreached');

  useEffect(() => {
    let interval;
    if (autoMode && readyLeads.length > 0) {
      interval = setInterval(() => {
        const next = readyLeads[0];
        if (next) sendOutreach(next);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [autoMode, readyLeads.length]);

  const sendOutreach = (lead) => {
    setSending(lead.id);
    setTimeout(() => {
      updateLead(lead.id, {
        status: 'outreached',
        outreachChannel: 'email',
        firstEmailSentAt: new Date().toISOString(),
        lastTouchAt: new Date().toISOString(),
        touchCount: 1,
      });
      setSending(null);
      if (!autoMode) toast.success(`📧 Outreach sent to ${lead.businessName}`);
    }, 800);
  };

  const sendAll = async () => {
    for (const lead of readyLeads) {
      await new Promise(r => setTimeout(r, 500));
      sendOutreach(lead);
    }
    toast.success('All outreach sent!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📧 Outreach Agent</h1>
          <p className="text-gray-500 mt-1">Send personalized outreach to analyzed leads.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAutoMode(!autoMode)} className={`px-4 py-2 rounded-lg text-sm font-medium ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={sendAll} disabled={readyLeads.length === 0} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium">
            ⚡ Send All ({readyLeads.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-blue-600">{readyLeads.length}</div>
          <div className="text-xs text-gray-500">Ready to Send</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-indigo-600">{outreached.length}</div>
          <div className="text-xs text-gray-500">Outreached</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'replied').length}</div>
          <div className="text-xs text-gray-500">Replied</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-3">📋 Outreached Leads ({outreached.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {outreached.map(lead => (
            <div key={lead.id} className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{lead.businessName}</div>
                <div className="text-xs text-gray-500">{lead.email} • Touches: {lead.touchCount}</div>
              </div>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">Sent</span>
            </div>
          ))}
          {outreached.length === 0 && <p className="text-gray-400 text-center py-8">No outreach sent yet</p>}
        </div>
      </div>
    </div>
  );
}
