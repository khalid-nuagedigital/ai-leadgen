import React, { useState } from 'react';
import { emailService } from '../services/emailService';
import toast from 'react-hot-toast';

export default function EmailConfig() {
  const [rules, setRules] = useState(emailService.autoReplyRules || []);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({ keywords: '', reply: '' });
  const [sentEmails, setSentEmails] = useState(emailService.getSentEmails ? emailService.getSentEmails() : []);
  const [analytics, setAnalytics] = useState(emailService.getAnalytics ? emailService.getAnalytics() : { totalSent: 0, opened: 0, replied: 0, replyRate: 0 });
  const [activeTab, setActiveTab] = useState('rules');

  const handleAddRule = () => {
    if (!newRule.keywords || !newRule.reply) { toast.error('Please fill all fields'); return; }
    const rule = { id: `rule_${Date.now()}`, keywords: newRule.keywords.split(',').map(k => k.trim().toLowerCase()), reply: newRule.reply };
    const updatedRules = [...rules, rule];
    setRules(updatedRules);
    if (emailService.autoReplyRules) emailService.autoReplyRules.push(rule);
    setNewRule({ keywords: '', reply: '' });
    setShowAddRule(false);
    toast.success('Auto-reply rule added!');
  };

  const handleDeleteRule = (ruleId) => {
    const updatedRules = rules.filter(r => r.id !== ruleId);
    setRules(updatedRules);
    if (emailService.autoReplyRules) emailService.autoReplyRules = updatedRules;
    toast.success('Rule deleted');
  };

  const handleSimulateReply = async (emailId) => {
    const replies = ['Yes, I am interested! Tell me more.', 'What are your prices?', 'Not interested, please remove me.', 'Can you send more details?', 'Let us schedule a call.'];
    const reply = replies[Math.floor(Math.random() * replies.length)];
    if (emailService.simulateReply) await emailService.simulateReply(emailId, reply);
    if (emailService.getSentEmails) setSentEmails(emailService.getSentEmails());
    if (emailService.getAnalytics) setAnalytics(emailService.getAnalytics());
    toast.success('Simulated reply received!');
  };

  const handleSimulateOpen = async (emailId) => {
    if (emailService.simulateOpen) await emailService.simulateOpen(emailId);
    if (emailService.getSentEmails) setSentEmails(emailService.getSentEmails());
    if (emailService.getAnalytics) setAnalytics(emailService.getAnalytics());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📧 Email Configuration</h1>
          <p className="text-sm text-gray-500">Configure auto-reply rules and view email analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: analytics.totalSent || 0, color: 'blue' },
          { label: 'Opened', value: analytics.opened || 0, color: 'green' },
          { label: 'Replied', value: analytics.replied || 0, color: 'purple' },
          { label: 'Reply Rate', value: `${analytics.replyRate || 0}%`, color: 'orange' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border text-center">
            <div className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-b pb-2">
        {[
          { id: 'rules', label: '⚡ Auto-Reply Rules' },
          { id: 'emails', label: '📧 Sent Emails' },
          { id: 'templates', label: '📝 Templates' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Auto-Reply Rules</h3>
              <button onClick={() => setShowAddRule(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">+ Add Rule</button>
            </div>
            {showAddRule && (
              <div className="p-4 bg-blue-50 rounded-xl space-y-3">
                <div><label className="block text-sm font-medium mb-1">Keywords (comma separated)</label><input type="text" value={newRule.keywords} onChange={e => setNewRule({...newRule, keywords: e.target.value})} placeholder="interested, yes, tell me more" className="w-full px-4 py-2 border rounded-lg text-sm" /></div>
                <div><label className="block text-sm font-medium mb-1">Auto-Reply Message</label><textarea value={newRule.reply} onChange={e => setNewRule({...newRule, reply: e.target.value})} rows="3" className="w-full px-4 py-2 border rounded-lg text-sm resize-none" /></div>
                <div className="flex gap-2"><button onClick={handleAddRule} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Save Rule</button><button onClick={() => setShowAddRule(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button></div>
              </div>
            )}
            <div className="space-y-3">
              {rules.map(rule => (
                <div key={rule.id} className="p-4 border rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1 mb-2">{rule.keywords.map((kw, i) => (<span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{kw}</span>))}</div>
                      <p className="text-sm text-gray-700">{rule.reply.substring(0, 150)}...</p>
                    </div>
                    <button onClick={() => handleDeleteRule(rule.id)} className="text-red-500 hover:text-red-700 text-sm ml-3">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'emails' && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sentEmails.length === 0 ? <p className="text-gray-400 text-center py-8">No emails sent yet</p> : sentEmails.map(email => (
              <div key={email.id} className={`p-4 border rounded-lg ${email.replied ? 'border-green-200 bg-green-50' : email.opened ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{email.subject}</span><span className={`px-2 py-0.5 text-xs rounded-full ${email.replied ? 'bg-green-100 text-green-700' : email.opened ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{email.replied ? '✅ Replied' : email.opened ? '👁️ Opened' : '📤 Sent'}</span></div>
                <p className="text-xs text-gray-500">To: {email.to} • {new Date(email.sentAt).toLocaleString()}</p>
                {email.replyText && <p className="text-xs text-green-700 mt-2 bg-white p-2 rounded">💬 Reply: {email.replyText}</p>}
                <div className="flex gap-2 mt-2">
                  {!email.opened && <button onClick={() => handleSimulateOpen(email.id)} className="text-xs text-blue-600 hover:underline">Simulate Open</button>}
                  {!email.replied && <button onClick={() => handleSimulateReply(email.id)} className="text-xs text-green-600 hover:underline">Simulate Reply</button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(emailService.getTemplates ? emailService.getTemplates() : []).map(template => (
              <div key={template.id} className="p-4 border rounded-xl">
                <div className="flex items-center justify-between mb-2"><h4 className="font-semibold text-sm">{template.name}</h4><span className="px-2 py-0.5 bg-gray-100 rounded-full text-[10px] capitalize">{template.category}</span></div>
                <p className="text-xs text-gray-600 mb-2"><strong>Subject:</strong> {template.subject}</p>
                <p className="text-xs text-gray-500 line-clamp-3">{template.body.substring(0, 150)}...</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
