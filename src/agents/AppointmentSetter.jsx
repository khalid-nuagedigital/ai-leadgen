import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import toast from 'react-hot-toast';

const BOOKING_URL = 'https://nuage-digital.com/book-appointment/';
const HUBSPOT_MEETINGS_URL = 'https://meetings.hubspot.com/faraz-feroze';

export default function AppointmentSetter() {
  const { leads, updateLead } = useLeadStore();
  const { activeWorkflow, workflows } = useWorkflowStore();
  const activeFunnel = workflows.find(w => w.id === activeWorkflow);
  
  const [autoMode, setAutoMode] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showHubSpotModal, setShowHubSpotModal] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState({
    date: '', time: '', duration: '30', type: 'video', notes: '',
  });
  const hubspotRef = useRef(null);

  const funnelLeads = leads.filter(l => l.funnelType === activeWorkflow);
  const qualified = funnelLeads.filter(l => l.status === 'qualified');
  const meetings = funnelLeads.filter(l => l.status === 'meeting_booked');
  const converted = funnelLeads.filter(l => l.status === 'converted');

  useEffect(() => {
    let interval;
    if (autoMode && qualified.length > 0) {
      interval = setInterval(() => { if (qualified[0]) autoBookMeeting(qualified[0]); }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoMode, qualified.length]);

  // Load HubSpot embed when modal opens
  useEffect(() => {
    if (showHubSpotModal && hubspotRef.current) {
      // Clear previous embed
      hubspotRef.current.innerHTML = '';
      
      // Create HubSpot meetings embed
      const container = document.createElement('div');
      container.className = 'meetings-iframe-container';
      container.setAttribute('data-src', `${HUBSPOT_MEETINGS_URL}?embed=true`);
      hubspotRef.current.appendChild(container);

      // Load HubSpot script
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';
      hubspotRef.current.appendChild(script);
    }
  }, [showHubSpotModal]);

  const autoBookMeeting = (lead) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const date = tomorrow.toISOString().split('T')[0];
    const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
    const time = times[Math.floor(Math.random() * times.length)];
    updateLead(lead.id, {
      status: 'meeting_booked',
      meetingScheduledAt: `${date}T${time}:00`,
      meetingDuration: '30', meetingType: 'video',
      bookingUrl: BOOKING_URL, hubspotUrl: HUBSPOT_MEETINGS_URL,
    });
    toast.success(`📅 Auto-booked: ${lead.businessName}`);
  };

  const openBookingModal = (lead) => {
    setSelectedLead(lead);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMeetingDetails({ date: tomorrow.toISOString().split('T')[0], time: '10:00', duration: '30', type: 'video', notes: '' });
    setShowBookingModal(true);
  };

  const openHubSpotModal = (lead) => {
    setSelectedLead(lead);
    setShowHubSpotModal(true);
  };

  const handleBookMeeting = () => {
    if (!selectedLead || !meetingDetails.date || !meetingDetails.time) {
      toast.error('Please fill in date and time'); return;
    }
    updateLead(selectedLead.id, {
      status: 'meeting_booked',
      meetingScheduledAt: `${meetingDetails.date}T${meetingDetails.time}:00`,
      meetingDuration: meetingDetails.duration, meetingType: meetingDetails.type,
      meetingNotes: meetingDetails.notes, bookingUrl: BOOKING_URL, hubspotUrl: HUBSPOT_MEETINGS_URL,
    });
    toast.success(`📅 Meeting booked: ${selectedLead.businessName}`);
    setShowBookingModal(false); setSelectedLead(null);
  };

  const handleCancelMeeting = (lead) => {
    updateLead(lead.id, { status: 'qualified', meetingScheduledAt: null });
    toast.success(`Cancelled: ${lead.businessName}`);
  };

  const handleMarkConverted = (lead) => {
    updateLead(lead.id, { status: 'converted' });
    toast.success(`🎉 ${lead.businessName} converted!`);
  };

  const handleNoShow = (lead) => {
    updateLead(lead.id, { status: 'nurturing' });
    toast.error(`No-show: ${lead.businessName}`);
  };

  const bookAll = () => {
    qualified.forEach(lead => autoBookMeeting(lead));
    toast.success(`Booking ${qualified.length} meetings...`);
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      if (hour !== 12 && hour !== 13) {
        slots.push(`${String(hour).padStart(2, '0')}:00`);
        slots.push(`${String(hour).padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const getNext5BusinessDays = () => {
    const days = [];
    const current = new Date();
    current.setDate(current.getDate() + 1);
    while (days.length < 5) {
      if (current.getDay() !== 0 && current.getDay() !== 6) days.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">📅 Appointment Setter</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            HubSpot Meetings: <a href={HUBSPOT_MEETINGS_URL} target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">{HUBSPOT_MEETINGS_URL}</a>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAutoMode(!autoMode)} className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={bookAll} disabled={qualified.length === 0} className="px-3 py-1.5 sm:px-4 sm:py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 whitespace-nowrap">
            ⚡ Book All ({qualified.length})
          </button>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg text-xs sm:text-sm font-medium shadow-sm whitespace-nowrap">
            🔗 Booking Page ↗
          </a>
        </div>
      </div>

      {/* HubSpot Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 sm:p-5 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟠</span>
            <div>
              <h2 className="font-bold text-base sm:text-lg">HubSpot Meetings</h2>
              <p className="text-xs sm:text-sm text-orange-100">Powered by HubSpot Scheduling</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowHubSpotModal(true)}
              className="px-4 py-2 bg-white text-orange-700 rounded-xl font-semibold text-sm hover:bg-orange-50 whitespace-nowrap">
              📅 Schedule Meeting
            </button>
            <a href={HUBSPOT_MEETINGS_URL} target="_blank" rel="noopener noreferrer"
              className="px-4 py-2 bg-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/30 whitespace-nowrap">
              Open HubSpot ↗
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Ready', value: qualified.length, icon: '📋', color: 'blue' },
          { label: 'Booked', value: meetings.length, icon: '📅', color: 'teal' },
          { label: 'Converted', value: converted.length, icon: '🎉', color: 'green' },
          { label: 'HubSpot', value: 'Active', icon: '🟠', color: 'orange' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border text-center">
            <div className="text-lg sm:text-2xl">{s.icon}</div>
            <div className="text-xl sm:text-2xl font-bold" style={{color: s.color}}>{s.value}</div>
            <div className="text-[10px] sm:text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Qualified Leads */}
        <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-3">📋 Ready to Book ({qualified.length})</h3>
          <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
            {qualified.map(lead => (
              <div key={lead.id} className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link to={`/lead/${lead.id}`} className="font-medium text-sm text-blue-600 hover:underline block truncate">
                      {lead.businessName}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">{lead.industry} • {lead.city}</div>
                    <div className="text-xs text-gray-400 mt-1">Score: {lead.qualificationScore || lead.score}/100</div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => openHubSpotModal(lead)}
                      className="px-2.5 py-1.5 bg-orange-600 text-white rounded-lg text-[11px] sm:text-xs font-medium hover:bg-orange-700 whitespace-nowrap">
                      🟠 HubSpot
                    </button>
                    <button onClick={() => openBookingModal(lead)}
                      className="px-2.5 py-1.5 bg-teal-600 text-white rounded-lg text-[11px] sm:text-xs font-medium hover:bg-teal-700 whitespace-nowrap">
                      📅 Manual
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {qualified.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl sm:text-4xl mb-2">📋</p>
                <p className="text-sm font-medium">No qualified leads</p>
              </div>
            )}
          </div>
        </div>

        {/* Scheduled Meetings */}
        <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base mb-3">📅 Scheduled ({meetings.length})</h3>
          <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
            {meetings.map(lead => (
              <div key={lead.id} className={`p-3 sm:p-4 border rounded-lg ${lead.meetingScheduledAt && new Date(lead.meetingScheduledAt) < new Date() ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}>
                <Link to={`/lead/${lead.id}`} className="font-medium text-sm text-blue-600 hover:underline block truncate">
                  {lead.businessName}
                </Link>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                  <span className="text-teal-700 font-medium whitespace-nowrap">
                    📅 {lead.meetingScheduledAt ? new Date(lead.meetingScheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'N/A'}
                  </span>
                  <span className="text-teal-700 whitespace-nowrap">
                    🕐 {lead.meetingScheduledAt ? new Date(lead.meetingScheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <a href={HUBSPOT_MEETINGS_URL} target="_blank" rel="noopener noreferrer"
                    className="px-2.5 py-1.5 bg-orange-600 text-white rounded-lg text-[11px] sm:text-xs font-medium hover:bg-orange-700 whitespace-nowrap">
                    🟠 HubSpot
                  </a>
                  <button onClick={() => handleMarkConverted(lead)}
                    className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-[11px] sm:text-xs font-medium hover:bg-green-700 whitespace-nowrap">
                    ✅ Convert
                  </button>
                  <button onClick={() => handleNoShow(lead)}
                    className="px-2.5 py-1.5 bg-orange-600 text-white rounded-lg text-[11px] sm:text-xs font-medium hover:bg-orange-700 whitespace-nowrap">
                    ❌ No Show
                  </button>
                  <button onClick={() => handleCancelMeeting(lead)}
                    className="px-2.5 py-1.5 bg-red-100 text-red-600 rounded-lg text-[11px] sm:text-xs font-medium hover:bg-red-200 whitespace-nowrap">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
            {meetings.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-3xl sm:text-4xl mb-2">📅</p>
                <p className="text-sm font-medium">No meetings yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Booking Modal */}
      {showBookingModal && selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Manual Booking</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl mb-4">
              <p className="font-medium text-teal-900">{selectedLead.businessName}</p>
              <p className="text-sm text-teal-700">{selectedLead.industry} • {selectedLead.city}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <select value={meetingDetails.date} onChange={e => setMeetingDetails({...meetingDetails, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  {getNext5BusinessDays().map(date => (
                    <option key={date} value={date}>{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <select value={meetingDetails.time} onChange={e => setMeetingDetails({...meetingDetails, time: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  {getTimeSlots().map(time => (<option key={time} value={time}>{time}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <select value={meetingDetails.duration} onChange={e => setMeetingDetails({...meetingDetails, duration: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="15">15 min</option><option value="30">30 min</option><option value="60">1 hour</option>
                  </select>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={meetingDetails.type} onChange={e => setMeetingDetails({...meetingDetails, type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="video">Video</option><option value="phone">Phone</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowBookingModal(false)}
                className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 whitespace-nowrap">Cancel</button>
              <button onClick={() => { setShowBookingModal(false); openHubSpotModal(selectedLead); }}
                className="flex-1 px-3 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 whitespace-nowrap">🟠 Use HubSpot</button>
              <button onClick={handleBookMeeting}
                className="flex-1 px-3 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 whitespace-nowrap">✅ Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* HubSpot Meeting Modal */}
      {showHubSpotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-bold">Schedule via HubSpot</h3>
                {selectedLead && (
                  <p className="text-sm text-gray-500">{selectedLead.businessName} • {selectedLead.industry}</p>
                )}
              </div>
              <button onClick={() => { setShowHubSpotModal(false); setSelectedLead(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div ref={hubspotRef} className="min-h-[600px]">
                {/* HubSpot embed loads here */}
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <div className="animate-spin text-4xl mb-3">⏳</div>
                    <p>Loading HubSpot Meetings...</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500">Meetings scheduled via HubSpot will be tracked automatically</span>
              <div className="flex gap-2">
                <button onClick={() => { setShowHubSpotModal(false); setSelectedLead(null); }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 whitespace-nowrap">Close</button>
                <a href={HUBSPOT_MEETINGS_URL} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 whitespace-nowrap">
                  Open in New Tab ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}