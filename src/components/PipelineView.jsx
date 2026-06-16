import React from 'react';
import { useLeadStore } from '../store/leadStore';

const stages = [
  { key: 'new', label: 'New', color: 'bg-blue-100 text-blue-800' },
  { key: 'analyzed', label: 'Analyzed', color: 'bg-purple-100 text-purple-800' },
  { key: 'outreached', label: 'Outreached', color: 'bg-pink-100 text-pink-800' },
  { key: 'qualified', label: 'Qualified', color: 'bg-green-100 text-green-800' },
  { key: 'meeting_booked', label: 'Meeting Booked', color: 'bg-teal-100 text-teal-800' },
  { key: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-800' },
];

export default function PipelineView() {
  const { leads } = useLeadStore();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Pipeline View</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.key);
          return (
            <div key={stage.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${stage.color}`}>{stageLeads.length}</span>
              </div>
              <div className="space-y-2">
                {stageLeads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="font-medium truncate">{lead.businessName}</div>
                    <div className="text-xs text-gray-500">{lead.industry}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
