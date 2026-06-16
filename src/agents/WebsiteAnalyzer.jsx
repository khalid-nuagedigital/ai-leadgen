import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/leadStore';
import { useWorkflowStore } from '../store/workflowStore';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';

// ============ WEBSITE FETCHING SERVICE ============
const fetchWebsiteData = async (url) => {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const response = await fetch(url, {
      mode: 'cors',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }).catch(async () => {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      return fetch(proxyUrl);
    });
    if (!response.ok) throw new Error('Failed to fetch');
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    return {
      url, html, htmlLength: html.length,
      title: doc.querySelector('title')?.textContent || '',
      titleLength: doc.querySelector('title')?.textContent?.length || 0,
      metaDescription: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      metaDescriptionLength: doc.querySelector('meta[name="description"]')?.getAttribute('content')?.length || 0,
      viewport: doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '',
      ogTitle: doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '',
      ogDescription: doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
      ogImage: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
      h1: Array.from(doc.querySelectorAll('h1')).map(h => h.textContent.trim()),
      h1Count: doc.querySelectorAll('h1').length,
      h2Count: doc.querySelectorAll('h2').length,
      h3Count: doc.querySelectorAll('h3').length,
      images: doc.querySelectorAll('img').length,
      imagesWithAlt: Array.from(doc.querySelectorAll('img')).filter(img => img.getAttribute('alt')).length,
      imagesWithoutAlt: Array.from(doc.querySelectorAll('img')).filter(img => !img.getAttribute('alt')).length,
      totalLinks: doc.querySelectorAll('a').length,
      internalLinks: doc.querySelectorAll('a[href^="/"]').length,
      scripts: doc.querySelectorAll('script').length,
      cssFiles: doc.querySelectorAll('link[rel="stylesheet"]').length,
      hasGoogleAnalytics: html.includes('google-analytics.com') || html.includes('gtag') || html.includes('UA-') || html.includes('G-'),
      hasGoogleTagManager: html.includes('googletagmanager.com') || html.includes('GTM-'),
      hasMetaPixel: html.includes('fbq(') || html.includes('facebook.com/tr'),
      hasGoogleAds: html.includes('googleads') || html.includes('AW-'),
      hasHotjar: html.includes('hotjar.com'),
      forms: doc.querySelectorAll('form').length,
      hasContactForm: Array.from(doc.querySelectorAll('form')).some(f => 
        (f.action || '').toLowerCase().includes('contact') || (f.innerHTML || '').toLowerCase().includes('contact')
      ),
      hasSchema: html.includes('application/ld+json') || html.includes('itemscope'),
      hasSSL: url.startsWith('https://'),
      isWordPress: html.includes('wp-content') || html.includes('wp-includes'),
      isShopify: html.includes('shopify.com'),
      usesJQuery: html.includes('jquery'),
      usesBootstrap: html.includes('bootstrap'),
      usesReact: html.includes('react'),
      wordCount: doc.body?.textContent?.trim().split(/\s+/).length || 0,
      canonical: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '',
      hasFavicon: !!doc.querySelector('link[rel="icon"]'),
      language: doc.documentElement.lang || 'en',
      hasLiveChat: html.includes('livechat') || html.includes('tawk.to') || html.includes('zendesk') || html.includes('intercom'),
      hasBookingSystem: html.includes('calendly') || html.includes('booking') || html.includes('appointment'),
      hasCookieConsent: html.includes('cookie') || html.includes('gdpr'),
    };
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};

