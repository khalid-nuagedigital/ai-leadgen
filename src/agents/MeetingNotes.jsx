import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

export default function MeetingNotes() {
  const { leads } = useLeadStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState([]);
  const [nextDate, setNextDate] = useState('');
  const [attendees, setAttendees] = useState('');
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);

  const meetingLeads = leads.filter(l => l.status === 'meeting_booked' || l.status === 'converted');

  const generateSummary = async () => {
    if (!notes) { toast.error('Enter notes first'); return; }
    setGenerating(true);
    try {
      const result = await openRouterAI.callAI([{ role: 'user', content: `Summarize these meeting notes and extract action items. Notes: "${notes}". Return JSON: {"summary":"Brief summary","actionItems":["Task 1","Task 2"],"tone":"positive/neutral/negative"}` }]);
      if (result?.actionItems) { setActionItems(result.actionItems); toast.success('Summary generated!'); }
    } catch { setActionItems(['Follow up on discussed points', 'Send proposal', 'Schedule next meeting']); }
    finally { setGenerating(false); }
  };

  const saveMeeting = () => {
    if (!selectedLead) { toast.error('Select a lead'); return; }
    const meeting = { id: Date.now(), lead: selectedLead.businessName, notes, actionItems, nextDate, attendees, date: new Date().toISOString() };
    setHistory(prev => [meeting, ...prev]);
    toast.success('Meeting saved!');
    setNotes(''); setActionItems([]);
  };

  const downloadNotes = () => {
    if (!notes) return;
    const text = `MEETING NOTES\n${'='.repeat(40)}\nClient: ${selectedLead?.businessName||'N/A'}\nDate: ${new Date().toLocaleDateString()}\nAttendees: ${attendees}\n\nNOTES:\n${notes}\n\nACTION ITEMS:\n${actionItems.map((a,i)=>`${i+1}. ${a}`).join('\n')}\n\nNext Meeting: ${nextDate||'TBD'}`;
    const blob = new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`Meeting-${selectedLead?.businessName||'notes'}.txt`; a.click(); toast.success('Downloaded!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between"><div><h1 className="text-2xl font-bold">📝 Meeting Notes</h1><p className="text-sm text-gray-500">Capture & summarize meetings</p></div>
        <div className="flex gap-2"><button onClick={generateSummary} disabled={generating||!notes} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium disabled:opacity-50">{generating?'⏳':'🤖 Summarize'}</button><button onClick={saveMeeting} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium">💾 Save</button><button onClick={downloadNotes} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium">📥 Download</button></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4"><h3 className="font-semibold text-sm mb-3">👤 Client</h3><select value={selectedLead?.id||''} onChange={e=>setSelectedLead(meetingLeads.find(l=>l.id==e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm"><option value="">Select client...</option>{meetingLeads.map(l=><option key={l.id} value={l.id}>{l.businessName}</option>)}</select></div>
          <div className="bg-white rounded-xl shadow-sm border p-4"><label className="text-xs">Attendees</label><input value={attendees} onChange={e=>setAttendees(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
          <div className="bg-white rounded-xl shadow-sm border p-4"><label className="text-xs">Next Meeting</label><input type="date" value={nextDate} onChange={e=>setNextDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" /></div>
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows="8" placeholder="Type your meeting notes here..." className="w-full px-4 py-3 border rounded-xl text-sm resize-none" />
            {actionItems.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-xl"><h4 className="font-semibold text-sm text-purple-700 mb-2">✅ Action Items</h4>
                {actionItems.map((item,i)=>(<div key={i} className="flex items-center gap-2 text-sm text-purple-800 mb-1"><input type="checkbox" className="rounded" /><span>{item}</span></div>))}</div>
            )}
          </div>
        </div>
      </div>
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6"><h3 className="font-semibold mb-4">📚 History ({history.length})</h3><div className="space-y-2">{history.map(h=>(<div key={h.id} className="p-3 bg-gray-50 rounded-lg"><div className="flex justify-between"><span className="font-medium text-sm">{h.lead}</span><span className="text-xs text-gray-500">{new Date(h.date).toLocaleDateString()}</span></div><p className="text-xs text-gray-600 mt-1">{h.notes?.substring(0,100)}...</p></div>))}</div></div>
      )}
    </div>
  );
}