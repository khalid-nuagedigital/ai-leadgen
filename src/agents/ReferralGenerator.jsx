import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

const TEMPLATES = [
  { id: 'email', label: 'Email', icon: '📧', desc: 'Professional email request' },
  { id: 'sms', label: 'SMS/Text', icon: '📱', desc: 'Quick text message' },
  { id: 'social', label: 'Social DM', icon: '💬', desc: 'Direct message template' },
  { id: 'call', label: 'Phone Script', icon: '📞', desc: 'Call conversation guide' },
  { id: 'inperson', label: 'In-Person', icon: '🤝', desc: 'Face-to-face script' },
];

const INCENTIVES = [
  { id: 'discount10', label: '10% Discount', desc: 'On next service' },
  { id: 'discount20', label: '20% Discount', desc: 'On next service' },
  { id: 'cash50', label: '$50 Credit', desc: 'Account credit' },
  { id: 'cash100', label: '$100 Credit', desc: 'Account credit' },
  { id: 'freeMonth', label: 'Free Month', desc: '1 month free service' },
  { id: 'giftCard', label: 'Gift Card', desc: '$50 Amazon card' },
  { id: 'custom', label: 'Custom', desc: 'Your own incentive' },
];

export default function ReferralGenerator() {
  const { leads } = useLeadStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [template, setTemplate] = useState('email');
  const [incentive, setIncentive] = useState('discount10');
  const [customIncentive, setCustomIncentive] = useState('');
  const [generated, setGenerated] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ sent: 0, referrals: 0, converted: 0 });

  const convertedLeads = leads.filter(l => l.status === 'converted' || l.status === 'meeting_booked');

  const getIncentiveText = () => {
    if (incentive === 'custom') return customIncentive || 'special reward';
    return INCENTIVES.find(i => i.id === incentive)?.label || 'reward';
  };

  const generate = async () => {
    if (!selectedLead) { toast.error('Select a client first'); return; }
    setGenerating(true);
    try {
      const result = await openRouterAI.callAI([{ 
        role: 'user', 
        content: `Write a ${TEMPLATES.find(t=>t.id===template)?.label} referral request for ${selectedLead.businessName} (${selectedLead.industry}). Incentive: ${getIncentiveText()}. Make it warm, genuine, and not pushy. Return JSON: {"subject":"Subject line","body":"Full message body","followUp":"Follow-up message if no response after 1 week"}` 
      }]);
      setGenerated(result?.subject ? result : {
        subject: `Help us grow, ${selectedLead.contactName || 'friend'}!`,
        body: `Hi ${selectedLead.contactName || 'there'},\n\nWe've loved working with ${selectedLead.businessName} and wanted to reach out. If you know any other ${selectedLead.industry} businesses that could benefit from our services, we'd be grateful for the introduction.\n\nAs a thank you, we're offering ${getIncentiveText()} for every successful referral.\n\nNo pressure at all - just wanted to put it on your radar!\n\nThanks,\nNuage Digital Team`,
        followUp: `Hi again! Just a friendly follow-up on my previous message. If you think of anyone who might need our services, we'd love to help them too. Remember, ${getIncentiveText()} awaits! 😊`,
      });
      setHistory(prev => [{ id: Date.now(), client: selectedLead.businessName, template, incentive: getIncentiveText(), date: new Date().toISOString() }, ...prev].slice(0, 20));
      setStats(prev => ({ ...prev, sent: prev.sent + 1 }));
      toast.success('Referral request generated!');
    } catch {
      setGenerated({ subject: 'Help us grow!', body: `Hi,\n\nWe'd love referrals! ${getIncentiveText()} as thanks.`, followUp: 'Just checking in!' });
    } finally { setGenerating(false); }
  };

  const copyAll = () => {
    if (!generated) return;
    navigator.clipboard.writeText(`${generated.subject}\n\n${generated.body}`);
    toast.success('Copied!');
  };

  const downloadAll = () => {
    if (!generated) return;
    const text = `REFERRAL REQUEST\n${'='.repeat(40)}\nTo: ${selectedLead?.businessName}\nTemplate: ${TEMPLATES.find(t=>t.id===template)?.label}\nIncentive: ${getIncentiveText()}\n\nSUBJECT: ${generated.subject}\n\nBODY:\n${generated.body}\n\nFOLLOW-UP:\n${generated.followUp}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Referral-${selectedLead?.businessName}.txt`; a.click();
    toast.success('Downloaded!');
  };

  const addReferral = () => setStats(prev => ({ ...prev, referrals: prev.referrals + 1 }));
  const addConversion = () => { setStats(prev => ({ ...prev, converted: prev.converted + 1 })); toast.success('🎉 Referral converted!'); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">🔗 Referral Generator</h1><p className="text-sm text-gray-500">Generate referral requests & track results</p></div>
        <div className="flex gap-2">
          {generated && <button onClick={downloadAll} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs">📥 Download</button>}
          <button onClick={generate} disabled={generating || !selectedLead} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">{generating ? '⏳...' : '✨ Generate'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">👤 Client</h3>
            <select value={selectedLead?.id || ''} onChange={e => setSelectedLead(convertedLeads.find(l => l.id == e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
              <option value="">Select client...</option>
              {convertedLeads.map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">📋 Template</h3>
            <div className="space-y-1.5">{TEMPLATES.map(t => (
              <button key={t.id} onClick={() => setTemplate(t.id)} className={`w-full p-2.5 rounded-lg text-left text-sm ${template===t.id?'bg-green-50 border-2 border-green-300':'bg-gray-50 hover:bg-gray-100'}`}>
                <span className="font-medium">{t.icon} {t.label}</span><span className="text-xs text-gray-500 ml-2">{t.desc}</span>
              </button>
            ))}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">🎁 Incentive</h3>
            <div className="space-y-1.5">{INCENTIVES.map(inc => (
              <button key={inc.id} onClick={() => setIncentive(inc.id)} className={`w-full p-2.5 rounded-lg text-left text-sm ${incentive===inc.id?'bg-yellow-50 border-2 border-yellow-300':'bg-gray-50 hover:bg-gray-100'}`}>
                <span className="font-medium">{inc.label}</span><span className="text-xs text-gray-500 ml-2">{inc.desc}</span>
              </button>
            ))}</div>
            {incentive === 'custom' && <input type="text" value={customIncentive} onChange={e => setCustomIncentive(e.target.value)} placeholder="Describe your incentive" className="w-full px-3 py-2 border rounded-lg text-sm mt-2" />}
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">📊 Stats</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-gray-50 rounded-lg text-center"><div className="text-xl font-bold">{stats.sent}</div><div className="text-[10px] text-gray-500">Sent</div></div>
              <div className="p-3 bg-gray-50 rounded-lg text-center"><div className="text-xl font-bold">{stats.referrals}</div><div className="text-[10px] text-gray-500">Referrals</div></div>
              <div className="p-3 bg-gray-50 rounded-lg text-center"><div className="text-xl font-bold">{stats.converted}</div><div className="text-[10px] text-gray-500">Won</div></div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addReferral} className="flex-1 px-2 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs">+ Referral</button>
              <button onClick={addConversion} className="flex-1 px-2 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs">+ Conversion</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {generated ? (
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">📧 {generated.subject}</h3>
                <button onClick={copyAll} className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs">📋 Copy</button>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl"><p className="text-sm text-gray-700 whitespace-pre-wrap">{generated.body}</p></div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">🔄 Follow-up (1 week later)</h4>
                <div className="p-4 bg-blue-50 rounded-xl"><p className="text-sm text-blue-700 whitespace-pre-wrap">{generated.followUp}</p></div>
              </div>
              <button onClick={() => { setStats(prev => ({ ...prev, sent: prev.sent + 1 })); toast.success('Marked as sent!'); }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">✅ Mark as Sent</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400"><p className="text-4xl mb-3">🔗</p><p>Select a client and generate a referral request</p></div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-3">📋 History ({history.length})</h3>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left py-2 px-3 text-xs text-gray-500">Client</th><th className="text-left py-2 px-3 text-xs text-gray-500">Template</th><th className="text-left py-2 px-3 text-xs text-gray-500">Incentive</th><th className="text-left py-2 px-3 text-xs text-gray-500">Date</th></tr></thead><tbody className="divide-y">{history.map(h=>(<tr key={h.id} className="hover:bg-gray-50"><td className="py-2 px-3 font-medium text-xs">{h.client}</td><td className="py-2 px-3 text-xs">{h.template}</td><td className="py-2 px-3 text-xs">{h.incentive}</td><td className="py-2 px-3 text-xs text-gray-500">{new Date(h.date).toLocaleDateString()}</td></tr>))}</tbody></table></div>
        </div>
      )}
    </div>
  );
}