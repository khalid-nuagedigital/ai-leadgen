import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';
import toast from 'react-hot-toast';

export default function FollowUpAgent() {
  const { leads, updateLead } = useLeadStore();
  const [autoMode, setAutoMode] = useState(false);

  const needsFollowUp = leads.filter(l => 
    l.status === 'outreached' && (l.touchCount || 0) < 4
  );

  useEffect(() => {
    let interval;
    if (autoMode && needsFollowUp.length > 0) {
      interval = setInterval(() => {
        const next = needsFollowUp[0];
        if (next) sendFollowUp(next);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoMode, needsFollowUp.length]);

  const sendFollowUp = (lead) => {
    const touchCount = (lead.touchCount || 0) + 1;
    const sequences = ['Follow-up #1', 'Case Study', 'Final Attempt', 'Re-engagement'];
    
    setTimeout(() => {
      updateLead(lead.id, {
        touchCount: touchCount,
        lastTouchAt: new Date().toISOString(),
        status: touchCount >= 4 ? 'nurturing' : 'outreached',
      });
      toast.success(`🔄 Follow-up ${touchCount} sent to ${lead.businessName}`);
    }, 500);
  };

  const sendAll = () => {
    needsFollowUp.forEach(lead => sendFollowUp(lead));
    toast.success('All follow-ups sent!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🔄 Follow-Up Agent</h1>
          <p className="text-gray-500 mt-1">Automated follow-up sequences.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAutoMode(!autoMode)} className={`px-4 py-2 rounded-lg text-sm font-medium ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={sendAll} disabled={needsFollowUp.length === 0} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium">
            ⚡ Send All ({needsFollowUp.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(touch => (
          <div key={touch} className="bg-white rounded-xl shadow-sm p-4 border text-center">
            <div className="text-2xl font-bold text-orange-600">{leads.filter(l => l.touchCount === touch).length}</div>
            <div className="text-xs text-gray-500">Touch #{touch}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-semibold mb-3">📋 Needs Follow-up ({needsFollowUp.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {needsFollowUp.map(lead => (
            <div key={lead.id} className="p-3 border rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{lead.businessName}</div>
                <div className="text-xs text-gray-500">Touches: {lead.touchCount || 0} • Next: Day {(lead.touchCount || 0) * 3 + 1}</div>
              </div>
              <button onClick={() => sendFollowUp(lead)} className="px-3 py-1 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700">
                Send
              </button>
            </div>
          ))}
          {needsFollowUp.length === 0 && <p className="text-gray-400 text-center py-8">No follow-ups needed</p>}
        </div>
      </div>
    </div>
  );
}
