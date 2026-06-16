import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';
import toast from 'react-hot-toast';

export default function AppointmentSetter() {
  const { leads, updateLead } = useLeadStore();
  const [autoMode, setAutoMode] = useState(false);

  const qualified = leads.filter(l => l.status === 'qualified');
  const meetings = leads.filter(l => l.status === 'meeting_booked');

  useEffect(() => {
    let interval;
    if (autoMode && qualified.length > 0) {
      interval = setInterval(() => {
        const next = qualified[0];
        if (next) bookMeeting(next);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [autoMode, qualified.length]);

  const bookMeeting = (lead) => {
    const dates = [];
    for (let i = 1; i <= 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    const meetingDate = dates[Math.floor(Math.random() * dates.length)];
    const times = ['09:00', '10:30', '14:00', '15:30'];
    const meetingTime = times[Math.floor(Math.random() * times.length)];
    
    setTimeout(() => {
      updateLead(lead.id, {
        status: 'meeting_booked',
        meetingScheduledAt: `${meetingDate}T${meetingTime}`,
        calendlyEventUri: `https://calendly.com/events/${Date.now()}`,
      });
      toast.success(`📅 Meeting booked: ${lead.businessName} on ${meetingDate} at ${meetingTime}`);
    }, 800);
  };

  const bookAll = () => {
    qualified.forEach(lead => bookMeeting(lead));
    toast.success('All meetings booked!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📅 Appointment Setter Agent</h1>
          <p className="text-gray-500 mt-1">Automatically book meetings with qualified leads.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAutoMode(!autoMode)} className={`px-4 py-2 rounded-lg text-sm font-medium ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={bookAll} disabled={qualified.length === 0} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium">
            ⚡ Book All ({qualified.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-blue-600">{qualified.length}</div>
          <div className="text-xs text-gray-500">Ready to Book</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-teal-600">{meetings.length}</div>
          <div className="text-xs text-gray-500">Meetings Booked</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'converted').length}</div>
          <div className="text-xs text-gray-500">Converted</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">📋 Ready to Book ({qualified.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {qualified.map(lead => (
              <div key={lead.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{lead.businessName}</div>
                  <div className="text-xs text-gray-500">Score: {lead.qualificationScore || lead.score}</div>
                </div>
                <button onClick={() => bookMeeting(lead)} className="px-3 py-1 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700">
                  Book
                </button>
              </div>
            ))}
            {qualified.length === 0 && <p className="text-gray-400 text-center py-8">No qualified leads</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">📅 Scheduled Meetings ({meetings.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {meetings.map(lead => (
              <div key={lead.id} className="p-3 border rounded-lg">
                <div className="font-medium text-sm">{lead.businessName}</div>
                <div className="text-xs text-gray-500">
                  📅 {lead.meetingScheduledAt ? new Date(lead.meetingScheduledAt).toLocaleDateString() : 'N/A'} at{' '}
                  {lead.meetingScheduledAt ? new Date(lead.meetingScheduledAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                </div>
                <div className="text-xs text-teal-600 mt-1">Calendly Event Created</div>
              </div>
            ))}
            {meetings.length === 0 && <p className="text-gray-400 text-center py-8">No meetings yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
