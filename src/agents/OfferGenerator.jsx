import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';
import toast from 'react-hot-toast';

export default function OfferGenerator() {
  const { leads, updateLead } = useLeadStore();
  const [autoMode, setAutoMode] = useState(false);
  const [generating, setGenerating] = useState(null);

  const analyzedLeads = leads.filter(l => l.status === 'analyzed' && !l.personalizedOffer);
  const offersGenerated = leads.filter(l => l.personalizedOffer);

  useEffect(() => {
    let interval;
    if (autoMode && analyzedLeads.length > 0) {
      interval = setInterval(() => {
        const next = analyzedLeads[0];
        if (next) generateOffer(next);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [autoMode, analyzedLeads.length]);

  const generateOffer = (lead) => {
    setGenerating(lead.id);
    
    setTimeout(() => {
      const services = ['SEO Optimization', 'Google Ads', 'Website Redesign', 'Local SEO', 'Social Media Marketing'];
      const service = services[Math.floor(Math.random() * services.length)];
      const painPoints = [];
      if (!lead.mobileFriendly) painPoints.push('mobile optimization');
      if (!lead.hasMetaPixel) painPoints.push('retargeting setup');
      if (!lead.hasBookingSystem) painPoints.push('online booking');
      if ((lead.websiteSpeedScore || 0) < 50) painPoints.push('website speed');
      if ((lead.seoScore || 0) < 50) painPoints.push('local SEO');
      if (painPoints.length === 0) painPoints.push('online presence');
      
      const offer = {
        subject: `Growth opportunity for ${lead.businessName}`,
        opening: `Hi ${lead.contactName || 'there'},`,
        painPoint: `I noticed ${lead.businessName} could improve in ${painPoints.join(', ')}.`,
        solution: `We help ${lead.industry} businesses in ${lead.city} grow through ${service}.`,
        cta: `Would you be open to a 15-minute call?`,
        service: service,
        generatedAt: new Date().toISOString(),
      };
      
      updateLead(lead.id, {
        personalizedOffer: JSON.stringify(offer),
        recommendedService: service,
        painPoints: painPoints,
      });
      
      setGenerating(null);
      if (!autoMode) toast.success(`📝 Offer generated for ${lead.businessName}`);
    }, 1000);
  };

  const generateAll = async () => {
    for (const lead of analyzedLeads) {
      await new Promise(r => setTimeout(r, 500));
      generateOffer(lead);
    }
    toast.success('All offers generated!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📝 Offer Generator Agent</h1>
          <p className="text-gray-500 mt-1">AI-powered personalized offers for each prospect.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAutoMode(!autoMode)} className={`px-4 py-2 rounded-lg text-sm font-medium ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={generateAll} disabled={analyzedLeads.length === 0} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 font-medium">
            ⚡ Generate All ({analyzedLeads.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-blue-600">{analyzedLeads.length}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-pink-600">{offersGenerated.length}</div>
          <div className="text-xs text-gray-500">Generated</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border text-center">
          <div className="text-2xl font-bold text-green-600">{leads.filter(l => l.status === 'outreached').length}</div>
          <div className="text-xs text-gray-500">Outreached</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">⏳ Pending ({analyzedLeads.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analyzedLeads.map(lead => (
              <div key={lead.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{lead.businessName}</div>
                  <div className="text-xs text-gray-500">Score: {lead.score}</div>
                </div>
                <button onClick={() => generateOffer(lead)} disabled={generating === lead.id} className="px-3 py-1 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 disabled:opacity-50">
                  {generating === lead.id ? '⏳' : 'Generate'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">📋 Generated Offers ({offersGenerated.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {offersGenerated.slice(-10).reverse().map(lead => {
              const offer = JSON.parse(lead.personalizedOffer || '{}');
              return (
                <div key={lead.id} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">{lead.businessName}</div>
                  <div className="text-xs text-gray-600 mt-1">{offer.painPoint}</div>
                  <div className="text-xs text-pink-600 mt-1">Service: {offer.service}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}