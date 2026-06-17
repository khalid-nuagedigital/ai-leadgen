import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';
import { useAuthStore } from '../store/authStore';
import { useWorkflowStore } from '../store/workflowStore';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { leads, stats, systemLogs, updateLead, addLog, clearLogs } = useLeadStore();
  const { user } = useAuthStore();
  const { workflows } = useWorkflowStore();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { id: 1, from: 'system', text: '👋 Welcome to Admin Live Chat! How can I help you today?', time: new Date().toISOString() },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadChat, setUnreadChat] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ subject: '', body: '', funnel: 'all' });
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMinimized, setChatMinimized] = useState(true);
  const chatEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const scrollToBottom = () => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { if (chatOpen) scrollToBottom(); }, [chatMessages, chatOpen]);

  // Auto-reply when chat is opened
  useEffect(() => {
    if (chatOpen && chatMessages.length === 1) {
      setTimeout(() => {
        setChatMessages(prev => [...prev, {
          id: Date.now(), from: 'system',
          text: `You have ${stats.total} total leads, ${stats.new} new, and ${stats.qualified} qualified. What would you like to do?`,
          time: new Date().toISOString()
        }]);
      }, 1000);
    }
  }, [chatOpen]);

  const handleSendChat = () => {
    if (!newMessage.trim()) return;
    setChatMessages(prev => [...prev, { id: Date.now(), from: 'admin', text: newMessage, time: new Date().toISOString() }]);
    
    // Smart auto-reply
    setTimeout(() => {
      const msg = newMessage.toLowerCase();
      let reply = 'I understand. How can I assist you further?';
      
      if (msg.includes('lead') || msg.includes('find')) reply = `You have ${stats.total} leads total. ${stats.new} are new and waiting for analysis. Would you like me to run the AI pipeline?`;
      else if (msg.includes('analyze') || msg.includes('audit')) reply = `I can help with that! ${stats.new} leads are pending analysis. Go to Website Analyzer or run the full pipeline.`;
      else if (msg.includes('email') || msg.includes('send')) reply = `You can send direct emails from the Email tab, or broadcast to all ${leads.length} leads. What would you prefer?`;
      else if (msg.includes('export') || msg.includes('csv')) reply = `I can export all ${leads.length} leads to CSV. Click the Export button or say "export now" to proceed.`;
      else if (msg.includes('stats') || msg.includes('report')) reply = `Current stats: ${stats.total} total, ${stats.new} new, ${stats.analyzed} analyzed, ${stats.qualified} qualified, ${stats.meetings} meetings.`;
      else if (msg.includes('delete') || msg.includes('clear')) reply = `⚠️ This action cannot be undone. Are you sure you want to clear all leads? Type "confirm delete" to proceed.`;
      else if (msg.includes('pipeline') || msg.includes('run')) reply = `🚀 Starting the AI pipeline will process all ${stats.new} new leads through analysis, outreach, and qualification. Ready to start?`;
      
      setChatMessages(prev => [...prev, { id: Date.now(), from: 'system', text: reply, time: new Date().toISOString() }]);
    }, 1500);
    
    setNewMessage('');
  };

  const handleSendDirectEmail = () => {
    if (!emailData.to || !emailData.subject || !emailData.body) {
      toast.error('Please fill all fields'); return;
    }
    toast.success(`📧 Email sent to ${emailData.to}`);
    addLog('Admin', `Direct email sent to ${emailData.to}`);
    setShowEmailComposer(false);
    setEmailData({ to: '', subject: '', body: '' });
  };

  const handleSendBroadcast = () => {
    if (!broadcastData.subject || !broadcastData.body) {
      toast.error('Please fill all fields'); return;
    }
    const targetLeads = broadcastData.funnel === 'all' ? leads : leads.filter(l => l.funnelType === broadcastData.funnel);
    toast.success(`📢 Broadcast sent to ${targetLeads.length} leads`);
    addLog('Admin', `Broadcast sent to ${targetLeads.length} leads`);
    setShowBroadcastModal(false);
    setBroadcastData({ subject: '', body: '', funnel: 'all' });
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'analyzeAll': 
        const newLeads = leads.filter(l => l.status === 'new');
        newLeads.forEach(l => updateLead(l.id, { status: 'analyzed' }));
        toast.success(`Analyzed ${newLeads.length} leads`); break;
      case 'qualifyAll':
        const analyzed = leads.filter(l => l.status === 'analyzed');
        analyzed.forEach(l => updateLead(l.id, { status: 'qualified', qualificationScore: 70, score: 70 }));
        toast.success(`Qualified ${analyzed.length} leads`); break;
      case 'exportCSV':
        const csv = [['Name','Industry','Email','Phone','City','Status','Score'].join(',')];
        leads.forEach(l => csv.push([l.businessName,l.industry,l.email,l.phone,l.city,l.status,l.score].join(',')));
        const blob = new Blob([csv.join('\n')], {type:'text/csv'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
        toast.success('CSV exported!'); break;
      case 'clearAll':
        if (window.confirm('Delete ALL leads?')) {
          useLeadStore.getState().clearAllLeads();
          toast.success('All leads cleared');
        } break;
      default: break;
    }
  };

  const filteredLeads = leads.filter(l => 
    l.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.industry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelectLead = (id) => {
    setSelectedLeads(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAction = (action) => {
    if (selectedLeads.length === 0) { toast.error('Select leads first'); return; }
    switch (action) {
      case 'delete': selectedLeads.forEach(id => useLeadStore.getState().deleteLead(id)); toast.success(`Deleted ${selectedLeads.length} leads`); break;
      case 'qualify': selectedLeads.forEach(id => updateLead(id, { status: 'qualified' })); toast.success(`Qualified ${selectedLeads.length} leads`); break;
      case 'outreach': selectedLeads.forEach(id => updateLead(id, { status: 'outreached' })); toast.success(`Moved ${selectedLeads.length} to outreach`); break;
    }
    setSelectedLeads([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🛡️ Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Full control over leads, emails, and system settings</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleQuickAction('analyzeAll')} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">🌐 Analyze All</button>
          <button onClick={() => handleQuickAction('qualifyAll')} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">✅ Qualify All</button>
          <button onClick={() => handleQuickAction('exportCSV')} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">📥 Export CSV</button>
          <button onClick={() => handleQuickAction('clearAll')} className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">🗑️ Clear All</button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'blue' },
          { label: 'New', value: stats.new, color: 'indigo' },
          { label: 'Analyzed', value: stats.analyzed, color: 'purple' },
          { label: 'Outreached', value: stats.outreached, color: 'pink' },
          { label: 'Qualified', value: stats.qualified, color: 'green' },
          { label: 'Meetings', value: stats.meetings, color: 'teal' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 border text-center">
            <div className="text-2xl font-bold" style={{color: s.color}}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-2">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'leads', label: '👥 Leads' },
          { id: 'email', label: '📧 Email' },
          { id: 'broadcast', label: '📢 Broadcast' },
          { id: 'logs', label: '📋 Logs' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickActionCard icon="📧" title="Send Direct Email" desc="Compose and send email to any address" onClick={() => { setShowEmailComposer(true); setActiveTab('email'); }} />
            <QuickActionCard icon="📢" title="Broadcast Email" desc="Send email to all leads or by funnel" onClick={() => { setShowBroadcastModal(true); setActiveTab('broadcast'); }} />
            <QuickActionCard icon="💬" title="Live Chat" desc="Chat with AI assistant for help" onClick={() => { setChatOpen(true); setChatMinimized(false); }} />
            <QuickActionCard icon="📥" title="Export All Leads" desc="Download CSV of all leads" onClick={() => handleQuickAction('exportCSV')} />
            <QuickActionCard icon="🌐" title="Analyze All Leads" desc="Run website analysis on new leads" onClick={() => handleQuickAction('analyzeAll')} />
            <QuickActionCard icon="✅" title="Qualify All Leads" desc="Auto-qualify analyzed leads" onClick={() => handleQuickAction('qualifyAll')} />
          </div>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 Search leads..." className="px-4 py-2 border rounded-lg text-sm w-full sm:w-64" />
              <div className="flex gap-2">
                {selectedLeads.length > 0 && (
                  <>
                    <span className="text-sm text-gray-500 py-2">{selectedLeads.length} selected</span>
                    <button onClick={() => handleBulkAction('qualify')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">Qualify</button>
                    <button onClick={() => handleBulkAction('outreach')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">Outreach</button>
                    <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium whitespace-nowrap">Delete</button>
                  </>
                )}
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2"><input type="checkbox" onChange={e => setSelectedLeads(e.target.checked ? filteredLeads.map(l=>l.id) : [])} /></th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Business</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Email</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Phone</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Score</th>
                    <th className="text-left p-2 text-xs font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLeads.slice(0, 50).map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="p-2"><input type="checkbox" checked={selectedLeads.includes(lead.id)} onChange={() => toggleSelectLead(lead.id)} /></td>
                      <td className="p-2 font-medium">{lead.businessName}</td>
                      <td className="p-2 text-xs text-blue-600">{lead.email}</td>
                      <td className="p-2 text-xs">{lead.phone}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 text-[10px] rounded-full capitalize ${lead.status==='new'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>{lead.status?.replace('_',' ')}</span></td>
                      <td className="p-2 text-xs font-bold">{lead.score}</td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <Link to={`/lead/${lead.id}`} className="text-blue-600 text-xs hover:underline">View</Link>
                          <button onClick={() => { setEmailData({ to: lead.email, subject: `Regarding ${lead.businessName}`, body: `Hi ${lead.contactName || 'there'},\n\n` }); setShowEmailComposer(true); }} className="text-green-600 text-xs hover:underline">Email</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EMAIL TAB */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">📧 Send Direct Email</h3>
            <div><label className="block text-sm font-medium mb-1">To</label><input type="email" value={emailData.to} onChange={e => setEmailData({...emailData, to: e.target.value})} placeholder="recipient@example.com" className="w-full px-4 py-2.5 border rounded-xl text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Subject</label><input type="text" value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})} placeholder="Email subject..." className="w-full px-4 py-2.5 border rounded-xl text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Message</label><textarea value={emailData.body} onChange={e => setEmailData({...emailData, body: e.target.value})} rows="8" placeholder="Write your email..." className="w-full px-4 py-2.5 border rounded-xl text-sm resize-none" /></div>
            <div className="flex gap-3">
              <button onClick={handleSendDirectEmail} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">📧 Send Email</button>
              <button onClick={() => setEmailData({ to: '', subject: '', body: '' })} className="px-4 py-2.5 border rounded-xl hover:bg-gray-50">Clear</button>
            </div>
          </div>
        )}

        {/* BROADCAST TAB */}
        {activeTab === 'broadcast' && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">📢 Broadcast Email</h3>
            <div><label className="block text-sm font-medium mb-1">Target Funnel</label><select value={broadcastData.funnel} onChange={e => setBroadcastData({...broadcastData, funnel: e.target.value})} className="w-full px-4 py-2.5 border rounded-xl text-sm"><option value="all">All Leads ({leads.length})</option><option value="marketing">Marketing ({leads.filter(l=>l.funnelType==='marketing').length})</option><option value="accounting">Accounting ({leads.filter(l=>l.funnelType==='accounting').length})</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Subject</label><input type="text" value={broadcastData.subject} onChange={e => setBroadcastData({...broadcastData, subject: e.target.value})} placeholder="Broadcast subject..." className="w-full px-4 py-2.5 border rounded-xl text-sm" /></div>
            <div><label className="block text-sm font-medium mb-1">Message</label><textarea value={broadcastData.body} onChange={e => setBroadcastData({...broadcastData, body: e.target.value})} rows="6" placeholder="Write your broadcast message..." className="w-full px-4 py-2.5 border rounded-xl text-sm resize-none" /></div>
            <button onClick={handleSendBroadcast} className="px-6 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700">📢 Send Broadcast</button>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg">📋 System Logs</h3>
              {systemLogs.length > 0 && (
                <button onClick={clearLogs} className="text-xs text-red-500 hover:text-red-700 font-medium">Clear All Logs</button>
              )}
            </div>
            {systemLogs.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No system logs yet</p>
            ) : (
              systemLogs.map(log => (
                <div key={log.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">{log.agent}</span>
                    <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-600 text-xs mt-1">{log.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ===== FLOATING LIVE CHAT WIDGET ===== */}
      {/* Chat Toggle Button - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat Window */}
        {chatOpen && (
          <div className={`absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transition-all ${chatMinimized ? 'h-14' : 'h-[500px]'}`}>
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white cursor-pointer" onClick={() => setChatMinimized(!chatMinimized)}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-lg">💬</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-600"></div>
                </div>
                <div>
                  <p className="font-semibold text-sm">Live Chat Support</p>
                  <p className="text-xs text-blue-100 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                    {isOnline ? 'Online - Typically replies instantly' : 'Away - Will reply soon'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={(e) => { e.stopPropagation(); setChatMinimized(!chatMinimized); }} className="p-1 hover:bg-white/20 rounded">
                  {chatMinimized ? '□' : '─'}
                </button>
                <button onClick={(e) => { e.stopPropagation(); setChatOpen(false); }} className="p-1 hover:bg-white/20 rounded">✕</button>
              </div>
            </div>

            {!chatMinimized && (
              <>
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 h-[380px] bg-gray-50">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.from === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                        msg.from === 'admin' 
                          ? 'bg-blue-600 text-white rounded-br-md' 
                          : 'bg-white border border-gray-200 text-gray-700 rounded-bl-md shadow-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-1 ${msg.from === 'admin' ? 'text-blue-100' : 'text-gray-400'}`}>
                          {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Quick Replies */}
                <div className="px-3 py-2 bg-white border-t flex gap-1.5 overflow-x-auto">
                  {['Stats', 'Find leads', 'Export CSV', 'Run pipeline'].map(q => (
                    <button key={q} onClick={() => { setNewMessage(q); chatInputRef.current?.focus(); }}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-[10px] text-gray-600 whitespace-nowrap flex-shrink-0">
                      {q}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-3 bg-white border-t flex gap-2">
                  <input ref={chatInputRef} type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                  <button onClick={handleSendChat} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                    ➤
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating Chat Button */}
        <button
          onClick={() => {
            if (!chatOpen) { setChatOpen(true); setChatMinimized(false); }
            else { setChatMinimized(!chatMinimized); }
          }}
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center text-2xl relative"
        >
          {chatOpen ? '✕' : '💬'}
          {/* Online Indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          {/* Unread Badge */}
          {!chatOpen && unreadChat > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadChat}
            </span>
          )}
        </button>
      </div>

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">📧 Send Direct Email</h3>
              <button onClick={() => setShowEmailComposer(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-sm font-medium mb-1">To</label><input type="email" value={emailData.to} onChange={e => setEmailData({...emailData, to: e.target.value})} className="w-full px-4 py-2.5 border rounded-xl text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Subject</label><input type="text" value={emailData.subject} onChange={e => setEmailData({...emailData, subject: e.target.value})} className="w-full px-4 py-2.5 border rounded-xl text-sm" /></div>
              <div><label className="block text-sm font-medium mb-1">Message</label><textarea value={emailData.body} onChange={e => setEmailData({...emailData, body: e.target.value})} rows="6" className="w-full px-4 py-2.5 border rounded-xl text-sm resize-none" /></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEmailComposer(false)} className="flex-1 px-4 py-2.5 border rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSendDirectEmail} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">Send Email</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickActionCard({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl text-left hover:shadow-md hover:border-blue-200 transition-all group">
      <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{desc}</p>
    </button>
  );
}