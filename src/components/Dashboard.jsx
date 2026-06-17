import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { stats, leads, automationRunning, automationProgress, runFullAutomation, systemLogs } = useLeadStore();
  const { activeWorkflow, workflows } = useWorkflowStore();
  const { user } = useAuthStore();
  
  const activeFunnel = workflows.find(w => w.id === activeWorkflow);
  const funnelLeads = leads.filter(l => l.funnelType === activeWorkflow);
  const isMarketing = activeWorkflow === 'marketing';
  const isAccounting = activeWorkflow === 'accounting';

  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 3000); return () => clearInterval(i); }, []);

  const newCount = funnelLeads.filter(l => l.status === 'new').length;
  const analyzedCount = funnelLeads.filter(l => l.status === 'analyzed').length;
  const outreachedCount = funnelLeads.filter(l => l.status === 'outreached').length;
  const qualifiedCount = funnelLeads.filter(l => l.status === 'qualified').length;
  const meetingCount = funnelLeads.filter(l => l.status === 'meeting_booked').length;
  const convertedCount = funnelLeads.filter(l => l.status === 'converted').length;

  const handleRunPipeline = () => {
    if (newCount === 0) { toast.error('No new leads! Go to Lead Finder first.'); return; }
    runFullAutomation(activeWorkflow);
  };

  // Marketing Services
  const marketingServices = [
    { name: 'SEO', icon: '🔍', desc: 'Search Engine Optimization' },
    { name: 'AEO', icon: '🤖', desc: 'Answer Engine Optimization' },
    { name: 'GEO', icon: '🧠', desc: 'Generative Engine Optimization' },
    { name: 'Google Ads', icon: '🎯', desc: 'PPC Campaigns' },
    { name: 'Local Ads', icon: '📍', desc: 'Local Service Ads' },
    { name: 'Meta Ads', icon: '📘', desc: 'Facebook & Instagram' },
    { name: 'LinkedIn Ads', icon: '💼', desc: 'B2B Advertising' },
    { name: 'Reddit Ads', icon: '🤖', desc: 'Community Targeting' },
    { name: 'Digital Plan', icon: '📋', desc: 'Full Strategy' },
    { name: 'Website Dev', icon: '🌐', desc: 'Web Development' },
  ];

  // Accounting Services
  const accountingServices = [
    { name: 'Bookkeeping', icon: '📚', desc: 'Daily Transaction Recording', color: 'green' },
    { name: 'Payroll', icon: '💵', desc: 'Employee Salary Management', color: 'blue' },
    { name: 'Tax Filing', icon: '📝', desc: 'Federal & State Returns', color: 'red' },
    { name: 'CFO Services', icon: '💼', desc: 'Strategic Financial Advisory', color: 'purple' },
    { name: 'Financial Planning', icon: '📊', desc: 'Budgeting & Forecasting', color: 'indigo' },
    { name: 'Audit Support', icon: '🔍', desc: 'IRS Audit Representation', color: 'orange' },
    { name: 'Business Valuation', icon: '💰', desc: 'Company Worth Assessment', color: 'teal' },
    { name: 'QuickBooks Setup', icon: '💻', desc: 'Software Implementation', color: 'emerald' },
    { name: 'AP/AR Management', icon: '📋', desc: 'Payables & Receivables', color: 'cyan' },
    { name: 'Tax Planning', icon: '🧮', desc: 'Strategic Tax Strategy', color: 'violet' },
    { name: 'Cash Flow Mgmt', icon: '📈', desc: 'Liquidity Optimization', color: 'amber' },
    { name: 'Entity Structure', icon: '🏢', desc: 'LLC/S-Corp Consulting', color: 'slate' },
  ];

  const services = isMarketing ? marketingServices : accountingServices;
  const funnelColor = isMarketing ? 'blue' : 'green';
  const funnelBg = isMarketing ? 'bg-blue-50' : 'bg-green-50';
  const funnelBorder = isMarketing ? 'border-blue-200' : 'border-green-200';
  const funnelText = isMarketing ? 'text-blue-600' : 'text-green-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isMarketing ? '📈 Marketing' : '📊 Accounting'} Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {funnelLeads.length > 0 
              ? `${funnelLeads.length} leads in ${activeFunnel?.name} funnel`
              : 'Start finding leads to build your pipeline'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/agents/find" className={`px-4 py-2.5 bg-${funnelColor}-600 text-white rounded-xl hover:bg-${funnelColor}-700 font-medium text-sm shadow-sm whitespace-nowrap`}>
            🔍 Find Leads
          </Link>
          <button onClick={handleRunPipeline} disabled={automationRunning || newCount === 0}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 font-medium text-sm shadow-sm whitespace-nowrap">
            {automationRunning ? '⏳ Running...' : '🚀 Run Pipeline'}
          </button>
        </div>
      </div>

      {/* Automation Progress */}
      {automationRunning && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold">🤖 AI Pipeline Running</span>
            <span className="text-sm">{automationProgress.current}/{automationProgress.total}</span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-2.5">
            <div className="bg-white h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${automationProgress.total > 0 ? (automationProgress.current / automationProgress.total) * 100 : 0}%` }} />
          </div>
          <p className="text-sm mt-2 text-white/80">{automationProgress.agent}: {automationProgress.status}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: funnelLeads.length, icon: '📊' },
          { label: 'New', value: newCount, icon: '🆕' },
          { label: 'Analyzed', value: analyzedCount, icon: '🌐' },
          { label: 'Qualified', value: qualifiedCount, icon: '✅' },
          { label: 'Meetings', value: meetingCount, icon: '📅' },
          { label: 'Converted', value: convertedCount, icon: '🎉' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
            <div className="text-lg sm:text-2xl mb-1">{stat.icon}</div>
            <div className={`text-xl sm:text-2xl font-bold text-${funnelColor}-600`}>{stat.value}</div>
            <div className="text-[10px] sm:text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Funnel-Specific Services & Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <div className={`bg-white rounded-xl shadow-sm border-2 p-5 ${funnelBorder}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${funnelBg}`}>
              {isMarketing ? '📈' : '📊'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">
                {isMarketing ? 'Digital Marketing' : 'Accounting & Financial'} Services
              </h3>
              <p className="text-xs text-gray-500">{services.length} professional services</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {services.map((service, i) => (
              <div key={i} className={`p-3 rounded-lg text-center hover:shadow-sm transition-all cursor-pointer ${funnelBg} hover:bg-${funnelColor}-100`}>
                <div className="text-xl mb-1">{service.icon}</div>
                <div className="text-[11px] font-semibold text-gray-700">{service.name}</div>
                <div className="text-[9px] text-gray-500">{service.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Checklist - Different for each funnel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🔍</div>
            <div>
              <h3 className="font-bold text-gray-900">
                {isMarketing ? 'Marketing Audit' : 'Financial Audit'} Checklist
              </h3>
              <p className="text-xs text-gray-500">{activeFunnel?.auditChecks?.length || 0} audit points</p>
            </div>
            <Link to={isMarketing ? "/agents/analyze" : "/agents/qualify"} className="ml-auto text-xs text-purple-600 hover:text-purple-700 font-medium whitespace-nowrap">
              Run Audit →
            </Link>
          </div>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {activeFunnel?.auditChecks?.length > 0 ? (
              activeFunnel.auditChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span className="text-sm text-gray-700 flex-1">{check}</span>
                  <span className="text-[10px] text-gray-400 bg-white px-2 py-0.5 rounded-full">Pending</span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No audit checks configured</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/agents/find" className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">🔍</div>
          <h3 className="font-semibold text-sm text-gray-900">Find Leads</h3>
          <p className="text-xs text-gray-500 mt-1">
            {isMarketing ? 'Discover businesses' : 'Find companies'}
          </p>
          <div className={`mt-2 text-xs text-${funnelColor}-600 font-medium`}>{newCount} new leads</div>
        </Link>
        <Link to="/agents/analyze" className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">🌐</div>
          <h3 className="font-semibold text-sm text-gray-900">
            {isMarketing ? 'Website Audit' : 'Financial Review'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {isMarketing ? 'SEO & performance' : 'Books & compliance'}
          </p>
          <div className="mt-2 text-xs text-purple-600 font-medium">{analyzedCount} analyzed</div>
        </Link>
        <Link to="/agents/outreach" className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">📧</div>
          <h3 className="font-semibold text-sm text-gray-900">Outreach</h3>
          <p className="text-xs text-gray-500 mt-1">
            {isMarketing ? 'Marketing emails' : 'Service proposals'}
          </p>
          <div className="mt-2 text-xs text-indigo-600 font-medium">{outreachedCount} sent</div>
        </Link>
        <Link to="/agents/book" className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow group">
          <div className="text-2xl sm:text-3xl mb-2 group-hover:scale-110 transition-transform">📅</div>
          <h3 className="font-semibold text-sm text-gray-900">
            {isMarketing ? 'Strategy Call' : 'Consultation'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">Book meetings</p>
          <div className="mt-2 text-xs text-teal-600 font-medium">{meetingCount} booked</div>
        </Link>
      </div>

      {/* Recent Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm sm:text-lg text-gray-900">Recent Leads</h2>
            <p className="text-[10px] sm:text-xs text-gray-500">{funnelLeads.length} leads in {activeFunnel?.name}</p>
          </div>
          <Link to="/agents/find" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</Link>
        </div>
        {funnelLeads.length === 0 ? (
          <div className="text-center py-12 sm:py-16 text-gray-500 px-4">
            <p className="text-3xl sm:text-4xl mb-3">🔍</p>
            <p className="text-base sm:text-lg font-medium">No leads yet</p>
            <p className="text-xs sm:text-sm mt-1">
              {isMarketing 
                ? 'Start finding businesses that need digital marketing services.'
                : 'Start finding businesses that need accounting & financial services.'}
            </p>
            <Link to="/agents/find" className={`inline-block mt-4 px-5 py-2.5 bg-${funnelColor}-600 text-white rounded-lg text-sm hover:bg-${funnelColor}-700`}>
              Find {isMarketing ? 'Marketing' : 'Accounting'} Leads
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="lg:hidden divide-y">
              {funnelLeads.slice(0, 10).map((lead) => (
                <Link key={lead.id} to={`/lead/${lead.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 bg-gradient-to-br from-${funnelColor}-400 to-${funnelColor}-600 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xs">{lead.businessName?.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">{lead.businessName}</div>
                      <div className="text-[10px] text-gray-500">{lead.industry} • {lead.city}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-medium capitalize flex-shrink-0 ml-2 ${
                    lead.status === 'new' ? 'bg-blue-100 text-blue-700' : lead.status === 'qualified' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                  }`}>{lead.status?.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
            <table className="w-full hidden lg:table">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Business</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Industry</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody>
                {funnelLeads.slice(0, 10).map((lead) => (
                  <tr key={lead.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link to={`/lead/${lead.id}`} className="font-medium text-sm text-blue-600 hover:underline">{lead.businessName}</Link>
                      <div className="text-xs text-gray-500">{lead.email}</div>
                    </td>
                    <td className="py-3 px-4"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{lead.industry}</span></td>
                    <td className="py-3 px-4 text-xs text-gray-500 capitalize">{lead.source?.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${
                        lead.status === 'new' ? 'bg-blue-100 text-blue-700' : lead.status === 'analyzed' ? 'bg-purple-100 text-purple-700' : lead.status === 'qualified' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
                      }`}>{lead.status?.replace('_', ' ')}</span>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold">{lead.score || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button onClick={handleRunPipeline} disabled={automationRunning || newCount === 0}
          className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-medium text-center text-sm">
          <div className="text-xl sm:text-2xl mb-1">🚀</div>
          <div>Run Pipeline</div>
        </button>
        <Link to="/pipeline" className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg font-medium text-center text-sm">
          <div className="text-xl sm:text-2xl mb-1">📈</div>
          <div>Pipeline</div>
        </Link>
        <Link to="/analytics" className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg font-medium text-center text-sm">
          <div className="text-xl sm:text-2xl mb-1">📊</div>
          <div>Analytics</div>
        </Link>
        <Link to="/agents/find" className={`p-4 bg-gradient-to-r from-${funnelColor}-500 to-${funnelColor}-600 text-white rounded-xl hover:shadow-lg font-medium text-center text-sm`}>
          <div className="text-xl sm:text-2xl mb-1">🔍</div>
          <div>Find Leads</div>
        </Link>
      </div>
    </div>
  );
}