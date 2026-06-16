import React, { useState } from 'react';
import { useWorkflowStore } from '../store/workflowStore';

export default function Settings() {
  const { workflows, toggleWorkflow } = useWorkflowStore();

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Funnels</h2>
        {workflows.map((wf) => (
          <div key={wf.id} className="flex items-center justify-between p-4 border rounded-lg mb-2">
            <div>
              <div className="font-medium">{wf.name}</div>
              <div className="text-sm text-gray-500">Targets: {wf.targets.join(', ')}</div>
            </div>
            <button
              onClick={() => toggleWorkflow(wf.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${wf.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
            >
              {wf.active ? 'Active' : 'Inactive'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