const calculateScores = (webData) => {
  if (!webData) return null;
  let speedScore = 85;
  const htmlKB = (webData.htmlLength || 0) / 1024;
  if (htmlKB > 500) speedScore -= 30;
  else if (htmlKB > 200) speedScore -= 15;
  if (webData.scripts > 15) speedScore -= 10;
  if (webData.images > 25) speedScore -= 5;
  speedScore = Math.max(10, Math.min(100, speedScore));
  
  let seoScore = 40;
  if (webData.title && webData.titleLength >= 30 && webData.titleLength <= 60) seoScore += 15;
  if (webData.metaDescription && webData.metaDescriptionLength >= 120) seoScore += 10;
  if (webData.h1Count === 1) seoScore += 15;
  if (webData.imagesWithAlt > 0 && webData.imagesWithoutAlt === 0) seoScore += 8;
  if (webData.hasSchema) seoScore += 10;
  if (webData.canonical) seoScore += 5;
  if (webData.ogTitle) seoScore += 5;
  seoScore = Math.max(5, Math.min(100, seoScore));
  
  const mobileFriendly = !!webData.viewport && webData.viewport.includes('width=device-width');
  const overallScore = Math.round((speedScore * 0.25) + (seoScore * 0.25) + (mobileFriendly ? 15 : 3) + (webData.hasMetaPixel || webData.hasGoogleAnalytics ? 10 : 0) + (webData.hasContactForm ? 5 : 0) + (webData.hasSSL ? 5 : 0) + (webData.hasBookingSystem ? 5 : 0) + (webData.hasLiveChat ? 3 : 0) + (webData.wordCount > 300 ? 5 : 2));
  
  return { speedScore, seoScore, mobileFriendly, overallScore: Math.min(100, overallScore) };
};

