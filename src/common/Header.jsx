import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import toast from 'react-hot-toast';

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { stats, leads, systemLogs } = useLeadStore();
  const { activeWorkflow, workflows, setActiveWorkflow } = useWorkflowStore();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFunnelSwitcher, setShowFunnelSwitcher] = useState(false);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const funnelRef = useRef(null);

  const activeFunnel = workflows.find(w => w.id === activeWorkflow);

  // Generate real notifications from system logs
  const getNotifications = () => {
    const notifs = [];
    
    // From system logs
    if (systemLogs && systemLogs.length > 0) {
      systemLogs.slice(0, 10).forEach(log => {
        notifs.push({
          id: log.id,
          title: log.agent,
          msg: log.message,
          time: getTimeAgo(log.timestamp),
          icon: getAgentIcon(log.agent),
          color: getAgentColor(log.agent),
        });
      });
    }

    // Add stats-based notifications
    if (stats.new > 0) {
      notifs.push({
        id: 'new-leads',
        title: 'New Leads Waiting',
        msg: `${stats.new} leads need analysis`,
        time: 'Now',
        icon: '🔍',
        color: 'bg-blue-100 text-blue-600',
      });
    }
    if (stats.analyzed > 0 && stats.outreached === 0) {
      notifs.push({
        id: 'ready-outreach',
        title: 'Ready for Outreach',
        msg: `${stats.analyzed} leads analyzed - send outreach`,
        time: 'Now',
        icon: '📧',
        color: 'bg-purple-100 text-purple-600',
      });
    }
    if (stats.qualified > 0) {
      notifs.push({
        id: 'qualified',
        title: 'Leads Qualified',
        msg: `${stats.qualified} leads ready for meetings`,
        time: 'Now',
        icon: '✅',
        color: 'bg-green-100 text-green-600',
      });
    }
    if (stats.meetings > 0) {
      notifs.push({
        id: 'meetings',
        title: 'Meetings Booked',
        msg: `${stats.meetings} meetings scheduled`,
        time: 'Now',
        icon: '📅',
        color: 'bg-teal-100 text-teal-600',
      });
    }

    return notifs.slice(0, 15);
  };

  const getAgentIcon = (agent) => {
    const icons = {
      'LeadFinder': '🔍', 'Website Analyzer': '🌐', 'Offer Generator': '📝',
      'Outreach': '📧', 'Follow-Up': '🔄', 'Qualification': '✅',
      'Appointment': '📅', 'System': '🤖', 'Agent 2': '🌐',
      'Agent 3': '📝', 'Agent 4': '📧', 'Agent 5': '🔄',
      'Agent 6': '✅', 'Agent 7': '📅',
    };
    return icons[agent] || '📌';
  };

  const getAgentColor = (agent) => {
    const colors = {
      'LeadFinder': 'bg-blue-100 text-blue-600',
      'Website Analyzer': 'bg-purple-100 text-purple-600',
      'Offer Generator': 'bg-pink-100 text-pink-600',
      'Outreach': 'bg-indigo-100 text-indigo-600',
      'Follow-Up': 'bg-orange-100 text-orange-600',
      'Qualification': 'bg-green-100 text-green-600',
      'Appointment': 'bg-teal-100 text-teal-600',
      'System': 'bg-gray-100 text-gray-600',
    };
    return colors[agent] || 'bg-gray-100 text-gray-600';
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

  const notifications = getNotifications();
  const unreadCount = notifications.length;

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
    logout();
    setShowProfile(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSwitchFunnel = (funnelId) => {
    setActiveWorkflow(funnelId);
    setShowFunnelSwitcher(false);
    const funnel = workflows.find(w => w.id === funnelId);
    toast.success(`Switched to ${funnel?.name}`);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
      <div className="px-5 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LEFT SECTION */}
          <div className="flex items-center gap-5">
            <button onClick={onMenuClick} className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <Link to="/" className="hidden sm:flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:shadow-xl group-hover:scale-105 transition-all">
                <span className="text-white font-bold text-base">AI</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-gray-900 leading-tight tracking-tight">LeadGen</h1>
                <p className="text-[10px] text-gray-400 -mt-0.5 font-medium tracking-wide uppercase">AI System</p>
              </div>
            </Link>

            {isAuthenticated && (
              <div className="relative" ref={funnelRef}>
                <button onClick={() => setShowFunnelSwitcher(!showFunnelSwitcher)}
                  className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all duration-200 border-2 ${
                    activeFunnel?.type === 'marketing' 
                      ? 'border-blue-200 bg-blue-50/50 hover:border-blue-300 hover:bg-blue-50' 
                      : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${activeFunnel?.type === 'marketing' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                    {activeFunnel?.icon || '📈'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-semibold text-gray-900 leading-tight">{activeFunnel?.name || 'Marketing'}</div>
                    <div className="text-[10px] text-gray-500 font-medium">{activeFunnel?.services?.length || 0} services</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 hidden sm:block">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showFunnelSwitcher && (
                  <div className="absolute top-full left-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-5 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                      <h3 className="font-bold text-gray-900 text-base">Switch Funnel</h3>
                      <p className="text-xs text-gray-500 mt-1">Select lead generation pipeline</p>
                    </div>
                    <div className="p-3 space-y-2">
                      {workflows.map((workflow) => (
                        <button key={workflow.id} onClick={() => handleSwitchFunnel(workflow.id)}
                          className={`w-full text-left p-4 rounded-xl transition-all duration-200 border-2 ${
                            activeWorkflow === workflow.id ? 'border-blue-400 bg-blue-50/50 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                          }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                              workflow.type === 'marketing' ? 'bg-gradient-to-br from-blue-100 to-blue-200' : 'bg-gradient-to-br from-emerald-100 to-emerald-200'
                            }`}>{workflow.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-900 text-sm">{workflow.name}</h4>
                                {workflow.active && <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{workflow.description}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {workflow.services.slice(0, 4).map(s => (
                                  <span key={s} className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-[10px] text-gray-600 font-medium shadow-sm">{s}</span>
                                ))}
                              </div>
                            </div>
                            {activeWorkflow === workflow.id && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <div className="hidden lg:flex items-center gap-2 bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl shadow-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">{stats.qualified || 0}</span>
                  <span className="text-xs text-gray-400">Qualified</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-700">{stats.meetings || 0}</span>
                  <span className="text-xs text-gray-400">Meetings</span>
                </div>
              </div>
            )}

            {/* NOTIFICATION BELL - WITH REAL DATA */}
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
                  className="relative p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <div>
                        <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{notifications.length} updates from your pipeline</p>
                      </div>
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Clear all</button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="text-center py-12 px-5">
                          <span className="text-4xl block mb-3">🔔</span>
                          <p className="text-sm font-medium text-gray-600">No notifications yet</p>
                          <p className="text-xs text-gray-400 mt-1">Run the AI pipeline to see updates here</p>
                        </div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={n.id || i} 
                            className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors group">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${n.color || 'bg-gray-100'}`}>
                              {n.icon || '📌'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{n.time}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.msg}</p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <Link to="/pipeline" 
                      className="block text-center py-3.5 border-t border-gray-100 text-sm text-blue-600 hover:text-blue-700 font-semibold hover:bg-blue-50/50 transition-colors">
                      View Full Pipeline →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated && <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>}

            {/* Profile */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
                  className="flex items-center gap-3 p-1.5 hover:bg-gray-100 rounded-2xl transition-all group">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <span className="text-white text-xs font-bold">{getInitials(user?.fullName)}</span>
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900 leading-tight">{user?.fullName || 'User'}</p>
                    <p className="text-[11px] text-gray-500 capitalize font-medium">{user?.plan || 'Free'} Plan</p>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 hidden lg:block">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showProfile && (
                  <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-5 bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                          <span className="text-white font-bold text-lg">{getInitials(user?.fullName)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base truncate">{user?.fullName || 'User'}</p>
                          <p className="text-sm text-violet-100 truncate">{user?.email}</p>
                          <span className="inline-block mt-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium capitalize">
                            {user?.plan || 'Free'} Plan
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="py-2">
                      <Link to="/settings" onClick={() => setShowProfile(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                        <span className="text-lg">⚙️</span> Settings
                      </Link>
                      <Link to="/pricing" onClick={() => setShowProfile(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                        <span className="text-lg">💎</span> Upgrade Plan
                      </Link>
                      <Link to="/analytics" onClick={() => setShowProfile(false)} className="flex items-center gap-3 px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium">
                        <span className="text-lg">📊</span> Analytics
                      </Link>
                    </div>
                    <div className="border-t border-gray-100 py-2">
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-semibold">
                        <span className="text-lg">🚪</span> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-all">Sign In</Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-md shadow-blue-200 hover:shadow-lg transition-all">Get Started Free</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}