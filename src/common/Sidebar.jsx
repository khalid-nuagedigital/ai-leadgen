import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkflowStore } from '../store/workflowStore';
import { useLeadStore } from '../store/leadStore';
import toast from 'react-hot-toast';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: '📊', group: 'main' },
  { path: '/pipeline', label: 'Pipeline', icon: '📈', group: 'main' },
  { path: '/analytics', label: 'Analytics', icon: '📉', group: 'main' },
  { path: '/agents/find', label: 'Lead Finder', icon: '🔍', group: 'agents' },
  { path: '/agents/analyze', label: 'Website Analyzer', icon: '🌐', group: 'agents' },
  { path: '/agents/offer', label: 'Offer Generator', icon: '📝', group: 'agents' },
  { path: '/agents/outreach', label: 'Outreach', icon: '📧', group: 'agents' },
  { path: '/agents/followup', label: 'Follow-up', icon: '🔄', group: 'agents' },
  { path: '/agents/qualify', label: 'Qualification', icon: '✅', group: 'agents' },
  { path: '/agents/book', label: 'Appointments', icon: '📅', group: 'agents' },
  { path: '/settings', label: 'Settings', icon: '⚙️', group: 'other' },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { activeWorkflow, workflows, setActiveWorkflow } = useWorkflowStore();
  const { stats } = useLeadStore();

  const activeFunnel = workflows.find(w => w.id === activeWorkflow);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const mainItems = menuItems.filter(i => i.group === 'main');
  const agentItems = menuItems.filter(i => i.group === 'agents');
  const otherItems = menuItems.filter(i => i.group === 'other');

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white border-r border-gray-100 transition-all duration-300 flex flex-col shadow-sm ${
          isOpen ? 'w-[260px]' : 'w-[68px]'
        }`}
      >
        {/* Logo Area */}
        <div className="flex items-center h-[65px] px-5 border-b border-gray-100 flex-shrink-0 gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-[15px] leading-tight">LeadGen AI</h2>
              <p className="text-[10px] text-gray-400 font-medium">Automation v2.0</p>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Funnel Indicator */}
        {isOpen && (
          <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${activeFunnel?.active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-xs font-semibold text-gray-700">{activeFunnel?.name || 'Marketing'}</span>
              </div>
              <button
                onClick={() => {
                  const next = workflows.find(w => w.id !== activeWorkflow);
                  if (next) {
                    setActiveWorkflow(next.id);
                    toast.success(`Switched to ${next.name}`);
                  }
                }}
                className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
              >
                Switch
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeFunnel?.services?.slice(0, 3).map(service => (
                <span key={service} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] text-gray-500 font-medium">
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Main Menu */}
          <div>
            {isOpen && <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Main</p>}
            {mainItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-blue-600 rounded-r-full"></div>
                  )}
                  <span className="text-base flex-shrink-0 w-6 text-center">{item.icon}</span>
                  {isOpen && <span className="text-[13px] font-medium truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Agents Menu */}
          <div>
            {isOpen && <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">AI Agents</p>}
            {agentItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 font-semibold shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-purple-600 rounded-r-full"></div>
                  )}
                  <span className="text-base flex-shrink-0 w-6 text-center">{item.icon}</span>
                  {isOpen && <span className="text-[13px] font-medium truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>

          {/* Other */}
          <div>
            {otherItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                  className={`flex items-center gap-3 px-3 py-2.5 mb-1 rounded-xl transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gray-100 text-gray-900 font-semibold'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  <span className="text-base flex-shrink-0 w-6 text-center">{item.icon}</span>
                  {isOpen && <span className="text-[13px] font-medium truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Upgrade Banner */}
        {isOpen && user?.plan === 'free' && (
          <div className="mx-4 mb-3 p-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <p className="font-bold text-sm mb-1">Upgrade to Pro</p>
            <p className="text-[11px] text-purple-100 mb-3">Unlock all AI agents & features</p>
            <Link
              to="/pricing"
              className="inline-block px-4 py-1.5 bg-white text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-50 transition-colors"
            >
              Upgrade Now
            </Link>
          </div>
        )}

        {/* User Section */}
        <div className="border-t border-gray-100 flex-shrink-0">
          {isOpen ? (
            <div className="p-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-md">
                        <span className="text-white font-bold text-sm">{getInitials(user?.fullName)}</span>
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'User'}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-500 font-medium">Leads Used</span>
                        <span className="text-gray-700 font-semibold">{stats.total || 0}/{user?.usageStats?.maxLeads || 100}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                          style={{width: `${Math.min(((stats.total || 0) / (user?.usageStats?.maxLeads || 100)) * 100, 100)}%`}} 
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-500 font-medium">Meetings</span>
                        <span className="text-gray-700 font-semibold">{stats.meetings || 0}/{user?.usageStats?.maxMeetings || 10}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{width: `${Math.min(((stats.meetings || 0) / (user?.usageStats?.maxMeetings || 10)) * 100, 100)}%`}} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to="/settings" className="flex-1 px-3 py-2 text-xs text-center text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium">
                      ⚙️
                    </Link>
                    <button onClick={handleLogout} className="flex-1 px-3 py-2 text-xs text-center text-red-600 hover:bg-red-50 rounded-xl transition-all font-semibold">
                      🚪
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" className="block w-full px-4 py-2.5 text-sm text-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-semibold">
                    Sign In
                  </Link>
                  <Link to="/register" className="block w-full px-4 py-2.5 text-sm text-center text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all font-semibold shadow-md shadow-blue-200">
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 flex flex-col items-center gap-3">
              {isAuthenticated ? (
                <div className="relative w-9 h-9">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-xs">{getInitials(user?.fullName)}</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                </div>
              ) : (
                <Link to="/login" className="text-xl hover:scale-110 transition-transform" title="Sign In">👤</Link>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}