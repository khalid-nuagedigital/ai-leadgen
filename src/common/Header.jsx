import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import toast from 'react-hot-toast';

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { stats, systemLogs, clearLogs } = useLeadStore();
  const { activeWorkflow, workflows, setActiveWorkflow } = useWorkflowStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFunnelSwitcher, setShowFunnelSwitcher] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const funnelRef = useRef(null);

  const activeFunnel = workflows.find(w => w.id === activeWorkflow);
  const isMarketing = activeWorkflow === 'marketing';

  // Generate notifications
  useEffect(() => {
    const notifs = [];
    if (systemLogs?.length > 0) {
      systemLogs.slice(0, 10).forEach(log => {
        notifs.push({
          id: log.id,
          title: log.agent,
          msg: log.message,
          time: getTimeAgo(log.timestamp),
          icon: getAgentIcon(log.agent),
        });
      });
    }
    if (stats.new > 0) notifs.push({ id: 'new', title: 'New Leads', msg: `${stats.new} leads waiting`, time: 'Now', icon: '🔍' });
    if (stats.qualified > 0) notifs.push({ id: 'qual', title: 'Qualified', msg: `${stats.qualified} leads ready`, time: 'Now', icon: '✅' });
    if (stats.meetings > 0) notifs.push({ id: 'meet', title: 'Meetings', msg: `${stats.meetings} booked`, time: 'Now', icon: '📅' });
    setNotifications(notifs.slice(0, 20));
  }, [systemLogs, stats]);

  const getAgentIcon = (agent) => {
    const icons = { 'LeadFinder': '🔍', 'Website Analyzer': '🌐', 'Offer Generator': '📝', 'Outreach': '📧', 'Follow-Up': '🔄', 'Qualification': '✅', 'Appointment': '📅', 'System': '🤖' };
    return icons[agent] || '📌';
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target)) setShowNotifications(false);
      if (funnelRef.current && !funnelRef.current.contains(event.target)) setShowFunnelSwitcher(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout(); setShowProfile(false);
    toast.success('Logged out'); navigate('/login');
  };

  const handleSwitchFunnel = (funnelId) => {
    setActiveWorkflow(funnelId);
    setShowFunnelSwitcher(false);
    toast.success(`Switched to ${workflows.find(w => w.id === funnelId)?.name}`);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    clearLogs?.();
    toast.success('Notifications cleared');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="px-4 sm:px-5 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          
          {/* ===== LEFT SECTION ===== */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Menu */}
            <button onClick={onMenuClick} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>

            {/* Logo */}
            <Link to="/" className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <span className="hidden lg:block text-lg font-bold text-gray-900">LeadGen</span>
            </Link>

            {/* ===== FUNNEL TOGGLE ===== */}
            {isAuthenticated && (
              <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
                <button
                  onClick={() => handleSwitchFunnel('marketing')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isMarketing
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📈 Marketing
                </button>
                <button
                  onClick={() => handleSwitchFunnel('accounting')}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    !isMarketing
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📊 Accounting
                </button>
              </div>
            )}

            {/* Services Count Badge */}
            {isAuthenticated && (
              <span className="hidden md:inline text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                {activeFunnel?.services?.length || 0} services
              </span>
            )}
          </div>

          {/* ===== RIGHT SECTION ===== */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Stats Pills */}
            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-1.5 bg-gray-50 rounded-xl px-2 py-1 border text-xs">
                <span className="text-green-600 font-semibold">{stats.qualified || 0}Q</span>
                <span className="text-gray-300">·</span>
                <span className="text-blue-600 font-semibold">{stats.meetings || 0}M</span>
              </div>
            )}

            {/* Mobile Stats */}
            {isAuthenticated && (
              <div className="lg:hidden flex gap-1 text-[10px]">
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{stats.qualified || 0}Q</span>
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{stats.meetings || 0}M</span>
              </div>
            )}

            {/* ===== NOTIFICATION BELL ===== */}
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                  className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {notifications.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50/50">
                      <div>
                        <h3 className="font-bold text-sm">Notifications</h3>
                        <p className="text-[10px] text-gray-500">{notifications.length} updates</p>
                      </div>
                      {notifications.length > 0 && (
                        <button onClick={handleClearNotifications}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 hover:bg-red-50 rounded-lg transition-colors">
                          ✕ Clear All
                        </button>
                      )}
                    </div>

                    {/* List */}
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-10">
                          <span className="text-3xl block mb-2">🔔</span>
                          <p className="text-sm text-gray-500">No notifications</p>
                          <p className="text-xs text-gray-400 mt-1">Pipeline activity appears here</p>
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={n.id || i}
                            onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))}
                            className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors group">
                            <span className="text-lg mt-0.5 flex-shrink-0">{n.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                                <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-lg leading-none transition-all" title="Dismiss">×</button>
                              </div>
                              <p className="text-xs text-gray-600 mt-0.5">{n.msg}</p>
                              <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Link to="/pipeline" className="block text-center py-2.5 border-t text-xs text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50/50 transition-colors">
                      View Pipeline →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                  className="flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-xl transition-all">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white text-[10px] sm:text-xs font-bold">{getInitials(user?.fullName)}</span>
                  </div>
                </button>

                {showProfile && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <p className="font-bold text-sm">{user?.fullName}</p>
                      <p className="text-xs text-violet-100">{user?.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/20 rounded-full text-[10px] capitalize">{user?.plan || 'Free'}</span>
                    </div>
                    <div className="py-1">
                      <Link to="/settings" onClick={() => setShowProfile(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">⚙️ Settings</Link>
                      <Link to="/admin" onClick={() => setShowProfile(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">🛡️ Admin</Link>
                      <Link to="/pricing" onClick={() => setShowProfile(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50">💎 Upgrade</Link>
                    </div>
                    <div className="border-t py-1">
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium">🚪 Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Sign In</Link>
                <Link to="/register" className="px-3 py-2 text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium">Start Free</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}