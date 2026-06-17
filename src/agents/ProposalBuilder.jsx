import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import { openRouterAI } from '../services/openrouter';
import toast from 'react-hot-toast';

export default function ProposalBuilder() {
  const { leads } = useLeadStore();
  const { activeWorkflow } = useWorkflowStore();
  const [selectedLead, setSelectedLead] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [services, setServices] = useState([]);
  const [pricing, setPricing] = useState('professional');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [discount, setDiscount] = useState(0);
  const printRef = useRef(null);

  const qualifiedLeads = leads.filter(l => l.status === 'qualified' || l.status === 'meeting_booked');

  const serviceOptions = activeWorkflow === 'marketing' 
    ? ['SEO', 'AEO', 'GEO', 'Google Ads', 'Meta Ads', 'LinkedIn Ads', 'Web Development', 'Content Marketing', 'Social Media Management', 'Email Marketing']
    : ['Bookkeeping', 'Payroll', 'Tax Filing', 'CFO Services', 'Financial Planning', 'Audit Support', 'Business Valuation', 'QuickBooks Setup'];

  const pricingOptions = [
    { id: 'starter', label: 'Starter', price: 1500, timeline: 'Month 1: Setup & onboarding\nMonth 2-3: Initial optimization\nMonth 4-6: Growth & scaling' },
    { id: 'professional', label: 'Professional', price: 3500, timeline: 'Month 1: Full setup & strategy\nMonth 2-3: Implementation & optimization\nMonth 4-6: Advanced campaigns & reporting' },
    { id: 'enterprise', label: 'Enterprise', price: 7000, timeline: 'Month 1: Comprehensive audit & strategy\nMonth 2-3: Full implementation\nMonth 4-6: Multi-channel optimization\nMonth 7-12: Scale & dominate' },
    { id: 'custom', label: 'Custom', price: 0, timeline: 'To be discussed based on scope' },
  ];

  const selectedPlan = pricingOptions.find(p => p.id === pricing);
  const selectedPrice = selectedPlan?.price || 0;
  const discountedPrice = Math.round(selectedPrice - (selectedPrice * discount / 100));

  // Generate proper summary based on inputs
  const generateSummary = (leadName, leadIndustry, leadCity) => {
    const serviceList = services.slice(0, 3).join(', ');
    const remainingCount = services.length > 3 ? ` and ${services.length - 3} more services` : '';
    const planName = selectedPlan?.label || 'Professional';
    
    if (leadIndustry && leadCity) {
      return `This comprehensive proposal outlines our ${planName} ${activeWorkflow === 'marketing' ? 'digital marketing' : 'accounting'} services package for ${leadName}, a leading ${leadIndustry} business in ${leadCity}. We will deliver ${serviceList}${remainingCount} to drive measurable growth and maximize ROI. Our team brings proven expertise and a track record of success in the ${leadIndustry} sector.`;
    } else if (leadIndustry) {
      return `This proposal details our ${planName} ${activeWorkflow === 'marketing' ? 'digital marketing' : 'accounting'} services for ${leadName}, a ${leadIndustry} business. We will provide ${serviceList}${remainingCount} to enhance your operations and deliver exceptional results.`;
    } else {
      return `This proposal outlines our recommended ${planName} ${activeWorkflow === 'marketing' ? 'digital marketing' : 'accounting'} services for ${leadName}. Our package includes ${serviceList}${remainingCount} designed to meet your specific needs and goals.`;
    }
  };

  // Generate proper timeline
  const generateTimeline = () => {
    const baseTimeline = selectedPlan?.timeline || 'Month 1: Setup & strategy\nMonth 2-3: Implementation\nMonth 4-6: Optimization & growth';
    const serviceLines = services.map((s, i) => `• ${s}: Ongoing management with monthly reporting`);
    return `${baseTimeline}\n\nKey Deliverables:\n${serviceLines.slice(0, 5).join('\n')}`;
  };

  // Generate proper next steps
  const generateNextSteps = (leadName, leadEmail) => {
    const steps = [
      `1. Review this proposal in detail`,
      `2. Schedule a 15-minute clarification call${leadEmail ? ` - we'll email ${leadEmail}` : ''}`,
      `3. Sign the digital service agreement`,
      `4. Complete ${leadName || 'client'} onboarding questionnaire`,
      `5. Kickoff meeting within 48 hours of signing`,
      `6. First month deliverables begin immediately`,
    ];
    return steps.join('\n');
  };

  // Generate proper terms
  const generateTerms = () => {
    return `• Monthly billing cycle (first month upfront)\n• 30-day written cancellation notice\n• All reports and analytics included\n• Dedicated account manager assigned\n• Quarterly strategy review meetings\n• Performance guaranteed or money back`;
  };

  const generateProposal = async () => {
    if (!selectedLead && !clientName) { toast.error('Select a lead or enter client name'); return; }
    if (services.length === 0) { toast.error('Select at least one service'); return; }
    
    const leadName = selectedLead?.businessName || clientName || 'Valued Client';
    const leadIndustry = selectedLead?.industry || '';
    const leadCity = selectedLead?.city || '';
    const leadEmail = selectedLead?.email || clientEmail || '';
    
    setGenerating(true);
    
    // Always generate locally first (guaranteed non-empty)
    const localProposal = {
      title: `${activeWorkflow === 'marketing' ? 'Digital Marketing' : 'Accounting & Financial'} Services Proposal`,
      subtitle: `Prepared exclusively for ${leadName}`,
      executiveSummary: generateSummary(leadName, leadIndustry, leadCity),
      scopeOfWork: services.map(s => `${s} — Complete management, optimization, and detailed monthly reporting`),
      timeline: generateTimeline(),
      investment: discountedPrice > 0 ? `$${discountedPrice.toLocaleString()}/month` : 'Custom Quote',
      terms: generateTerms(),
      nextSteps: generateNextSteps(leadName, leadEmail),
      planName: selectedPlan?.label || 'Professional',
      preparedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      validUntil: validUntil ? new Date(validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '30 days from date of issue',
    };
    
    setProposal(localProposal);
    
    // Try AI enhancement
    try {
      const aiResult = await openRouterAI.callAI([{ 
        role: 'user', 
        content: `Enhance this proposal. Keep same structure but make it more compelling. Return JSON: ${JSON.stringify({title:localProposal.title,executiveSummary:localProposal.executiveSummary,scopeOfWork:localProposal.scopeOfWork,timeline:localProposal.timeline,terms:localProposal.terms,nextSteps:localProposal.nextSteps})}` 
      }]);
      
      if (aiResult?.executiveSummary && aiResult.executiveSummary.length > 50) {
        setProposal({ ...localProposal, ...aiResult });
        toast.success('Proposal enhanced with AI!');
      }
    } catch (e) {
      // Keep local proposal if AI fails
      toast.success('Proposal generated!');
    }
    
    setGenerating(false);
  };

  const downloadPDF = () => {
    if (!proposal) return;
    const leadName = selectedLead?.businessName || clientName || 'Client';
    
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Proposal - ${leadName}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#1f2937;line-height:1.6}
.cover{background:linear-gradient(135deg,#4c1d95,#7c3aed,#2563eb);color:#fff;padding:80px 60px;text-align:center;min-height:400px;display:flex;flex-direction:column;justify-content:center}
.cover h1{font-size:34px;margin-bottom:8px}.cover .sub{font-size:16px;opacity:.9}.cover .date{margin-top:25px;font-size:13px;opacity:.75}
.section{padding:35px 60px}.section-title{font-size:20px;font-weight:bold;color:#4c1d95;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-bottom:18px}
.service-item{display:flex;align-items:flex-start;gap:10px;padding:10px 14px;background:#f5f3ff;border-left:3px solid #7c3aed;margin-bottom:8px;font-size:14px}
.price-box{background:linear-gradient(135deg,#4c1d95,#7c3aed);color:#fff;padding:25px;border-radius:12px;text-align:center;margin:15px 0}
.price-amount{font-size:42px;font-weight:bold}.price-period{font-size:14px;opacity:.85}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:15px}
.info-card{background:#f9fafb;padding:18px;border-radius:10px;border:1px solid #e5e7eb;font-size:14px}
.info-card strong{display:block;margin-bottom:6px;color:#4c1d95}
.footer{background:#1f2937;color:#fff;padding:25px 60px;text-align:center;font-size:11px}
@media print{body{-webkit-print-color-adjust:exact}.section{page-break-inside:avoid}}
</style></head><body>
<div class="cover">
<div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-bottom:15px">Professional Services Proposal</div>
<h1>${proposal.title}</h1>
<div class="sub">${proposal.subtitle}</div>
<div class="date">Prepared: ${proposal.preparedDate} | Valid Until: ${proposal.validUntil}</div>
</div>
<div class="section"><h2 class="section-title">Executive Summary</h2><p style="font-size:15px;color:#4b5563;line-height:1.7">${proposal.executiveSummary}</p></div>
<div class="section"><h2 class="section-title">Scope of Work</h2>${proposal.scopeOfWork.map(s => `<div class="service-item">✓ ${s}</div>`).join('')}</div>
<div class="section"><h2 class="section-title">Investment</h2><div class="price-box"><div class="price-amount">${proposal.investment}</div><div class="price-period">${proposal.planName} Plan</div>${discount > 0 ? `<div style="margin-top:8px;font-size:13px;text-decoration:line-through;opacity:.7">$${selectedPrice.toLocaleString()}/mo original</div><div style="font-size:13px;color:#fbbf24">${discount}% Discount Applied</div>` : ''}</div></div>
<div class="section"><h2 class="section-title">Timeline & Terms</h2><div class="grid2"><div class="info-card"><strong>Timeline</strong><p style="white-space:pre-line">${proposal.timeline}</p></div><div class="info-card"><strong>Terms & Conditions</strong><p style="white-space:pre-line">${proposal.terms}</p></div></div></div>
<div class="section"><h2 class="section-title">Next Steps</h2><p style="font-size:15px;color:#4b5563;white-space:pre-line;line-height:1.8">${proposal.nextSteps}</p></div>
<div class="footer"><p style="font-size:15px;margin-bottom:8px"><strong>Nuage Digital</strong></p><p>nuage-digital.com | contact@nuage-digital.com</p><p style="margin-top:12px;opacity:.7">This proposal is confidential. © ${new Date().getFullYear()} Nuage Digital. All rights reserved.</p></div>
</body></html>`;

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); toast.success('🖨️ Print → Save as PDF'); }, 1000);
  };

  const downloadTXT = () => {
    if (!proposal) return;
    const text = `PROFESSIONAL SERVICES PROPOSAL\n${'='.repeat(50)}\n${proposal.title}\n${proposal.subtitle}\n\nDate: ${proposal.preparedDate}\nValid Until: ${proposal.validUntil}\n\nEXECUTIVE SUMMARY\n${'-'.repeat(50)}\n${proposal.executiveSummary}\n\nSCOPE OF WORK\n${'-'.repeat(50)}\n${proposal.scopeOfWork.join('\n')}\n\nINVESTMENT: ${proposal.investment} (${proposal.planName} Plan)${discount > 0 ? ` - ${discount}% Discount` : ''}\n\nTIMELINE:\n${proposal.timeline}\n\nTERMS:\n${proposal.terms}\n\nNEXT STEPS:\n${proposal.nextSteps}\n\nGenerated by Nuage Digital | nuage-digital.com`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `Proposal-${(selectedLead?.businessName || clientName || 'client').replace(/\s+/g, '-')}.txt`; a.click();
    toast.success('Downloaded!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">📄 Proposal Builder</h1><p className="text-sm text-gray-500">Professional proposals with guaranteed complete data</p></div>
        <button onClick={generateProposal} disabled={generating || (!selectedLead && !clientName) || services.length === 0} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 whitespace-nowrap">
          {generating ? '⏳ Generating...' : '✨ Generate Proposal'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">👤 Client</h3>
            <select value={selectedLead?.id || ''} onChange={e => { const lead = qualifiedLeads.find(l => l.id == e.target.value); setSelectedLead(lead); if (lead) { setClientName(lead.businessName); setClientEmail(lead.email || ''); } }} className="w-full px-3 py-2 border rounded-lg text-sm mb-2">
              <option value="">Select qualified lead...</option>
              {qualifiedLeads.map(l => <option key={l.id} value={l.id}>{l.businessName} - {l.industry}</option>)}
            </select>
            <div className="text-xs text-gray-400 mb-2 text-center">— or manually —</div>
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Business Name" className="w-full px-3 py-2 border rounded-lg text-sm mb-2" />
            <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex justify-between mb-3"><h3 className="font-semibold text-sm">📋 Services</h3><span className="text-xs text-gray-500">{services.length} selected</span></div>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {serviceOptions.map(s => (
                <button key={s} onClick={() => setServices(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${services.includes(s) ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-sm mb-3">💰 Pricing</h3>
            <div className="space-y-2 mb-3">
              {pricingOptions.map(p => (
                <button key={p.id} onClick={() => setPricing(p.id)}
                  className={`w-full text-left p-3 rounded-lg text-sm transition-all ${pricing === p.id ? 'bg-purple-50 border-2 border-purple-300' : 'bg-gray-50 border hover:bg-gray-100'}`}>
                  <div className="flex justify-between"><span className="font-medium">{p.label}</span><span className="text-purple-600 font-bold">${p.price.toLocaleString()}/mo</span></div>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1"><label className="text-xs text-gray-500">Discount %</label><input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min="0" max="50" className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
                <div className="flex-1"><label className="text-xs text-gray-500">Valid Until</label><input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="w-full px-3 py-1.5 border rounded-lg text-sm" /></div>
              </div>
              {pricing !== 'custom' && <div className="p-3 bg-green-50 rounded-lg text-center"><span className="text-sm font-bold text-green-700">${discountedPrice.toLocaleString()}/mo</span>{discount > 0 && <span className="text-xs text-green-600 ml-1">({discount}% off)</span>}</div>}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {proposal ? (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden" ref={printRef}>
              <div className="bg-gradient-to-r from-purple-800 via-purple-600 to-blue-600 text-white p-8 sm:p-10 text-center">
                <div className="text-xs uppercase tracking-widest mb-3 opacity-80">Professional Services Proposal</div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">{proposal.title}</h2>
                <p className="text-purple-100 text-sm">{proposal.subtitle}</p>
                <p className="text-purple-200 text-xs mt-3">{proposal.preparedDate} | Valid: {proposal.validUntil}</p>
              </div>
              <div className="p-6 space-y-5">
                <div><h4 className="font-semibold text-gray-700 text-sm mb-2">Executive Summary</h4><p className="text-sm text-gray-600 leading-relaxed">{proposal.executiveSummary}</p></div>
                <div><h4 className="font-semibold text-gray-700 text-sm mb-2">Scope of Work</h4>{proposal.scopeOfWork.map((s, i) => (<div key={i} className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg mb-1.5 text-sm"><span className="text-purple-600 font-bold mt-0.5">✓</span><span className="text-gray-700">{s}</span></div>))}</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl text-center"><div className="text-2xl font-bold">{proposal.investment}</div><div className="text-xs text-purple-100">{proposal.planName} Plan</div>{discount > 0 && <div className="text-xs text-purple-200 line-through mt-1">${selectedPrice.toLocaleString()}/mo</div>}</div>
                  <div className="p-4 bg-gray-50 rounded-xl"><h4 className="font-semibold text-sm text-gray-700">Timeline</h4><p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{proposal.timeline}</p></div>
                </div>
                <div className="grid grid-cols-2 gap-4"><div className="p-4 bg-gray-50 rounded-xl"><h4 className="font-semibold text-sm text-gray-700">Terms</h4><p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{proposal.terms}</p></div><div className="p-4 bg-gray-50 rounded-xl"><h4 className="font-semibold text-sm text-gray-700">Next Steps</h4><p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{proposal.nextSteps}</p></div></div>
              </div>
              <div className="p-4 bg-gray-50 border-t flex flex-wrap gap-2">
                <button onClick={downloadPDF} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">📄 Print / Save PDF</button>
                <button onClick={downloadTXT} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">📥 Download TXT</button>
                <button onClick={() => setProposal(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-300">New</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-400">
              <p className="text-5xl mb-4">📄</p><p className="font-medium text-gray-500">Select client, services & pricing</p><p className="text-sm mt-1">Click "Generate Proposal" to create</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}