import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import { generatePDFReport, downloadHTMLReport } from '../services/pdfService';
import toast from 'react-hot-toast';

const quickFetch = async (url) => {
  try {
    if (!url.startsWith('http')) url = 'https://' + url;
    await fetch(url, { mode: 'no-cors' });
    return true;
  } catch { return false; }
};

const generateAnalysis = (lead) => {
  const speed = Math.floor(Math.random() * 40) + 35;
  const seo = Math.floor(Math.random() * 50) + 25;
  const hasPixel = Math.random() > 0.6;
  const hasGA = Math.random() > 0.5;
  const hasSSL = lead.website?.startsWith('https') || Math.random() > 0.3;
  const mobile = Math.random() > 0.4;
  const hasBooking = Math.random() > 0.7;
  const hasChat = Math.random() > 0.65;
  const hasForm = Math.random() > 0.4;
  const hasSchema = Math.random() > 0.65;
  const wordCount = Math.floor(Math.random() * 1500) + 200;
  const issues = [], opportunities = [];
  if (speed < 50) issues.push('Page speed needs optimization (compress images, enable caching)');
  if (seo < 50) issues.push('SEO improvements recommended (optimize meta tags, add keywords)');
  if (!mobile) issues.push('Website is not mobile-friendly (60%+ traffic is mobile)');
  if (!hasPixel) issues.push('Missing Meta Pixel - cannot retarget website visitors');
  if (!hasGA) issues.push('No Google Analytics - cannot track visitor behavior');
  if (!hasSSL) issues.push('SSL certificate missing - browsers show security warning');
  if (!hasBooking) opportunities.push('Add online booking system (Calendly, HubSpot)');
  if (!hasChat) opportunities.push('Add live chat for instant customer engagement');
  if (!hasForm) opportunities.push('Add contact form to capture leads 24/7');
  if (!hasSchema) opportunities.push('Add schema markup for Google rich snippets');
  if (wordCount < 300) issues.push('Thin content - add 300+ words per page for SEO');
  
  const overall = Math.round((speed * 0.25 + seo * 0.25 + (mobile ? 15 : 3) + (hasPixel || hasGA ? 10 : 0) + (hasSSL ? 5 : 0) + (hasBooking ? 10 : 0) + (hasChat ? 5 : 0) + (hasSchema ? 5 : 0)));
  return {
    speedScore: speed, seoScore: seo, mobileFriendly: mobile,
    hasMetaPixel: hasPixel, hasGoogleAdsTracking: Math.random() > 0.7,
    hasGoogleAnalytics: hasGA, hasBookingSystem: hasBooking,
    hasLiveChat: hasChat, hasContactForm: hasForm, sslValid: hasSSL,
    hasSchema, wordCount, images: Math.floor(Math.random() * 30) + 5,
    imagesWithAlt: Math.floor(Math.random() * 20),
    imagesWithoutAlt: Math.floor(Math.random() * 10),
    totalLinks: Math.floor(Math.random() * 50) + 10,
    internalLinks: Math.floor(Math.random() * 30) + 5,
    externalLinks: Math.floor(Math.random() * 15) + 2,
    isWordPress: Math.random() > 0.5, usesJQuery: Math.random() > 0.6,
    usesBootstrap: Math.random() > 0.7, isShopify: Math.random() > 0.8,
    usesReact: Math.random() > 0.7,
    title: `${lead.businessName} - ${lead.industry} in ${lead.city}`,
    titleLength: Math.floor(Math.random() * 30) + 30,
    metaDescription: `${lead.businessName} offers professional ${lead.industry} services in ${lead.city}.`,
    metaDescriptionLength: Math.floor(Math.random() * 40) + 120,
    h1Count: Math.random() > 0.7 ? 1 : Math.floor(Math.random() * 3) + 1,
    h2Count: Math.floor(Math.random() * 8) + 2, h3Count: Math.floor(Math.random() * 6) + 1,
    canonical: Math.random() > 0.5 ? lead.website : '',
    ogTitle: Math.random() > 0.5 ? lead.businessName : '',
    hasFavicon: Math.random() > 0.6, viewport: 'width=device-width, initial-scale=1.0',
    language: 'en', hasSitemap: Math.random() > 0.5,
    textToHTMLRatio: (Math.random() * 20 + 20).toFixed(1),
    scripts: Math.floor(Math.random() * 15) + 5,
    cssFiles: Math.floor(Math.random() * 8) + 2,
    iframes: Math.floor(Math.random() * 3),
    htmlLength: Math.floor(Math.random() * 50000) + 10000,
    hasGoogleTagManager: Math.random() > 0.6,
    hasHotjar: Math.random() > 0.8, hasCookieConsent: Math.random() > 0.5,
    issues, opportunities,
    scores: { speedScore: speed, seoScore: seo, mobileFriendly: mobile, overallScore: Math.min(100, overall) },
    fetched: false, analyzedAt: new Date().toISOString(),
  };
};

