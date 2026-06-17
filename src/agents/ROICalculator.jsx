import React, { useState } from 'react';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import toast from 'react-hot-toast';

export default function ROICalculator() {
  const { leads } = useLeadStore();
  const { activeWorkflow } = useWorkflowStore();
  const isMarketing = activeWorkflow === 'marketing';
  
  const [form, setForm] = useState({
    monthlyAdSpend: 2000,
    avgSaleValue: isMarketing ? 500 : 2000,
    currentLeads: 20,
    conversionRate: 5,
    serviceCost: isMarketing ? 1500 : 2000,
    projectedGrowth: 30,
    clientName: '',
  });

  const [result, setResult] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [history, setHistory] = useState([]);

  const qualifiedLeads = leads.filter(l => l.status === 'qualified' || l.status === 'meeting_booked' || l.status === 'converted');

  const calculate = () => {
    const { monthlyAdSpend, avgSaleValue, currentLeads, conversionRate, serviceCost, projectedGrowth } = form;
    
    const currentConversions = currentLeads * (conversionRate / 100);
    const currentRevenue = currentConversions * avgSaleValue;
    const projectedLeads = Math.round(currentLeads * (1 + projectedGrowth / 100));
    const projectedConversions = projectedLeads * (conversionRate / 100);
    const projectedRevenue = projectedConversions * avgSaleValue;
    const totalInvestment = serviceCost + monthlyAdSpend;
    const monthlyProfit = projectedRevenue - totalInvestment;
    const roi = ((monthlyProfit / totalInvestment) * 100).toFixed(1);
    const annualProfit = monthlyProfit * 12;
    const revenueIncrease = projectedRevenue - currentRevenue;
    const paybackMonths = revenueIncrease > 0 ? (totalInvestment / (revenueIncrease)).toFixed(1) : 'N/A';
    const breakEvenPoint = revenueIncrease > 0 ? Math.ceil(totalInvestment / (revenueIncrease / 30)) : 'N/A';

    const calculated = {
      currentConversions: Math.round(currentConversions),
      currentRevenue: currentRevenue.toLocaleString(),
      projectedLeads,
      projectedConversions: Math.round(projectedConversions),
      projectedRevenue: projectedRevenue.toLocaleString(),
      revenueIncrease: revenueIncrease.toLocaleString(),
      totalInvestment: totalInvestment.toLocaleString(),
      monthlyProfit: monthlyProfit.toLocaleString(),
      roi: roi,
      annualProfit: annualProfit.toLocaleString(),
      paybackMonths,
      breakEvenPoint,
      isProfitable: monthlyProfit > 0,
      roiPercentage: Number(roi),
    };

    setResult(calculated);
    setHistory(prev => [{
      id: Date.now(),
      client: selectedLead?.businessName || form.clientName || 'Custom',
      roi: roi,
      profit: monthlyProfit.toLocaleString(),
      date: new Date().toISOString(),
      form: { ...form },
    }, ...prev].slice(0, 20));

    toast.success(`ROI: ${roi}%`);
  };

  const loadLeadData = (lead) => {
    setSelectedLead(lead);
    setForm(prev => ({
      ...prev,
      clientName: lead.businessName || '',
      avgSaleValue: isMarketing ? 500 : 2000,
      serviceCost: isMarketing ? 1500 : 2000,
    }));
  };

  const resetForm = () => {
    setForm({
      monthlyAdSpend: 2000,
      avgSaleValue: isMarketing ? 500 : 2000,
      currentLeads: 20,
      conversionRate: 5,
      serviceCost: isMarketing ? 1500 : 2000,
      projectedGrowth: 30,
      clientName: '',
    });
    setResult(null);
    setSelectedLead(null);
  };

  const downloadReport = () => {
    if (!result) return;
    const text = `ROI ANALYSIS REPORT
${'='.repeat(40)}
Client: ${selectedLead?.businessName || form.clientName || 'Custom'}
Service: ${isMarketing ? 'Digital Marketing' : 'Accounting Services'}
Date: ${new Date().toLocaleDateString()}

INPUT PARAMETERS
${'-'.repeat(40)}
Monthly Ad Spend: $${form.monthlyAdSpend.toLocaleString()}
Average Sale Value: $${form.avgSaleValue.toLocaleString()}
Current Leads/month: ${form.currentLeads}
Conversion Rate: ${form.conversionRate}%
Service Cost: $${form.serviceCost.toLocaleString()}
Projected Growth: ${form.projectedGrowth}%

RESULTS
${'-'.repeat(40)}
Current Revenue: $${result.currentRevenue}/mo
Projected Revenue: $${result.projectedRevenue}/mo
Revenue Increase: $${result.revenueIncrease}/mo
Total Investment: $${result.totalInvestment}/mo
Monthly Profit: $${result.monthlyProfit}/mo
ROI: ${result.roi}%
Annual Profit: $${result.annualProfit}/yr
Payback Period: ${result.paybackMonths} months
Break-even: ${result.breakEvenPoint} days
Status: ${result.isProfitable ? '✅ PROFITABLE' : '⚠️ NEEDS ADJUSTMENT'}

${result.roiPercentage > 100 ? '🚀 Excellent ROI! Highly recommended.' : result.roiPercentage > 50 ? '👍 Good ROI. Worth investing.' : result.roiPercentage > 0 ? '📊 Moderate ROI. Review parameters.' : '⚠️ Negative ROI. Adjust pricing or reduce costs.'}
`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ROI-Report-${(selectedLead?.businessName || 'custom').replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  const getROIColor = (roi) => {
    if (roi >= 200) return 'text-green-600 bg-green-50';
    if (roi >= 100) return 'text-emerald-600 bg-emerald-50';
    if (roi >= 50) return 'text-blue-600 bg-blue-50';
    if (roi >= 0) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">💰 ROI Calculator</h1>
          <p className="text-sm text-gray-500">
            Calculate return on investment for {isMarketing ? 'marketing' : 'accounting'} services
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={resetForm} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium">Reset</button>
          <button onClick={calculate} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">📊 Calculate ROI</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          {/* Lead Selection */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">👤 Client (Optional)</h3>
            <select value={selectedLead?.id || ''} onChange={e => loadLeadData(qualifiedLeads.find(l => l.id == e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
              <option value="">Select qualified lead...</option>
              {qualifiedLeads.slice(0, 20).map(l => <option key={l.id} value={l.id}>{l.businessName}</option>)}
            </select>
            <input type="text" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} placeholder="Or enter client name" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          {/* Parameters */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">📊 Input Parameters</h3>
            <div className="space-y-3">
              {[
                { label: `Monthly Ad Spend ($)`, key: 'monthlyAdSpend', hint: 'Google Ads, Meta Ads, etc.' },
                { label: `Average ${isMarketing ? 'Sale' : 'Client'} Value ($)`, key: 'avgSaleValue', hint: isMarketing ? 'Revenue per sale' : 'Revenue per client' },
                { label: 'Current Leads/Month', key: 'currentLeads', hint: 'Current monthly leads' },
                { label: 'Conversion Rate (%)', key: 'conversionRate', hint: 'Leads that become customers' },
                { label: `${isMarketing ? 'Marketing' : 'Accounting'} Service Cost ($)`, key: 'serviceCost', hint: 'Your monthly fee' },
                { label: 'Projected Growth (%)', key: 'projectedGrowth', hint: 'Expected lead increase' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-700 flex justify-between">
                    <span>{f.label}</span>
                    <span className="text-gray-400">{f.hint}</span>
                  </label>
                  <input type="number" value={form[f.key]} onChange={e => setForm({...form, [f.key]: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-6">
              {/* Main ROI Card */}
              <div className={`p-6 rounded-2xl text-center ${getROIColor(result.roiPercentage)}`}>
                <div className="text-sm font-medium mb-1">Return on Investment</div>
                <div className="text-5xl font-bold mb-2">{result.roi}%</div>
                <div className="text-sm">
                  {result.isProfitable ? '✅ Profitable' : '⚠️ Needs Adjustment'}
                </div>
              </div>

              {/* Detailed Results */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">📊 Detailed Results</h3>
                  <button onClick={downloadReport} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium">📥 Download Report</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Current Revenue', value: `$${result.currentRevenue}/mo`, icon: '📉' },
                    { label: 'Projected Revenue', value: `$${result.projectedRevenue}/mo`, icon: '📈' },
                    { label: 'Revenue Increase', value: `+$${result.revenueIncrease}/mo`, icon: '🚀' },
                    { label: 'Monthly Profit', value: `$${result.monthlyProfit}/mo`, icon: '💰' },
                    { label: 'Annual Profit', value: `$${result.annualProfit}/yr`, icon: '🏦' },
                    { label: 'ROI', value: `${result.roi}%`, icon: '📊' },
                    { label: 'Payback Period', value: `${result.paybackMonths} months`, icon: '⏱️' },
                    { label: 'Break-even', value: `${result.breakEvenPoint} days`, icon: '🎯' },
                    { label: 'Projected Leads', value: `${result.projectedLeads}/mo`, icon: '👥' },
                  ].map(r => (
                    <div key={r.label} className="p-3 bg-gray-50 rounded-lg text-center">
                      <div className="text-lg mb-1">{r.icon}</div>
                      <div className="text-lg font-bold text-gray-900">{r.value}</div>
                      <div className="text-[10px] text-gray-500">{r.label}</div>
                    </div>
                  ))}
                </div>

                {/* Recommendation */}
                <div className={`mt-4 p-4 rounded-xl text-sm font-medium text-center ${
                  result.roiPercentage >= 200 ? 'bg-green-100 text-green-800' :
                  result.roiPercentage >= 100 ? 'bg-emerald-100 text-emerald-800' :
                  result.roiPercentage >= 50 ? 'bg-blue-100 text-blue-800' :
                  result.roiPercentage >= 0 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {result.roiPercentage >= 200 && '🚀 Exceptional ROI! This investment will generate significant returns. Highly recommended to proceed immediately.'}
                  {result.roiPercentage >= 100 && result.roiPercentage < 200 && '👍 Strong ROI! This is a solid investment with good returns. Recommended to proceed.'}
                  {result.roiPercentage >= 50 && result.roiPercentage < 100 && '📊 Good ROI. This investment should generate positive returns. Consider optimizing for better results.'}
                  {result.roiPercentage >= 0 && result.roiPercentage < 50 && '⚠️ Modest ROI. Review parameters - consider reducing costs or increasing pricing.'}
                  {result.roiPercentage < 0 && '❌ Negative ROI. This investment is not profitable. Reduce costs, increase pricing, or adjust strategy.'}
                </div>
              </div>

              {/* Comparison Chart */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-semibold mb-4">📈 Before vs After</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-4 bg-gray-100 rounded-xl">
                    <div className="text-xs text-gray-500 mb-2">CURRENT (Without Service)</div>
                    <div className="text-2xl font-bold text-gray-700">${result.currentRevenue}</div>
                    <div className="text-xs text-gray-500 mt-1">{Math.round(form.currentLeads * (form.conversionRate/100))} customers/mo</div>
                  </div>
                  <div className="p-4 bg-green-100 rounded-xl">
                    <div className="text-xs text-green-700 mb-2">PROJECTED (With Service)</div>
                    <div className="text-2xl font-bold text-green-700">${result.projectedRevenue}</div>
                    <div className="text-xs text-green-600 mt-1">{result.projectedConversions} customers/mo</div>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-green-500 h-3 rounded-full transition-all" style={{width: `${Math.min(100, (result.projectedConversions / (result.currentConversions || 1)) * 100)}%`}} />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
              <p className="text-6xl mb-4">💰</p>
              <p className="font-medium text-gray-500 text-lg">Enter parameters and click Calculate ROI</p>
              <p className="text-sm mt-2">See projected revenue, profit, and payback period</p>
            </div>
          )}
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold mb-4">📋 Recent Calculations ({history.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Client</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">ROI</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Profit/mo</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{h.client}</td>
                    <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getROIColor(Number(h.roi))}`}>{h.roi}%</span></td>
                    <td className="py-2 px-3">${h.profit}</td>
                    <td className="py-2 px-3 text-xs text-gray-500">{new Date(h.date).toLocaleDateString()}</td>
                    <td className="py-2 px-3">
                      <button onClick={() => { setForm(h.form); calculate(); }} className="text-blue-600 text-xs hover:underline">Reload</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}