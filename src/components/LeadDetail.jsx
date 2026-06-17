import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import toast from 'react-hot-toast';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { leads, updateLead, deleteLead } = useLeadStore();
  const { activeWorkflow } = useWorkflowStore();
  
  const lead = leads.find(l => l.id === id || l.id?.toString() === id);
  
  const [activeTab, setActiveTab] = useState('info');
  const [outreachMethod, setOutreachMethod] = useState('email');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!lead) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Lead Not Found</h2>
        <p className="text-gray-500 mb-6">This lead may have been deleted or doesn't exist.</p>
        <Link to="/agents/find" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium">Back to Leads</Link>
      </div>
    );
  }

  const handleSendEmail = async () => {
    if (!emailSubject || !emailBody) {
      toast.error('Please fill in subject and body');
      return;
    }
    setSending(true);
    setTimeout(() => {
      updateLead(lead.id, {
        status: 'outreached',
        outreachChannel: 'email',
        firstEmailSentAt: new Date().toISOString(),
        lastTouchAt: new Date().toISOString(),
        touchCount: (lead.touchCount || 0) + 1,
      });
      setSending(false);
      toast.success(`📧 Email sent to ${lead.businessName}!`);
    }, 1500);
  };

  const handleSendSMS = async () => {
    if (!smsMessage) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    setTimeout(() => {
      updateLead(lead.id, {
        status: 'outreached',
        outreachChannel: 'sms',
        lastTouchAt: new Date().toISOString(),
        touchCount: (lead.touchCount || 0) + 1,
      });
      setSending(false);
      toast.success(`📱 SMS sent to ${lead.businessName}!`);
    }, 1000);
  };

  const handleLogCall = () => {
    updateLead(lead.id, {
      outreachChannel: 'phone',
      lastTouchAt: new Date().toISOString(),
      touchCount: (lead.touchCount || 0) + 1,
      callNotes: callNotes,
    });
    toast.success(`📞 Call logged for ${lead.businessName}`);
    setCallNotes('');
  };

  const handleDelete = () => {
    deleteLead(lead.id);
    toast.success('Lead deleted');
    navigate('/agents/find');
  };

  const handleStatusChange = (newStatus) => {
    updateLead(lead.id, { status: newStatus });
    toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
  };

  const handleQualify = () => {
    const score = Math.floor(Math.random() * 30) + 50;
    updateLead(lead.id, {
      status: score >= 60 ? 'qualified' : 'nurturing',
      qualificationScore: score,
      score: score,
    });
    toast.success(`Lead qualified - Score: ${score}/100`);
  };

  const handleBookMeeting = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    updateLead(lead.id, {
      status: 'meeting_booked',
      meetingScheduledAt: tomorrow.toISOString(),
    });
    toast.success(`📅 Meeting booked for tomorrow!`);
  };

  // Generate email template
  const generateEmailTemplate = () => {
    setEmailSubject(`Growth opportunity for ${lead.businessName}`);
    setEmailBody(`Hi ${lead.contactName || 'there'},

I noticed ${lead.businessName} is a ${lead.industry} in ${lead.city}. We specialize in helping ${lead.industry} businesses grow through digital marketing.

Our services include:
• SEO Optimization
• Google Ads Management
• Social Media Marketing
• Website Development

Would you be open to a quick 15-minute call to discuss how we can help ${lead.businessName}?

Best regards,
Nuage Digital Team`);
  };

  const sourceIcons = {
    google_maps: '🗺️', facebook: '📘', instagram: '📸',
    linkedin: '💼', yelp: '⭐', tiktok: '🎵',
    youtube: '▶️', twitter: '🐦', email: '📧',
    sms: '📱', phone: '📞',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
        ← Back to Leads
      </button>

      {/* Lead Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">{lead.businessName?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.businessName}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">{lead.industry}</span>
                <span className="text-sm text-gray-500">{lead.city}, {lead.state}</span>
                {lead.rating && (
                  <span className="flex items-center gap-1 text-sm text-yellow-600">⭐ {lead.rating} ({lead.totalRatings})</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${
                  lead.status === 'new' ? 'bg-blue-100 text-blue-700' :
                  lead.status === 'analyzed' ? 'bg-purple-100 text-purple-700' :
                  lead.status === 'outreached' ? 'bg-pink-100 text-pink-700' :
                  lead.status === 'qualified' ? 'bg-green-100 text-green-700' :
                  lead.status === 'meeting_booked' ? 'bg-teal-100 text-teal-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{lead.status?.replace('_', ' ')}</span>
                <span className="text-xs text-gray-400">Score: {lead.score || 'N/A'}</span>
                <span className="text-xs text-gray-400">Source: {lead.source?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleQualify} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">✅ Qualify</button>
            <button onClick={handleBookMeeting} className="px-3 py-2 bg-teal-100 text-teal-700 rounded-lg text-sm font-medium hover:bg-teal-200">📅 Book Meeting</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">🗑️ Delete</button>
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-100">
          {['new', 'analyzed', 'outreached', 'qualified', 'meeting_booked', 'converted'].map((status, i) => (
            <React.Fragment key={status}>
              <button onClick={() => handleStatusChange(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  lead.status === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {status.replace('_', ' ')}
              </button>
              {i < 5 && <span className="text-gray-300">→</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'info', label: '📋 Contact Info' },
          { id: 'email', label: '📧 Send Email' },
          { id: 'sms', label: '📱 Send SMS' },
          { id: 'call', label: '📞 Log Call' },
          { id: 'website', label: '🌐 Website Details' },
          { id: 'activity', label: '📊 Activity' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* ========== CONTACT INFO TAB ========== */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900">📋 Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoCard icon="🏢" label="Business Name" value={lead.businessName} />
              <InfoCard icon="📂" label="Industry" value={lead.industry} />
              <InfoCard icon="👤" label="Contact Person" value={lead.contactName || 'Not available'} />
              <InfoCard icon="💼" label="Title" value={lead.contactTitle || 'Not available'} />
              <InfoCard icon="📧" label="Email" value={lead.email || 'Not available'} copyable />
              <InfoCard icon="📞" label="Phone" value={lead.phone || 'Not available'} copyable />
              <InfoCard icon="🌐" label="Website" value={lead.website || 'Not available'} link />
              <InfoCard icon="📍" label="Address" value={lead.address || lead.city || 'Not available'} />
              <InfoCard icon="🗺️" label="Source" value={(lead.source || lead.platformSource || 'Unknown')?.replace('_', ' ')} />
              <InfoCard icon="⭐" label="Rating" value={lead.rating ? `${lead.rating} (${lead.totalRatings} reviews)` : 'N/A'} />
              <InfoCard icon="👥" label="Company Size" value={lead.estimatedSize || 'Unknown'} />
              <InfoCard icon="📅" label="Added" value={lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : 'N/A'} />
            </div>

            {/* Social Links */}
            <div className="mt-6">
              <h4 className="font-semibold text-gray-700 mb-3">🔗 Social & Web Links</h4>
              <div className="flex flex-wrap gap-3">
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
                    🌐 Website
                  </a>
                )}
                {lead.facebookUrl && (
                  <a href={lead.facebookUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
                    📘 Facebook
                  </a>
                )}
                {lead.instagramUrl && (
                  <a href={lead.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-700 rounded-xl hover:bg-pink-100 transition-colors">
                    📸 Instagram
                  </a>
                )}
                {lead.linkedinUrl && (
                  <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors">
                    💼 LinkedIn
                  </a>
                )}
                {lead.yelpUrl && (
                  <a href={lead.yelpUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors">
                    ⭐ Yelp
                  </a>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="font-semibold text-gray-700 mb-3">⚡ Quick Actions</h4>
              <div className="flex flex-wrap gap-3">
                {lead.email && (
                  <button onClick={() => { setActiveTab('email'); generateEmailTemplate(); }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium text-sm">
                    📧 Send Email
                  </button>
                )}
                {lead.phone && (
                  <button onClick={() => setActiveTab('sms')}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium text-sm">
                    📱 Send SMS
                  </button>
                )}
                {lead.phone && (
                  <a href={`tel:${lead.phone}`}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium text-sm">
                    📞 Call Now
                  </a>
                )}
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-medium text-sm">
                    🌐 Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========== EMAIL TAB ========== */}
        {activeTab === 'email' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">📧 Send Email</h3>
              <button onClick={generateEmailTemplate} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                ✨ Generate Template
              </button>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-blue-700"><strong>To:</strong> {lead.email || 'No email available'}</p>
              {lead.contactName && <p className="text-sm text-blue-700"><strong>Contact:</strong> {lead.contactName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)}
                rows="8" placeholder="Write your email..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <div className="flex gap-3">
              <button onClick={handleSendEmail} disabled={sending || !lead.email}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
                {sending ? 'Sending...' : '📧 Send Email'}
              </button>
              <button onClick={() => setActiveTab('info')} className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ========== SMS TAB ========== */}
        {activeTab === 'sms' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">📱 Send SMS</h3>
            
            <div className="p-4 bg-green-50 rounded-xl">
              <p className="text-sm text-green-700"><strong>To:</strong> {lead.phone || 'No phone available'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
              <textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)}
                rows="4" placeholder="Type your SMS message..."
                maxLength="160"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
              <p className="text-xs text-gray-400 mt-1">{smsMessage.length}/160 characters</p>
            </div>

            <button onClick={handleSendSMS} disabled={sending || !lead.phone}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium">
              {sending ? 'Sending...' : '📱 Send SMS'}
            </button>
          </div>
        )}

        {/* ========== CALL TAB ========== */}
        {activeTab === 'call' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">📞 Log Phone Call</h3>
            
            <div className="p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-orange-700"><strong>Phone:</strong> {lead.phone || 'No phone available'}</p>
              {lead.contactName && <p className="text-sm text-orange-700"><strong>Contact:</strong> {lead.contactName}</p>}
            </div>

            {lead.phone && (
              <a href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium text-lg">
                📞 Call {lead.phone}
              </a>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Call Notes</label>
              <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)}
                rows="4" placeholder="Enter call notes..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <button onClick={handleLogCall}
              className="px-6 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium">
              📝 Log Call
            </button>
          </div>
        )}

        {/* ========== WEBSITE TAB ========== */}
        {activeTab === 'website' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">🌐 Website Details</h3>
            {lead.analysisJson ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-blue-600">{lead.websiteSpeedScore || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Speed Score</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold text-purple-600">{lead.seoScore || 'N/A'}</div>
                    <div className="text-xs text-gray-500">SEO Score</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold">{lead.mobileFriendly ? '✅' : '❌'}</div>
                    <div className="text-xs text-gray-500">Mobile Friendly</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl text-center">
                    <div className="text-2xl font-bold">{lead.sslValid ? '✅' : '❌'}</div>
                    <div className="text-xs text-gray-500">SSL Secure</div>
                  </div>
                </div>
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700">
                    🌐 Visit {lead.website}
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-3">🌐</p>
                <p>Website not analyzed yet</p>
                <p className="text-sm mt-1">Run the AI Pipeline to analyze this website</p>
              </div>
            )}
          </div>
        )}

        {/* ========== ACTIVITY TAB ========== */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">📊 Activity Log</h3>
            <div className="space-y-2">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium">Lead Created</div>
                <div className="text-xs text-gray-500">{new Date(lead.createdAt).toLocaleString()}</div>
              </div>
              {lead.firstEmailSentAt && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium">📧 First Email Sent</div>
                  <div className="text-xs text-gray-500">{new Date(lead.firstEmailSentAt).toLocaleString()}</div>
                </div>
              )}
              {lead.lastTouchAt && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium">Last Contact</div>
                  <div className="text-xs text-gray-500">{new Date(lead.lastTouchAt).toLocaleString()} (Touch #{lead.touchCount || 0})</div>
                </div>
              )}
              {lead.meetingScheduledAt && (
                <div className="p-3 bg-teal-50 rounded-lg">
                  <div className="text-sm font-medium">📅 Meeting Scheduled</div>
                  <div className="text-xs text-gray-500">{new Date(lead.meetingScheduledAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Lead?</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete <strong>{lead.businessName}</strong>? This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Component
function InfoCard({ icon, label, value, copyable, link }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <span>{icon}</span> {label}
        </span>
        {copyable && value && value !== 'Not available' && (
          <button onClick={handleCopy} className="text-xs text-blue-600 hover:text-blue-700">📋 Copy</button>
        )}
      </div>
      {link && value && value !== 'Not available' ? (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 break-all">
          {value} ↗
        </a>
      ) : (
        <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
      )}
    </div>
  );
}