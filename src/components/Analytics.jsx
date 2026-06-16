import React from 'react';
import { useLeadStore } from '../store/leadStore';

export default function Analytics() {
  const { stats } = useLeadStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-4xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-500 mt-2">Total Leads</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-4xl font-bold text-green-600">{stats.qualified}</div>
          <div className="text-sm text-gray-500 mt-2">Qualified</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-4xl font-bold text-purple-600">{stats.meetings}</div>
          <div className="text-sm text-gray-500 mt-2">Meetings</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
          <div className="text-4xl font-bold text-emerald-600">{stats.converted}</div>
          <div className="text-sm text-gray-500 mt-2">Converted</div>
        </div>
      </div>
    </div>
  );
}