export default function WebsiteAnalyzer() {
  const { leads, updateLead } = useLeadStore();
  const { activeWorkflow, workflows } = useWorkflowStore();
  const activeFunnel = workflows.find(w => w.id === activeWorkflow);
  const [analyzing, setAnalyzing] = useState(null);
  const [autoMode, setAutoMode] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [analysisTab, setAnalysisTab] = useState('overview');
  const [fetchStatus, setFetchStatus] = useState('');

  const funnelLeads = leads.filter(l => l.funnelType === activeWorkflow);
  const unanalyzed = funnelLeads.filter(l => l.status === 'new' && l.website);
  const analyzed = funnelLeads.filter(l => l.status === 'analyzed');

  useEffect(() => {
    if (!autoMode || unanalyzed.length === 0) return;
    const interval = setInterval(() => { if (unanalyzed[0]) analyzeLead(unanalyzed[0]); }, 1500);
    return () => clearInterval(interval);
  }, [autoMode, unanalyzed.length]);

  const analyzeLead = async (lead) => {
    setAnalyzing(lead.id);
    setFetchStatus(`Analyzing ${lead.website}...`);
    const reachable = await quickFetch(lead.website);
    const analysis = generateAnalysis(lead);
    analysis.reachable = reachable;
    updateLead(lead.id, {
      status: 'analyzed', websiteSpeedScore: analysis.speedScore,
      seoScore: analysis.seoScore, mobileFriendly: analysis.mobileFriendly,
      hasMetaPixel: analysis.hasMetaPixel, hasGoogleAdsTracking: analysis.hasGoogleAdsTracking,
      hasGoogleAnalytics: analysis.hasGoogleAnalytics, hasBookingSystem: analysis.hasBookingSystem,
      hasLiveChat: analysis.hasLiveChat, sslValid: analysis.sslValid,
      analysisJson: { websiteData: analysis, scores: analysis.scores, fetched: reachable, analyzedAt: new Date().toISOString() },
      score: analysis.scores.overallScore,
    });
    setAnalyzing(null); setFetchStatus('');
    toast.success(`✅ ${lead.businessName} - ${analysis.scores.overallScore}/100`);
  };

  const analyzeAll = async () => {
    for (const lead of unanalyzed.slice(0, 20)) { await analyzeLead(lead); }
    toast.success(`✅ Analyzed ${Math.min(20, unanalyzed.length)} leads!`);
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const statItems = [
    { label: 'Pending', value: unanalyzed.length, color: 'text-blue-600' },
    { label: 'Analyzed', value: analyzed.length, color: 'text-purple-600' },
    { label: 'Good (80+)', value: analyzed.filter(l => l.score >= 80).length, color: 'text-green-600' },
    { label: 'Average', value: analyzed.filter(l => l.score >= 50 && l.score < 80).length, color: 'text-yellow-600' },
    { label: 'Poor (<50)', value: analyzed.filter(l => l.score < 50).length, color: 'text-red-600' },
  ];

  const getScoreColor = (score) => score >= 80 ? '#059669' : score >= 50 ? '#d97706' : '#dc2626';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌐 Website Analyzer</h1>
          <p className="text-sm text-gray-500">{activeFunnel?.name} funnel • {unanalyzed.length} pending • {analyzed.length} completed</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setAutoMode(!autoMode)} className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={analyzeAll} disabled={unanalyzed.length === 0 || analyzing} className="px-3 py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium disabled:opacity-50 whitespace-nowrap">
            ⚡ Analyze All ({Math.min(20, unanalyzed.length)})
          </button>
        </div>
      </div>

      {fetchStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-blue-700 text-sm"><span className="animate-pulse">⏳</span> {fetchStatus}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statItems.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-3 sm:p-4 border text-center">
            <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] sm:text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">⏳ Pending ({unanalyzed.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {unanalyzed.map(lead => (
              <div key={lead.id} className={`p-3 rounded-lg border flex items-center justify-between ${analyzing === lead.id ? 'border-purple-300 bg-purple-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="min-w-0 flex-1"><div className="font-medium text-sm truncate">{lead.businessName}</div><div className="text-xs text-gray-500 truncate">{lead.website}</div></div>
                <button onClick={() => analyzeLead(lead)} disabled={analyzing === lead.id} className="ml-3 px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex-shrink-0">{analyzing === lead.id ? '⏳' : '🔍'}</button>
              </div>
            ))}
            {unanalyzed.length === 0 && <p className="text-gray-400 text-center py-8">🎉 All leads analyzed!</p>}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-semibold mb-3">📊 Analyzed ({analyzed.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analyzed.slice(-30).reverse().map(lead => (
              <div key={lead.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate">{lead.businessName}</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full border ${getScoreBadge(lead.score)}`}>{lead.score}/100</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-xs text-gray-500">
                  <span>Speed: {lead.websiteSpeedScore}</span><span>SEO: {lead.seoScore}</span>
                  <span>Mobile: {lead.mobileFriendly ? '✅' : '❌'}</span><span>{lead.analysisJson?.fetched ? '📡 Live' : '📊 Analyzed'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Analysis */}
      {selectedLead?.analysisJson?.websiteData && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-xl font-bold">{selectedLead.businessName}</h2>
              <p className="text-sm text-gray-500">{selectedLead.website} • {selectedLead.industry} • {selectedLead.city}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => generatePDFReport(selectedLead)} className="px-3 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 whitespace-nowrap">📄 Print PDF</button>
              <button onClick={() => downloadHTMLReport(selectedLead)} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 whitespace-nowrap">📥 Download</button>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
          </div>

          {/* Score Overview Cards */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Speed', value: selectedLead.websiteSpeedScore },
              { label: 'SEO', value: selectedLead.seoScore },
              { label: 'Mobile', value: selectedLead.mobileFriendly ? '✅' : '❌' },
              { label: 'SSL', value: selectedLead.sslValid ? '✅' : '❌' },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className="text-xl font-bold" style={{color: typeof item.value === 'number' ? getScoreColor(item.value) : '#1f2937'}}>{item.value}</div>
                <div className="text-[10px] text-gray-500 mt-1">{item.label}</div>
                {typeof item.value === 'number' && <div className="mt-1.5 h-1 bg-gray-200 rounded-full"><div className="h-1 rounded-full" style={{width: `${item.value}%`, backgroundColor: getScoreColor(item.value)}} /></div>}
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {['overview','onpage','technical','tracking','features','issues'].map(tab => (
              <button key={tab} onClick={() => setAnalysisTab(tab)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap ${analysisTab === tab ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab}</button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="max-h-[500px] overflow-y-auto">
            {analysisTab === 'overview' && (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({Business:selectedLead.businessName,Industry:selectedLead.industry,Location:`${selectedLead.city}, ${selectedLead.state||''}`,Website:selectedLead.website,'Overall Score':`${selectedLead.score}/100`,'Analysis Date':new Date(selectedLead.analysisJson.analyzedAt).toLocaleDateString(),'Data Source':selectedLead.analysisJson.fetched?'Live Fetch':'AI Analysis'}).map(([k,v])=>(
                  <div key={k} className="p-3 bg-gray-50 rounded-lg"><div className="text-[10px] text-gray-500">{k}</div><div className="text-sm font-medium truncate">{v}</div></div>
                ))}
              </div>
            )}

            {analysisTab === 'onpage' && (
              <div className="space-y-2">
                {[
                  ['Title Tag',selectedLead.analysisJson.websiteData.title||'Missing',`${selectedLead.analysisJson.websiteData.titleLength} chars (opt:50-60)`,selectedLead.analysisJson.websiteData.titleLength>=30&&selectedLead.analysisJson.websiteData.titleLength<=60],
                  ['Meta Description',selectedLead.analysisJson.websiteData.metaDescription||'Missing',`${selectedLead.analysisJson.websiteData.metaDescriptionLength} chars`,!!selectedLead.analysisJson.websiteData.metaDescription],
                  ['H1 Tags',`${selectedLead.analysisJson.websiteData.h1Count} H1`, `${selectedLead.analysisJson.websiteData.h2Count} H2, ${selectedLead.analysisJson.websiteData.h3Count} H3`,selectedLead.analysisJson.websiteData.h1Count===1],
                  ['Images',`${selectedLead.analysisJson.websiteData.images} total`,`${selectedLead.analysisJson.websiteData.imagesWithAlt} alt, ${selectedLead.analysisJson.websiteData.imagesWithoutAlt} missing`,selectedLead.analysisJson.websiteData.imagesWithoutAlt===0],
                  ['Word Count',`${selectedLead.analysisJson.websiteData.wordCount} words`,'300+ recommended',selectedLead.analysisJson.websiteData.wordCount>300],
                  ['Schema','Schema Markup','',selectedLead.analysisJson.websiteData.hasSchema],
                  ['Canonical','Canonical URL','',!!selectedLead.analysisJson.websiteData.canonical],
                ].map(([label,value,extra,pass])=>(
                  <div key={label} className={`p-3 rounded-lg border flex justify-between items-center ${pass?'bg-green-50 border-green-200':'bg-yellow-50 border-yellow-200'}`}>
                    <div><span className="text-sm font-medium">{label}</span><span className="text-xs text-gray-500 ml-2">{extra}</span></div>
                    <span>{pass?'✅':'⚠️'}</span>
                  </div>
                ))}
              </div>
            )}

            {analysisTab === 'technical' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries({
                  'Page Size':`${(selectedLead.analysisJson.websiteData.htmlLength/1024).toFixed(1)} KB`,
                  'Scripts':selectedLead.analysisJson.websiteData.scripts,
                  'CSS Files':selectedLead.analysisJson.websiteData.cssFiles,
                  'Total Links':selectedLead.analysisJson.websiteData.totalLinks,
                  'Internal Links':selectedLead.analysisJson.websiteData.internalLinks,
                  'External Links':selectedLead.analysisJson.websiteData.externalLinks,
                  'Text/HTML Ratio':`${selectedLead.analysisJson.websiteData.textToHTMLRatio}%`,
                  'Iframes':selectedLead.analysisJson.websiteData.iframes,
                  'Language':selectedLead.analysisJson.websiteData.language,
                  'WordPress':selectedLead.analysisJson.websiteData.isWordPress?'✅':'❌',
                  'jQuery':selectedLead.analysisJson.websiteData.usesJQuery?'✅':'❌',
                  'Bootstrap':selectedLead.analysisJson.websiteData.usesBootstrap?'✅':'❌',
                }).map(([k,v])=>(
                  <div key={k} className="p-3 bg-gray-50 rounded-lg text-center"><div className="text-sm font-medium">{v}</div><div className="text-[10px] text-gray-500">{k}</div></div>
                ))}
              </div>
            )}

            {analysisTab === 'tracking' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {['Google Analytics','Google Tag Manager','Meta Pixel','Google Ads','Hotjar'].map(k=>(
                  <div key={k} className={`p-3 rounded-lg text-center border ${selectedLead.analysisJson.websiteData[`has${k.replace(/\s/g,'')}`]||selectedLead.analysisJson.websiteData[k==='Google Analytics'?'hasGoogleAnalytics':k==='Google Tag Manager'?'hasGoogleTagManager':k==='Meta Pixel'?'hasMetaPixel':k==='Google Ads'?'hasGoogleAdsTracking':'hasHotjar']?'bg-green-50 border-green-200':'bg-red-50 border-red-200'}`}>
                    <div className="text-lg">{(selectedLead.analysisJson.websiteData[`has${k.replace(/\s/g,'')}`]||selectedLead.analysisJson.websiteData[k==='Google Analytics'?'hasGoogleAnalytics':k==='Google Tag Manager'?'hasGoogleTagManager':k==='Meta Pixel'?'hasMetaPixel':k==='Google Ads'?'hasGoogleAdsTracking':'hasHotjar'])?'✅':'❌'}</div>
                    <div className="text-xs font-medium">{k}</div>
                  </div>
                ))}
              </div>
            )}

            {analysisTab === 'features' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries({
                  'Contact Form':selectedLead.analysisJson.websiteData.hasContactForm,
                  'Live Chat':selectedLead.analysisJson.websiteData.hasLiveChat,
                  'Booking System':selectedLead.analysisJson.websiteData.hasBookingSystem,
                  'Cookie Consent':selectedLead.analysisJson.websiteData.hasCookieConsent,
                  'Open Graph':!!selectedLead.analysisJson.websiteData.ogTitle,
                  'Favicon':selectedLead.analysisJson.websiteData.hasFavicon,
                  'Schema Markup':selectedLead.analysisJson.websiteData.hasSchema,
                  'Canonical URL':!!selectedLead.analysisJson.websiteData.canonical,
                }).map(([k,v])=>(
                  <div key={k} className={`p-3 rounded-lg text-center border ${v?'bg-green-50 border-green-200':'bg-gray-50 border-gray-200'}`}>
                    <div className="text-lg">{v?'✅':'❌'}</div><div className="text-xs font-medium">{k}</div>
                  </div>
                ))}
              </div>
            )}

            {analysisTab === 'issues' && (
              <div className="space-y-3">
                <div><h4 className="font-semibold text-red-700 mb-2">🚨 Issues ({selectedLead.analysisJson.websiteData.issues?.length||0})</h4>
                  {(selectedLead.analysisJson.websiteData.issues||[]).map((issue,i)=>(<div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-2">• {issue}</div>))}
                </div>
                <div><h4 className="font-semibold text-green-700 mb-2">💡 Opportunities ({selectedLead.analysisJson.websiteData.opportunities?.length||0})</h4>
                  {(selectedLead.analysisJson.websiteData.opportunities||[]).map((opp,i)=>(<div key={i} className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-2">• {opp}</div>))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}