// ============ MAIN COMPONENT ============
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
    let interval;
    if (autoMode && unanalyzed.length > 0) {
      interval = setInterval(() => { if (unanalyzed[0]) analyzeLead(unanalyzed[0]); }, 2000);
    }
    return () => clearInterval(interval);
  }, [autoMode, unanalyzed.length]);

  const analyzeLead = async (lead) => {
    setAnalyzing(lead.id);
    setFetchStatus(`Fetching ${lead.website}...`);
    try {
      const webData = await fetchWebsiteData(lead.website);
      if (webData) {
        setFetchStatus('Analyzing real data...');
        const scores = calculateScores(webData);
        updateLead(lead.id, {
          status: 'analyzed',
          websiteSpeedScore: scores.speedScore,
          seoScore: scores.seoScore,
          mobileFriendly: scores.mobileFriendly,
          hasMetaPixel: webData.hasMetaPixel,
          hasGoogleAdsTracking: webData.hasGoogleAds,
          hasGoogleAnalytics: webData.hasGoogleAnalytics,
          hasBookingSystem: webData.hasBookingSystem,
          hasLiveChat: webData.hasLiveChat,
          sslValid: webData.hasSSL,
          analysisJson: { websiteData: webData, scores, fetched: true, analyzedAt: new Date().toISOString() },
          score: scores.overallScore,
        });
        toast.success(`✅ ${lead.businessName} - ${scores.overallScore}/100 (Real Data)`);
      } else {
        setFetchStatus('Site unreachable, using AI...');
        const aiAnalysis = await aiService.analyzeWebsite(lead);
        updateLead(lead.id, {
          status: 'analyzed',
          websiteSpeedScore: aiAnalysis.speedScore,
          seoScore: aiAnalysis.seoScore,
          mobileFriendly: aiAnalysis.mobileFriendly,
          hasMetaPixel: aiAnalysis.hasMetaPixel,
          analysisJson: { ...aiAnalysis, fetched: false, analyzedAt: new Date().toISOString() },
          score: aiAnalysis.overallScore,
        });
        toast.success(`⚠️ ${lead.businessName} - ${aiAnalysis.overallScore}/100 (Estimated)`);
      }
    } catch (error) {
      toast.error(`Failed: ${lead.businessName}`);
    } finally {
      setAnalyzing(null);
      setFetchStatus('');
    }
  };

  const analyzeAll = async () => {
    const batch = unanalyzed.slice(0, 10);
    for (const lead of batch) { await analyzeLead(lead); await new Promise(r => setTimeout(r, 800)); }
    toast.success('Bulk analysis complete!');
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  // Pre-computed stat items with fixed Tailwind classes
  const statItems = [
    { label: 'Pending', value: unanalyzed.length, className: 'text-blue-600' },
    { label: 'Analyzed', value: analyzed.length, className: 'text-purple-600' },
    { label: 'Good (80+)', value: analyzed.filter(l => l.score >= 80).length, className: 'text-green-600' },
    { label: 'Average', value: analyzed.filter(l => l.score >= 50 && l.score < 80).length, className: 'text-yellow-600' },
    { label: 'Poor (<50)', value: analyzed.filter(l => l.score < 50).length, className: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌐 Website Analyzer</h1>
          <p className="text-gray-500 mt-1">Real website analysis for <span className="font-semibold text-purple-600">{activeFunnel?.name}</span> funnel</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setAutoMode(!autoMode)} className={`px-4 py-2 rounded-lg text-sm font-medium ${autoMode ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {autoMode ? '🟢 Auto' : '⭕ Manual'}
          </button>
          <button onClick={analyzeAll} disabled={unanalyzed.length === 0 || analyzing} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium">
            ⚡ Analyze All ({Math.min(10, unanalyzed.length)})
          </button>
        </div>
      </div>

      {fetchStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-700">
          <span className="animate-pulse">⏳</span> {fetchStatus}
        </div>
      )}

      {/* Stats - FIXED with static classes */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statItems.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 text-center">
            <div className={`text-2xl font-bold ${s.className}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold mb-3">⏳ Pending Analysis ({unanalyzed.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {unanalyzed.map(lead => (
              <div key={lead.id} className={`p-3 rounded-lg border flex items-center justify-between ${analyzing === lead.id ? 'border-purple-300 bg-purple-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{lead.businessName}</div>
                  <div className="text-xs text-gray-500 truncate">{lead.website}</div>
                </div>
                <button onClick={() => analyzeLead(lead)} disabled={analyzing === lead.id} className="ml-3 px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50 flex-shrink-0">
                  {analyzing === lead.id ? '⏳' : '🔍'}
                </button>
              </div>
            ))}
            {unanalyzed.length === 0 && <p className="text-gray-400 text-center py-8">All leads analyzed! 🎉</p>}
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold mb-3">📊 Analyzed Leads ({analyzed.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {analyzed.slice(-20).reverse().map(lead => (
              <div key={lead.id} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedLead(lead)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate">{lead.businessName}</span>
                  <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full border ${getScoreBadge(lead.score)}`}>
                    {lead.score}/100
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-xs text-gray-500">
                  <span>Speed: {lead.websiteSpeedScore}</span>
                  <span>SEO: {lead.seoScore}</span>
                  <span>Mobile: {lead.mobileFriendly ? '✅' : '❌'}</span>
                  <span>{lead.analysisJson?.fetched ? '📡 Real' : '🤖 AI'}</span>
                </div>
              </div>
            ))}
            {analyzed.length === 0 && <p className="text-gray-400 text-center py-8">No analyzed leads yet</p>}
          </div>
        </div>
      </div>

      {/* Detailed Analysis Modal */}
      {selectedLead?.analysisJson && (
        <div className="bg-white rounded-xl shadow-lg border-2 border-purple-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{selectedLead.businessName}</h2>
              <p className="text-sm text-gray-500">{selectedLead.website} {selectedLead.analysisJson?.fetched ? '📡 Real Data' : '🤖 AI Estimated'}</p>
            </div>
            <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {/* Score Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Speed', value: selectedLead.websiteSpeedScore || '-' },
              { label: 'SEO', value: selectedLead.seoScore || '-' },
              { label: 'Mobile', value: selectedLead.mobileFriendly ? '✅' : '❌' },
              { label: 'SSL', value: selectedLead.sslValid ? '✅' : '❌' },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900">{item.value}</div>
                <div className="text-xs text-gray-500">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Website Data Details */}
          {selectedLead.analysisJson?.websiteData && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700">📊 Website Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <DetailItem label="Title" value={selectedLead.analysisJson.websiteData.title} />
                <DetailItem label="Meta Description" value={selectedLead.analysisJson.websiteData.metaDescription} />
                <DetailItem label="H1 Tags" value={selectedLead.analysisJson.websiteData.h1Count} />
                <DetailItem label="Images" value={`${selectedLead.analysisJson.websiteData.images} (${selectedLead.analysisJson.websiteData.imagesWithoutAlt} missing alt)`} />
                <DetailItem label="Links" value={selectedLead.analysisJson.websiteData.totalLinks} />
                <DetailItem label="Word Count" value={selectedLead.analysisJson.websiteData.wordCount} />
                <DetailItem label="SSL" value={selectedLead.analysisJson.websiteData.hasSSL ? '✅ Valid' : '❌ Missing'} />
                <DetailItem label="Language" value={selectedLead.analysisJson.websiteData.language} />
              </div>
            </div>
          )}

          {/* Technology Stack */}
          {selectedLead.analysisJson?.websiteData && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">🔧 Technology Stack</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'WordPress', val: selectedLead.analysisJson.websiteData.isWordPress },
                  { key: 'Shopify', val: selectedLead.analysisJson.websiteData.isShopify },
                  { key: 'jQuery', val: selectedLead.analysisJson.websiteData.usesJQuery },
                  { key: 'Bootstrap', val: selectedLead.analysisJson.websiteData.usesBootstrap },
                  { key: 'React', val: selectedLead.analysisJson.websiteData.usesReact },
                ].map((tech, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${tech.val ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                    {tech.val ? '✅' : '❌'} {tech.key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tracking Pixels */}
          {selectedLead.analysisJson?.websiteData && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">📈 Tracking & Analytics</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'Google Analytics', val: selectedLead.analysisJson.websiteData.hasGoogleAnalytics },
                  { key: 'Google Tag Manager', val: selectedLead.analysisJson.websiteData.hasGoogleTagManager },
                  { key: 'Meta Pixel', val: selectedLead.analysisJson.websiteData.hasMetaPixel },
                  { key: 'Google Ads', val: selectedLead.analysisJson.websiteData.hasGoogleAds },
                  { key: 'Hotjar', val: selectedLead.analysisJson.websiteData.hasHotjar },
                ].map((track, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${track.val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {track.val ? '✅' : '❌'} {track.key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {selectedLead.analysisJson?.websiteData && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm text-gray-700 mb-2">⚡ Features</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'Contact Form', val: selectedLead.analysisJson.websiteData.hasContactForm },
                  { key: 'Live Chat', val: selectedLead.analysisJson.websiteData.hasLiveChat },
                  { key: 'Booking System', val: selectedLead.analysisJson.websiteData.hasBookingSystem },
                  { key: 'Cookie Consent', val: selectedLead.analysisJson.websiteData.hasCookieConsent },
                  { key: 'Open Graph Tags', val: !!(selectedLead.analysisJson.websiteData.ogTitle || selectedLead.analysisJson.websiteData.ogImage) },
                  { key: 'Favicon', val: selectedLead.analysisJson.websiteData.hasFavicon },
                  { key: 'Schema Markup', val: selectedLead.analysisJson.websiteData.hasSchema },
                  { key: 'Canonical URL', val: !!selectedLead.analysisJson.websiteData.canonical },
                ].map((feat, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${feat.val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {feat.val ? '✅' : '❌'} {feat.key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper component for detail items
function DetailItem({ label, value }) {
  return (
    <div className="p-2 bg-gray-50 rounded-lg">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-xs font-medium text-gray-900 truncate">{typeof value === 'string' ? value.substring(0, 50) : value || 'N/A'}</div>
    </div>
  );
}