import React from 'react';
import { Link } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';

export default function Dashboard() {
  const { stats, leads } = useLeadStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Leads', value: stats.total, color: 'blue' },
          { label: 'Qualified', value: stats.qualified, color: 'green' },
          { label: 'Meetings', value: stats.meetings, color: 'purple' },
          { label: 'Converted', value: stats.converted, color: 'orange' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { to: '/agents/find', icon: '🔍', title: 'Find Leads', desc: 'Search businesses' },
          { to: '/agents/analyze', icon: '🌐', title: 'Analyze Sites', desc: 'Run website audits' },
          { to: '/agents/outreach', icon: '📧', title: 'Outreach', desc: 'Send email campaigns' },
          { to: '/agents/book', icon: '📅', title: 'Meetings', desc: 'Schedule calls' },
        ].map((action) => (
          <Link key={action.to} to={action.to} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="text-3xl mb-3">{action.icon}</div>
            <h3 className="font-semibold text-gray-900">{action.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
        </div>
        {leads.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-lg font-medium">No leads yet</p>
            <p className="text-sm mt-1">Start by finding leads with the Lead Finder agent.</p>
            <Link to="/agents/find" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Find Leads
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="py-3 px-4 text-xs font-medium text-gray-500 uppercase">Score</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 10).map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{lead.businessName}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{lead.industry}</td>
                  <td className="py-3 px-4"><span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 capitalize">{lead.status}</span></td>
                  <td className="py-3 px-4 text-sm">{lead.score || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
